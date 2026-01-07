import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIResponseSchema, type AIResponseType } from '@/lib/ai-structures';
import { createTicket, saveMessage, getCurrentUser, updateTicketStatus } from '@/lib/supabase-helpers';
import { notifyNewTicket } from '@/lib/notifications';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitExceededResponse } from '@/lib/rate-limit';
import { 
  type ConversationSlots,
  extractSlotsFromConversation, 
  getMissingSlots, 
  canCreateTicket,
  isReadyForRecap,
  buildNikiSystemPrompt,
  getQuestionForSlot,
  generateRecapMessage,
  SLOT_NAMES_IT,
  CATEGORY_NAMES_IT,
  calculatePriceRange
} from '@/lib/system-prompt';

// ============================================
// NORMALIZZAZIONE TESTO (typos, dialetti, etc.)
// ============================================
function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  
  const typoMap: Record<string, string> = {
    'alagamento': 'allagamento', 'alagato': 'allagato', 'allagametno': 'allagamento',
    'ovuneuqe': 'ovunque', 'solpito': 'scoppiato', 'sepozzata': 'spezzata',
    'chisua': 'chiusa', 'blocataaa': 'bloccata', 'presaaaa': 'presa',
    'brucoato': 'bruciato', 'preseee': 'prese', 'bgano': 'bagno',
    'foco': 'fuoco', 'semrba': 'sembra', 'tremamo': 'tremano',
  };
  
  for (const [typo, correct] of Object.entries(typoMap)) {
    normalized = normalized.replace(new RegExp(typo, 'gi'), correct);
  }
  
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');
  
  return normalized;
}

// ============================================
// ESTRAZIONE DATI DAL MESSAGGIO (fallback)
// ============================================
function extractDataFromMessage(message: string): Partial<ConversationSlots> {
  const text = normalizeText(message);
  const extracted: Partial<ConversationSlots> = {};
  
  // Estrai telefono
  const phonePatterns = [
    /(\+39\s?)?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/,
    /(\+39\s?)?\d{3}[\s.-]?\d{6,7}/,
    /3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}/,
    /0\d{2,4}[\s.-]?\d{5,8}/
  ];
  
  for (const pattern of phonePatterns) {
    const match = message.match(pattern);
    if (match) {
      extracted.phoneNumber = match[0].replace(/[\s.-]/g, '');
      break;
    }
  }
  
  // Estrai indirizzo
  const addressMatch = message.match(/(?:via|corso|piazza|viale|vicolo|largo)\s+[a-zàèéìòùáéíóú\s]+[\s,]*\d+[a-z]?/i);
  if (addressMatch) {
    extracted.serviceAddress = addressMatch[0].trim();
  }
  
  // Estrai categoria
  const categoryKeywords: Record<string, string[]> = {
    plumbing: ['idraulico', 'acqua', 'tubo', 'perdita', 'scarico', 'rubinetto', 'allagamento', 'wc', 'bagno'],
    electric: ['elettric', 'luce', 'presa', 'corrente', 'salvavita', 'blackout', 'scintill'],
    locksmith: ['fabbro', 'serratura', 'chiave', 'porta', 'bloccato', 'chiuso fuori'],
    climate: ['condizionatore', 'caldaia', 'riscaldamento', 'termosifone', 'clima', 'aria condizionata']
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      extracted.problemCategory = category as ConversationSlots['problemCategory'];
      break;
    }
  }
  
  // Estrai urgenza
  const emergencyKeywords = ['urgente', 'emergenza', 'subito', 'allagamento', 'bloccato fuori', 'senza luce'];
  if (emergencyKeywords.some(kw => text.includes(kw))) {
    extracted.urgencyLevel = 'emergency';
  }
  
  // Dettagli problema
  if (message.length > 15) {
    extracted.problemDetails = message.slice(0, 200);
  }
  
  return extracted;
}

// ============================================
// ANALISI PRIORITÀ
// ============================================
function determinePriority(slots: ConversationSlots): 'low' | 'medium' | 'high' | 'emergency' {
  if (slots.urgencyLevel === 'emergency') return 'emergency';
  
  const details = (slots.problemDetails || '').toLowerCase();
  
  // Emergency keywords
  const emergencyKeywords = ['allagamento', 'bloccato fuori', 'senza corrente', 'gas', 'incendio', 'pericolo'];
  if (emergencyKeywords.some(kw => details.includes(kw))) {
    return 'emergency';
  }
  
  // High priority
  const highKeywords = ['perdita', 'urgente', 'oggi', 'subito'];
  if (highKeywords.some(kw => details.includes(kw))) {
    return 'high';
  }
  
  return 'medium';
}

// ============================================
// GEMINI AI SETUP
// ============================================
const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (geminiApiKey && geminiApiKey !== 'placeholder_gemini_api_key') {
  genAI = new GoogleGenerativeAI(geminiApiKey);
}

function stringifyContent(content: unknown): string {
  if (typeof content === 'string') return content;
  try {
    return JSON.stringify(content);
  } catch {
    return String(content ?? '');
  }
}

// ============================================
// FALLBACK RESPONSE (quando Gemini non è disponibile)
// ============================================
function generateFallbackResponse(
  slots: ConversationSlots,
  ticketId: string | null,
  isFirstMessage: boolean,
  userConfirmed: boolean = false
): AIResponseType {
  const missingSlots = getMissingSlots(slots);
  
  // Se è il primo messaggio, saluta e inizia a raccogliere dati
  if (isFirstMessage) {
    let greeting = "Ciao! Sono Niki, il tuo assistente per emergenze domestiche 🔧\n\n";
    
    if (slots.problemCategory && slots.problemCategory !== 'generic') {
      greeting += `Ho capito che hai un problema di tipo **${CATEGORY_NAMES_IT[slots.problemCategory] || slots.problemCategory}**. `;
    }
    
    if (slots.urgencyLevel === 'emergency') {
      greeting += "🚨 **Capisco che è un'emergenza!** Ti aiuto subito.\n\n";
    }
    
    // Chiedi il primo dato mancante
    if (missingSlots.length > 0) {
      greeting += getQuestionForSlot(missingSlots[0]);
    } else {
      greeting += "Ho bisogno di alcune informazioni per inviarti un tecnico.";
    }
    
    return { type: 'text', content: greeting };
  }
  


  // Se abbiamo tutti i dati E l'utente ha confermato, il ticket dovrebbe essere stato creato
  if (missingSlots.length === 0 && userConfirmed && ticketId) {
    return {
      type: 'confirmation',
      content: {
        message: `La tua richiesta è stata confermata! Un tecnico ${CATEGORY_NAMES_IT[slots.problemCategory || 'generic'] || ''} ti contatterà al numero ${slots.phoneNumber} il prima possibile.`,
        ticketId: ticketId
      }
    } as AIResponseType;
  }

  // Se abbiamo tutti i dati ma NON c'è ancora conferma, mostra il riepilogo
  if (missingSlots.length === 0 && !userConfirmed) {
    const priority = determinePriority(slots);
    const timeEstimate = priority === 'emergency' ? '30-60 minuti' : 
                         priority === 'high' ? '2-4 ore' : '24-48 ore';
    
    return {
      type: 'recap',
      content: {
        title: "Riepilogo della tua richiesta",
        summary: "Ho raccolto tutte le informazioni necessarie. Ecco il riepilogo:",
        details: {
          problema: slots.problemDetails || 'Non specificato',
          categoria: CATEGORY_NAMES_IT[slots.problemCategory || 'generic'] || slots.problemCategory || 'Generico',
          indirizzo: slots.serviceAddress || 'Non specificato',
          telefono: slots.phoneNumber || 'Non specificato'
        },
        estimatedTime: timeEstimate,
        ticketId: ticketId || undefined,
        confirmationNeeded: true
      }
    } as AIResponseType;
  }
  
  // Chiedi il prossimo dato mancante
  const nextSlot = missingSlots[0];
  let response = "";
  
  // Conferma i dati già raccolti (se ce ne sono) - max ogni 2 slot
  const collectedCount = 4 - missingSlots.length;
  if (collectedCount > 0 && collectedCount % 2 === 0) {
    const collectedData: string[] = [];
    if (slots.phoneNumber) collectedData.push(`📞 ${slots.phoneNumber}`);
    if (slots.serviceAddress) collectedData.push(`📍 ${slots.serviceAddress}`);
    if (slots.problemCategory && slots.problemCategory !== 'generic') {
      collectedData.push(`🔧 ${CATEGORY_NAMES_IT[slots.problemCategory]}`);
    }
    
    if (collectedData.length > 0) {
      response += "✅ Registrato: " + collectedData.join(" • ") + "\n\n";
    }
  }
  
  response += getQuestionForSlot(nextSlot);
  
  return { type: 'text', content: response };
}

// ============================================
// GENERAZIONE RISPOSTA AI (con Gemini)
// ============================================
async function generateAIResponse(
  messages: Array<{ role: string; content: unknown; photo?: string }>,
  slots: ConversationSlots,
  ticketId: string | null,
  isFirstMessage: boolean,
  userConfirmed: boolean = false
): Promise<AIResponseType> {
  // Fallback se Gemini non è disponibile
  if (!genAI) {
    return generateFallbackResponse(slots, ticketId, isFirstMessage, userConfirmed);
  }
  
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  // Costruisci il prompt di sistema con awareness degli slot
  const systemPrompt = buildNikiSystemPrompt(slots, ticketId);
  
  // Costruisci lo storico conversazione
  const conversationHistory = messages
    .map(m => `${m.role.toUpperCase()}: ${stringifyContent(m.content)}`)
    .join('\n');
  
  const fullPrompt = `
${systemPrompt}

# STORICO CONVERSAZIONE
${conversationHistory}

# ISTRUZIONI FINALI
Basandoti sullo storico e sui dati raccolti, genera la prossima risposta seguendo il flusso di slot-filling.
Ricorda: NON creare ticket finché non hai TUTTI i dati (telefono, indirizzo, categoria, dettagli).

Rispondi SOLO con un JSON valido nel formato specificato.
`;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse e valida la risposta JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Se l'AI dice di creare ticket ma non abbiamo tutti i dati, override
        if (parsed.shouldCreateTicket && !canCreateTicket(slots)) {
          parsed.shouldCreateTicket = false;
        }
        
        // Valida con Zod
        const validated = AIResponseSchema.safeParse(parsed);
        if (validated.success) {
          return validated.data;
        }
        
        // Se la validazione fallisce ma abbiamo content, usa quello
        if (parsed.content) {
          return {
            type: parsed.type || 'text',
            content: parsed.content
          };
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
      }
    }
    
    // Fallback: estrai testo semplice dalla risposta
    const cleanText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/\{[\s\S]*\}/g, '')
      .trim();
    
    if (cleanText) {
      return { type: 'text', content: cleanText };
    }
    
    // Ultimo fallback
    return generateFallbackResponse(slots, ticketId, isFirstMessage, slots.userConfirmed || false);
    
  } catch (error) {
    console.error('Errore Gemini:', error);
    return generateFallbackResponse(slots, ticketId, isFirstMessage, slots.userConfirmed || false);
  }
}

// ============================================
// MAIN API HANDLER
// ============================================
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(`assist:${clientId}`, RATE_LIMITS.assist);
    
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const body = await request.json();
    const { messages, ticketId: existingTicketId } = body;
    
    // Ottieni utente (può essere null per ospiti)
    const user = await getCurrentUser();
    const userEmail = user?.email || undefined;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messaggi non validi' }, { status: 400 });
    }

    // Estrai l'ultimo messaggio utente
    const lastUserMessage = messages
      .filter((m: { role: string }) => m.role === 'user')
      .pop();

    if (!lastUserMessage) {
      return NextResponse.json({ error: 'Nessun messaggio utente' }, { status: 400 });
    }

    const isFirstMessage = messages.filter((m: { role: string }) => m.role === 'user').length === 1;

    // ========================================
    // SLOT FILLING: Estrai dati dalla conversazione
    // ========================================
    const conversationMessages = messages.map((m: { role: string; content: unknown }) => ({
      role: m.role,
      content: stringifyContent(m.content)
    }));
    
    // Estrai slot già presenti nella conversazione
    const slots = extractSlotsFromConversation(conversationMessages, userEmail);

    // Se l'utente è loggato, imposta direttamente l'email negli slot
    if (userEmail && !slots.userEmail) {
      slots.userEmail = userEmail;
    }
    
    // Aggiorna con eventuali nuovi dati dall'ultimo messaggio
    const newData = extractDataFromMessage(stringifyContent(lastUserMessage.content));
    Object.assign(slots, {
      ...slots,
      ...Object.fromEntries(
        Object.entries(newData).filter(([_, v]) => v !== undefined && v !== null)
      )
    });

    // ========================================
    // LOGICA DI CREAZIONE TICKET
    // ========================================
    let ticketId = existingTicketId;
    let shouldCreateTicket = false;
    
    // Determina se possiamo creare il ticket
    const hasAllRequiredData = canCreateTicket(slots);
    const missingSlots = getMissingSlots(slots);
    const userConfirmed = slots.userConfirmed || false;
    
    // Log per debug
    console.log('📊 Slot Status:', {
      hasAllData: hasAllRequiredData,
      userConfirmed,
      missing: missingSlots,
      slots: {
        phone: slots.phoneNumber ? '✅' : '❌',
        address: slots.serviceAddress ? '✅' : '❌',
        category: slots.problemCategory ? '✅' : '❌',
        details: slots.problemDetails ? '✅' : '❌'
      }
    });
    
    // Crea ticket se:
    // 1. Non esiste già un ticket
    // 2. Abbiamo TUTTI i dati necessari: email, città, indirizzo completo, categoria, descrizione dettagliata, telefono
    // 3. L'utente ha un ID
    const hasAllDataForTicketCreation = slots.userEmail &&
                                        slots.city &&
                                        slots.serviceAddress && // Indirizzo completo, non solo città
                                        slots.problemCategory &&
                                        (slots.problemDetails || slots.hasPhoto) &&
                                        slots.phoneNumber; // Telefono obbligatorio

    const shouldCreateNewTicket = !ticketId && hasAllDataForTicketCreation && user?.id;

    if (shouldCreateNewTicket) {

      const priority = determinePriority(slots);

      console.log('🎫 Creazione ticket con:', {
        userId: user.id,
        category: slots.problemCategory,
        address: slots.serviceAddress,
        phone: slots.phoneNumber,
        priority
      });

      // Usa solo il problema estratto, non tutto il messaggio
      const problemDescription = slots.problemDetails ||
        'Problema descritto dall\'utente - dettagli da confermare con il tecnico';

      const ticket = await createTicket(
        user.id,
        slots.problemCategory || 'handyman',
        problemDescription,
        priority,
        slots.serviceAddress || undefined,
        undefined, // messageContent
        'pending_verification' // Ticket in attesa di conferma via Magic Link
      );

      if (ticket) {
        ticketId = ticket.id;

        // Salva il messaggio
        await saveMessage(ticketId, 'user', lastUserMessage.content, lastUserMessage.photo);

        console.log('✅ Ticket creato:', ticketId);

        // ========================================
        // FLUSSO DIFFERENZIATO: LOGGATO vs OSPITE
        // ========================================
        
        // Se l'utente è GIÀ AUTENTICATO (ha una sessione Supabase valida),
        // conferma immediatamente il ticket e invia notifiche Telegram
        if (user && user.id && userEmail && !userEmail.includes('guest')) {
          console.log('🔐 Utente già autenticato - conferma immediata');
          
          // Aggiorna status a confirmed
          await updateTicketStatus(ticketId, 'confirmed');
          
          // Calcola range prezzo per la notifica
          const priceRange = calculatePriceRange(slots);
          
          // Invia notifica Telegram IMMEDIATAMENTE
          await notifyNewTicket({
            id: ticketId,
            category: slots.problemCategory || 'generic',
            priority: priority,
            city: slots.city,
            price_range_min: priceRange.min,
            price_range_max: priceRange.max,
            description: slots.problemDetails,
            address: slots.serviceAddress,
            phone: slots.phoneNumber,
          });
          
          console.log('📤 Telegram notification sent for authenticated user');
          
          // Restituisci conferma immediata
          return NextResponse.json({
            type: 'confirmation',
            content: {
              message: `🎉 La tua richiesta è stata confermata!\n\nUn tecnico **${CATEGORY_NAMES_IT[slots.problemCategory || 'generic']}** ti chiamerà al numero **${slots.phoneNumber}** entro 30-60 minuti per confermare l'appuntamento.\n\n📍 Intervento a: ${slots.serviceAddress}\n💰 Preventivo: ${priceRange.min}€ - ${priceRange.max}€`,
              ticketId: ticketId
            },
            _debug: {
              ticketCreated: true,
              ticketId,
              status: 'confirmed',
              telegramSent: true
            }
          });
        }
        
        // Se l'utente NON è autenticato, richiedi Magic Link
        return NextResponse.json({
          type: 'auth_required',
          content: {
            content: `Perfetto! Ho raccolto tutte le informazioni necessarie per la tua richiesta di intervento **${CATEGORY_NAMES_IT[slots.problemCategory || 'generic']}**.\n\n📧 **Per completare la richiesta in sicurezza, accedi con la tua email.**\n\nRiceverai un link di conferma e solo dopo il click il tecnico verrà avvisato.`,
            ticketData: {
              category: slots.problemCategory,
              city: slots.city,
              address: slots.serviceAddress,
              description: slots.problemDetails,
              phone: slots.phoneNumber
            }
          }
        });
      }
    } else if (!ticketId && hasAllRequiredData && !userConfirmed) {
      console.log('⏳ Tutti i dati raccolti, in attesa di conferma utente');
    }

    // ========================================
    // GENERA RISPOSTA AI
    // ========================================
    const aiResponse = await generateAIResponse(
      messages,
      slots,
      ticketId,
      isFirstMessage,
      userConfirmed
    );

    // Salva la risposta AI se abbiamo un ticket
    if (ticketId && typeof aiResponse.content === 'string') {
      await saveMessage(ticketId, 'assistant', aiResponse.content);
    }

    // Includi info sui dati raccolti nella risposta (per debug/UI)
    return NextResponse.json({
      ...aiResponse,
      _debug: {
        ticketCreated: shouldCreateTicket,
        ticketId,
        slotsCollected: {
          phone: !!slots.phoneNumber,
          address: !!slots.serviceAddress,
          category: !!slots.problemCategory,
          details: !!slots.problemDetails
        },
        missingSlots: missingSlots.map(s => SLOT_NAMES_IT[s] || s)
      }
    });

  } catch (error) {
    console.error('Errore nell\'AI assist:', error);
    return NextResponse.json(
      { 
        type: 'text',
        content: 'Mi scusi, ho avuto un problema tecnico. Può ripetere la sua richiesta? Se è un\'emergenza, chiami direttamente il numero +39 346 102 7447.'
      },
      { status: 500 }
    );
  }
}
