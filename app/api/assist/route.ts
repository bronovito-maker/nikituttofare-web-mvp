import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIResponseSchema, type AIResponseType } from '@/lib/ai-structures';
import { createTicket, saveMessage, getOrCreateProfile, getCurrentUser } from '@/lib/supabase-helpers';
import { notifyNewTicket } from '@/lib/notifications';

// Funzione di fallback per l'analisi dei messaggi quando Gemini non è disponibile
function fallbackMessageAnalysis(message: string) {
  const lowerMessage = message.toLowerCase();

  // Analisi base per determinare la categoria
  let category = 'generic';
  if (lowerMessage.includes('idraulico') || lowerMessage.includes('acqua') || lowerMessage.includes('tubo')) {
    category = 'plumbing';
  } else if (lowerMessage.includes('elettric') || lowerMessage.includes('luce') || lowerMessage.includes('presa')) {
    category = 'electric';
  } else if (lowerMessage.includes('fabbro') || lowerMessage.includes('serratura') || lowerMessage.includes('porta')) {
    category = 'locksmith';
  } else if (lowerMessage.includes('clima') || lowerMessage.includes('condizionatore') || lowerMessage.includes('caldaia')) {
    category = 'climate';
  }

  // Determina priorità basandosi su parole chiave urgenti
  let priority = 'medium';
  if (lowerMessage.includes('emergenza') || lowerMessage.includes('urgente') || lowerMessage.includes('subito')) {
    priority = 'high';
  } else if (lowerMessage.includes('rotto') || lowerMessage.includes('non funziona') || lowerMessage.includes('guasto')) {
    priority = 'high';
  }

  // Estrai indirizzo se presente
  let address = null;
  const addressPatterns = [
    /(?:via|corso|piazza|viale|piazzale)\s+[^,]+(?:,\s*\d+)?/i,
    /(?:indirizzo|abito in)\s*[:\-]?\s*([^.!?]+)/i
  ];

  for (const pattern of addressPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      address = match[1].trim();
      break;
    }
  }

  return {
    category,
    priority,
    shouldCreateTicket: true,
    address,
    emergency: priority === 'emergency',
    needsMoreInfo: [],
    responseType: 'text'
  };
}

// Inizializza Gemini AI con fallback
const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (geminiApiKey && geminiApiKey !== 'placeholder_gemini_api_key') {
  genAI = new GoogleGenerativeAI(geminiApiKey);
}

function stringifyContent(content: unknown) {
  if (typeof content === 'string') return content;
  try {
    return JSON.stringify(content);
  } catch {
    return String(content ?? '');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages, ticketId: existingTicketId } = await request.json();
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messaggi non validi' }, { status: 400 });
    }

    // Estrai l'ultimo messaggio dell'utente
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop();

    if (!lastUserMessage) {
      return NextResponse.json({ error: 'Nessun messaggio utente trovato' }, { status: 400 });
    }

    // Analizza il messaggio e determina se creare un ticket
    const analysis = await analyzeMessage(stringifyContent(lastUserMessage.content), messages);

    let ticketId = existingTicketId;

    // Se non c'è un ticket esistente e dobbiamo crearne uno, fallo
    if (!ticketId && analysis.shouldCreateTicket) {
      const ticket = await createTicket(
        user.id,
        analysis.category,
        stringifyContent(lastUserMessage.content),
        analysis.priority,
        analysis.address
      );

      if (ticket) {
        ticketId = ticket.id;

        // Salva il messaggio iniziale
        await saveMessage(ticketId, 'user', lastUserMessage.content, lastUserMessage.photo);

        // Notifica Telegram per il nuovo ticket
        await notifyNewTicket(ticket);
      }
    }

    // Genera risposta AI basata sull'analisi
    const aiResponse = await generateAIResponse(messages, analysis, ticketId);

    // Salva la risposta AI se abbiamo un ticket
    if (ticketId && typeof aiResponse === 'object' && aiResponse.type === 'text') {
      await saveMessage(ticketId, 'assistant', aiResponse.content as string);
    }

    return NextResponse.json(aiResponse);

  } catch (error) {
    console.error('Errore nell\'AI assist:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

async function analyzeMessage(message: string, conversationHistory: any[]) {
  if (!genAI) {
    // Fallback senza AI - analisi base del messaggio
    return fallbackMessageAnalysis(message);
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const analysisPrompt = `
Sei Niki, l'assistente virtuale di NikiTuttoFare, servizio di pronto intervento H24 per emergenze domestiche e HORECA.

ANALIZZA QUESTO MESSAGGIO DELL'UTENTE:
"${message}"

STORICO CONVERSAZIONE:
${conversationHistory.map(m => `${m.role}: ${stringifyContent(m.content)}`).join('\n')}

DEVI RESTITUIRE UN JSON con questa struttura:
{
  "category": "plumbing|electric|locksmith|climate|generic",
  "priority": "low|medium|high|emergency",
  "shouldCreateTicket": true|false,
  "address": "indirizzo estratto o null",
  "emergency": true|false,
  "needsMoreInfo": ["array di info mancanti"],
  "responseType": "text|form|recap"
}

LOGICA DI CLASSIFICAZIONE:
- plumbing: perdite acqua, tubi, scarichi, rubinetti
- electric: problemi elettrici, luci, prese, interruttori
- locksmith: serrature, chiavi perse, porte bloccate
- climate: condizionatori, caldaie, riscaldamento
- generic: tutto il resto

PRIORITY:
- emergency: pericolo immediato, inondazioni, incendi, persone bloccate
- high: forti perdite, mancanza corrente, impossibilità accesso casa
- medium: problemi minori, manutenzione
- low: richieste generiche senza urgenza

CRITERI PER CREARE TICKET:
- Se è un problema chiaro e specifico → true
- Se chiede informazioni generali → false
- Se è solo saluto → false

Se trovi un indirizzo nel messaggio, estrailo nel campo "address".
`;

  try {
    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const text = response.text();

    // Parse del JSON dalla risposta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback se il parsing fallisce
    return {
      category: 'generic',
      priority: 'medium',
      shouldCreateTicket: true,
      address: null,
      emergency: false,
      needsMoreInfo: [],
      responseType: 'text'
    };

  } catch (error) {
    console.error('Errore nell\'analisi del messaggio:', error);
    return {
      category: 'generic',
      priority: 'medium',
      shouldCreateTicket: true,
      address: null,
      emergency: false,
      needsMoreInfo: [],
      responseType: 'text'
    };
  }
}

// Funzione di fallback per la generazione delle risposte quando Gemini non è disponibile
function fallbackAIResponse(analysis: Record<string, unknown>, ticketId: string | null): AIResponseType {
  let message = "Ho ricevuto la tua richiesta";

  if (ticketId) {
    message += ` e creato un ticket con ID ${ticketId.slice(-8)}. `;
  } else {
    message += ". ";
  }

  const categoryNames: Record<string, string> = {
    plumbing: "idraulico",
    electric: "elettricista",
    locksmith: "fabbro",
    climate: "climatizzazione",
    generic: "generico"
  };

  const categoryName = categoryNames[analysis.category as string] || analysis.category;

  if (analysis.emergency) {
    message += `Riconosco che si tratta di un'emergenza. Un tecnico specializzato in ${categoryName} verrà inviato immediatamente.`;
  } else {
    message += `Un tecnico specializzato in ${categoryName} ti contatterà entro ${
      analysis.priority === 'high' ? '1 ora' : '24 ore'
    } per organizzare l'intervento.`;
  }

  const needsMoreInfo = analysis.needsMoreInfo as string[] | undefined;
  if (needsMoreInfo && needsMoreInfo.length > 0) {
    message += `\n\nPer procedere più velocemente, potresti fornire: ${needsMoreInfo.join(', ')}.`;
  }

  return {
    type: 'text',
    content: message
  };
}

async function generateAIResponse(messages: any[], analysis: any, ticketId: string | null): Promise<AIResponseType> {
  if (!genAI) {
    // Fallback senza AI
    return fallbackAIResponse(analysis, ticketId);
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const contextPrompt = `
Sei Niki, l'assistente amichevole e professionale di NikiTuttoFare.
Servizio di pronto intervento H24 per emergenze domestiche e HORECA.

CONTESTO ATTUALE:
- Categoria rilevata: ${analysis.category}
- Priorità: ${analysis.priority}
- Emergenza: ${analysis.emergency}
- Ticket creato: ${!!ticketId}
- Info mancanti: ${analysis.needsMoreInfo.join(', ') || 'nessuna'}

STORICO CONVERSAZIONE:
${messages.map(m => `${m.role}: ${stringifyContent(m.content)}`).join('\n')}

ISTRUZIONI:
1. Sii sempre gentile, rassicurante e professionale
2. Parla in italiano
3. Se è un'emergenza, mostra urgenza e rassicura che interverremo presto
4. Se abbiamo creato un ticket, conferma e dai ID ticket
5. Se mancano info, chiedi specificamente quelle necessarie
6. Non chiedere mai troppe cose insieme - una alla volta
7. Se tutto è chiaro, procedi con la conferma

RESPONDI CON UN JSON nella struttura:
{
  "type": "text|form|recap",
  "content": "testo della risposta O oggetto form"
}

Se type="text", content è una stringa.
Se type="form", content è un oggetto con fields.
Se type="recap", content è il riepilogo finale.
`;

  try {
    const result = await model.generateContent(contextPrompt);
    const response = await result.response;
    const text = response.text();

    // Parse e valida la risposta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const validated = AIResponseSchema.safeParse(parsed);

      if (validated.success) {
        return validated.data;
      }
    }

    // Fallback risposta di testo
    let fallbackMessage = "Ho capito la tua richiesta. ";

    if (ticketId) {
      fallbackMessage += `Ho creato un ticket con ID ${ticketId}. `;
    }

    if (analysis.emergency) {
      fallbackMessage += "Riconosco che questa è un'emergenza e un tecnico verrà inviato immediatamente.";
    } else if (analysis.needsMoreInfo.length > 0) {
      fallbackMessage += `Per procedere ho bisogno di: ${analysis.needsMoreInfo.join(', ')}.`;
    } else {
      fallbackMessage += "Un tecnico ti contatterà presto per organizzare l'intervento.";
    }

    return {
      type: 'text',
      content: fallbackMessage
    };

  } catch (error) {
    console.error('Errore nella generazione della risposta AI:', error);

    return {
      type: 'text',
      content: 'Mi scusi, ho avuto un problema tecnico. Può ripetere la sua richiesta? Un tecnico è comunque stato avvisato e la contatterà presto.'
    };
  }
}