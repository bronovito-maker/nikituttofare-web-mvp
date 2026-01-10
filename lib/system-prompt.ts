// lib/system-prompt.ts
import { getTasksKnowledgeString } from '@/lib/task-definitions';
import { DOMAIN_KNOWLEDGE, buildTechnicianContextPrompt } from '@/lib/domain-knowledge';
import { buildExamplesContext } from '@/lib/training-examples';

// --- INTERFACES & TYPES ---

export interface ConversationSlots {
  userEmail?: string;
  city?: string;
  streetAddress?: string;
  serviceAddress?: string;
  phoneNumber?: string;
  problemCategory?: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'handyman' | 'generic';
  problemDetails?: string;
  hasPhoto?: boolean;
  photoUrl?: string;
  priceRangeMin?: number;
  priceRangeMax?: number;
  priceEstimateGiven?: boolean;
  urgencyLevel?: 'emergency' | 'today' | 'this_week' | 'flexible';
  userConfirmed?: boolean;
  quoteRejected?: boolean;
}

// --- CONSTANTS ---

export const REQUIRED_SLOTS: (keyof ConversationSlots)[] = ['city', 'phoneNumber', 'problemCategory', 'problemDetails'];
export const SERVED_CITIES = ['rimini', 'riccione', 'cattolica', 'misano adriatico', 'bellaria', 'igea marina', 'san giovanni in marignano', 'coriano', 'santarcangelo', 'verucchio', 'poggio torriana', 'morciano', 'pesaro'];
export const CITY_MAPPING: Record<string, string> = { 'pesaro': 'Cattolica (zona Pesaro)' };
export const SLOT_NAMES_IT: Record<string, string> = { city: 'città', streetAddress: 'via/indirizzo', phoneNumber: 'numero di telefono', serviceAddress: "indirizzo completo", problemCategory: 'tipo di problema', problemDetails: 'descrizione del problema', photo: 'foto del guasto' };
export const CATEGORY_NAMES_IT: Record<string, string> = { plumbing: 'Idraulico 🔧', electric: 'Elettricista ⚡', locksmith: 'Fabbro 🔑', climate: 'Climatizzazione ❄️', generic: 'Generico', handyman: 'Tuttofare 🔨' };
export const URGENCY_NAMES_IT: Record<string, string> = { emergency: '🚨 EMERGENZA', today: '📅 Oggi', this_week: '📆 Questa settimana', flexible: '🕐 Flessibile' };


// --- SLOT EXTRACTION & VALIDATION ---

export function extractSlotsFromConversation(messages: Array<{ role: string; content: string }>, userEmail?: string): ConversationSlots {
  const slots: ConversationSlots = { userEmail };
  const userText = messages.filter(m => m.role === 'user').map(m => String(m.content)).join(' ').toLowerCase();
  const originalText = messages.filter(m => m.role === 'user').map(m => String(m.content)).join(' ');

  // City
  for (const city of SERVED_CITIES) {
    if (userText.includes(city)) {
      const mappedCity = CITY_MAPPING[city] || city;
      slots.city = mappedCity.charAt(0).toUpperCase() + mappedCity.slice(1);
      break;
    }
  }

  // Phone
  const phoneMatch = originalText.match(/(\+39\s?)?(3\d{2}[\s.-]?\d{7}|\d{9,10})/);
  if (phoneMatch) slots.phoneNumber = phoneMatch[0].replace(/[\s.-]/g, '');

  // Address
  const addressMatch = originalText.match(/(?:via|corso|piazza|viale)\s+[a-zàèéìòù\s]+[\s,]+\d+/i);
  if (addressMatch) slots.streetAddress = addressMatch[0].trim();
  if (slots.city && slots.streetAddress) slots.serviceAddress = `${slots.streetAddress}, ${slots.city}`;

  // Category & Details
  for (const [category, data] of Object.entries(DOMAIN_KNOWLEDGE)) {
    if (data.keywords.some(kw => userText.includes(kw))) {
      slots.problemCategory = category as ConversationSlots['problemCategory'];
      if (!slots.problemDetails && userText.length > 10) slots.problemDetails = userText.slice(0, 300);
      break;
    }
  }
  
  // Urgency
  if (['urgente', 'emergenza', 'subito', 'allagamento', 'bloccato fuori'].some(kw => userText.includes(kw))) slots.urgencyLevel = 'emergency';
  else if (['oggi', 'stasera'].some(kw => userText.includes(kw))) slots.urgencyLevel = 'today';

  // Confirmation
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content?.toString().toLowerCase().trim() ?? '';
  if (lastUserMessage) {
      const isReject = /^no\b|\brifiuto\b|\bnon (va bene|accetto)\b/.test(lastUserMessage);
      const isAccept = /\bs(i|ì)\b|\b(ok|confermo|esatto|corretto|va bene|procedi|accetto)\b/.test(lastUserMessage);
      if (isReject) {
          slots.userConfirmed = false;
          slots.quoteRejected = true;
      } else if (isAccept && lastUserMessage.length < 80) {
          slots.userConfirmed = true;
      }
  }

  // Price estimate persistence
  messages.forEach(msg => {
      if (msg.role === 'assistant' && typeof msg.content === 'string') {
          try {
              const parsed = JSON.parse(msg.content);
              if (parsed.type === 'price_estimate' && parsed.content.priceMin && parsed.content.priceMax) {
                  slots.priceEstimateGiven = true;
                  slots.priceRangeMin = parsed.content.priceMin;
                  slots.priceRangeMax = parsed.content.priceMax;
              }
          } catch {}
      }
  });

  return slots;
}

const normalizeDetails = (details: string): string => {
    return details.toLowerCase().trim()
      .replace(/(.)\1{2,}/g, '$1$1')
      .replace(/\brubinett[oa]\b/g, 'rubinetto')
      .replace(/\bintassat[oa]\b/g, 'intasato');
}

const isGenericPhrase = (details: string): boolean => {
    const genericPhrases = [
        /^(vorrei|ho bisogno).*(preventivo|intervento|aiuto|tecnico)/i,
        /^(problema|guasto).*(idraulico|elettrico|fabbro|clima)/i,
        /^(si|sì|no|ok|certo|va bene)$/i,
    ];
    return genericPhrases.some(pattern => pattern.test(details));
}

const hasSpecificKeyword = (details: string, category?: ConversationSlots['problemCategory']): boolean => {
    const keywords = {
        locksmith: /\b(chiave|cilindro|serratura|chiuso fuori|non si apre)\b/i,
        plumbing: /\b(perde|perdita|goccia|allagamento|intasato|otturato|non scarica|rubinetto|wc)\b/i,
        electric: /\b(scatta|salvavita|blackout|cortocircuito|presa|scintille|bruciato)\b/i,
        climate: /\b(non scalda|non raffresca|non parte|rumore|perde acqua|caldaia)\b/i,
        generic: /\b(montare|smontare|installare|sostituire|riparare)\b/i
    };
    const categoryKeywords = keywords[category as keyof typeof keywords] || keywords.generic;
    return categoryKeywords.test(details);
}

export function checkProblemDetailsValid(slots: ConversationSlots): boolean {
    if (slots.hasPhoto) return true;
    if (!slots.problemDetails) return false;

    const normalized = normalizeDetails(slots.problemDetails);
    if (isGenericPhrase(normalized)) return false;
    if (hasSpecificKeyword(normalized, slots.problemCategory)) return true;

    const wordCount = normalized.split(/\s+/).filter(Boolean).length;
    return wordCount >= 10 || normalized.length >= 60;
}

export function getMissingSlots(slots: ConversationSlots): string[] {
  if (!slots.city) return ['city'];
  if (!slots.problemCategory || slots.problemCategory === 'generic') return ['problemCategory'];
  if (!checkProblemDetailsValid(slots)) return ['problemDetails'];
  if (!slots.streetAddress) return ['streetAddress'];
  if (!slots.phoneNumber) return ['phoneNumber'];
  return [];
}

export function canGivePriceEstimate(slots: ConversationSlots): boolean {
  return !!(slots.city && slots.problemCategory && checkProblemDetailsValid(slots));
}

export function calculatePriceRange(slots: ConversationSlots): { min: number; max: number } {
  const basePrices: Record<string, { min: number; max: number }> = {
    plumbing: { min: 70, max: 150 }, electric: { min: 60, max: 130 },
    locksmith: { min: 80, max: 200 }, climate: { min: 90, max: 180 },
    generic: { min: 50, max: 120 }
  };
  const base = basePrices[slots.problemCategory || 'generic'];
  return slots.urgencyLevel === 'emergency' ? { min: Math.round(base.min * 1.3), max: Math.round(base.max * 1.5) } : base;
}

export const canCreateTicket = (slots: ConversationSlots): boolean => getMissingSlots(slots).length === 0;
export const isReadyForRecap = (slots: ConversationSlots): boolean => getMissingSlots(slots).length === 0 && !slots.userConfirmed;

// --- PROMPT BUILDERS ---

const buildSlotStatus = (slots: ConversationSlots): string => `
📊 **STATO RACCOLTA DATI:**
- Città: ${slots.city || '**MANCANTE**'}
- Categoria: ${slots.problemCategory || '**NON IDENTIFICATA**'}
- Diagnosi: ${checkProblemDetailsValid(slots) ? `"${(slots.problemDetails || 'foto ricevuta').slice(0, 35)}"...` : '**MANCANTE**'}
- Preventivo: ${slots.priceEstimateGiven ? `${slots.priceRangeMin}€ - ${slots.priceRangeMax}€` : 'da dare'}
- Via: ${slots.streetAddress || 'da chiedere'}
- Telefono: ${slots.phoneNumber || 'da chiedere'}
- Conferma: ${slots.userConfirmed ? 'ACCETTATO' : 'in attesa'}`;

const buildFlowInstructions = (slots: ConversationSlots, priceRange: {min: number, max: number} | null): string => `
# 🎯 FLUSSO CONVERSAZIONALE STRICT
1.  **CITTÀ**: Se manca, chiedi "Per aiutarti, di quale città parliamo?". Non procedere senza.
2.  **CATEGORIA**: Se manca, chiedi "Che tipo di intervento ti serve?". Non procedere senza.
3.  **DIAGNOSI**: Fai domande specifiche per capire il problema ("Cosa vedi?", "La chiave è spezzata?"). Non puoi dare prezzi su "non funziona".
4.  **PREVENTIVO**: SOLO se hai città, categoria E problema specifico, puoi dare il preventivo. ${ 
    slots.userConfirmed ? 'L\'utente ha già accettato, passa a INDIRIZZO.' : 
    priceRange ? `Ora puoi dire: "Basandomi su questo, l'intervento si aggira tra **${priceRange.min}€ e ${priceRange.max}€**."` : 
    'Non puoi ancora dare un preventivo.' 
}
5.  **INDIRIZZO**: Solo DOPO l'accettazione del preventivo, chiedi "Perfetto. Dimmi l'indirizzo esatto (via e numero civico)".
6.  **TELEFONO**: Ultimo step, chiedi "A che numero può chiamarti il tecnico per confermare?".
7.  **RIEPILOGO**: Mostra i dati e chiedi conferma finale.`;

export function buildNikiSystemPrompt(slots: ConversationSlots, ticketId?: string | null): string {
  const now = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
  const priceRange = canGivePriceEstimate(slots) && !slots.userConfirmed ? calculatePriceRange(slots) : null;

  const sections = [
    `# 🤖 IDENTITÀ\nSei **Niki**, l'assistente AI di **NikiTuttoFare**, servizio di pronto intervento H24 in Riviera Romagnola.`,
    `# ⏰ CONTESTO\n- Data/Ora: ${now}\n- Email utente: ${slots.userEmail || 'Ospite'}\n${ticketId ? `- Ticket: #${ticketId.slice(-8).toUpperCase()}`:''}`,
    buildSlotStatus(slots),
    `# 🧠 ESPERTO TECNICO\nUsa questa knowledge base per distinguere tra lavori domestici (prezzo base) e commerciali/Horeca (più complessi, proponi sopralluogo o range "a partire da").\n${buildTechnicianContextPrompt()}`,
    `# 🧪 CASI DI RIFERIMENTO\nUsa questi esempi per orientare tono e priorità, non per copiare.\n${buildExamplesContext(12)}`,
    buildFlowInstructions(slots, priceRange),
    `# ⚠️ REGOLE\n- Prometti una **chiamata** entro 30-60 min, NON l'arrivo.\n- Il prezzo finale lo fa il tecnico sul posto.\n- Per problemi vaghi ("è rotto"), insisti per dettagli o foto.`,
    `# 📤 FORMATO RISPOSTA (JSON)\n{"type": "text" | "recap" | "price_estimate", "content": ..., "shouldCreateTicket": false, ...}`
  ];

  return sections.join('\n\n').trim();
}


// --- QUESTION & MESSAGE GENERATORS ---

export function getQuestionForSlot(slotName: string, category?: string): string {
  const questions: Record<string, string> = {
    city: 'Per aiutarti, di quale **città** parliamo? (Rimini, Riccione, Cattolica...)' ,
    problemCategory: 'Che tipo di problema hai? Idraulico, elettrico, serrature, o clima/riscaldamento?',
    phoneNumber: 'Perfetto! A che numero può **chiamarti il tecnico** per confermare l\'appuntamento?',
    streetAddress: 'Ora mi serve l\'**indirizzo esatto** per mandare il tecnico. Via e numero civico?',
  };

  if (slotName === 'problemDetails') {
    const categorySpecific: Record<string, string> = {
      locksmith: '🔑 Per darti il preventivo giusto, dimmi cosa è successo: Sei rimasto **chiuso fuori**? La **chiave si è spezzata**? La serratura **non gira**?',
      plumbing: '🔧 Per il preventivo, dimmi cosa vedi: Da **dove perde** \'acqua? Lo **scarico è intasato**? C\'è un **allagamento**?',
      electric: '⚡ Per il preventivo, dimmi cosa succede: Salta il **salvavita**? C\'è un **blackout**? Qualche **presa non funziona**?',
      climate: '❄️ Per il preventivo, dimmi cosa succede: **Non si accende**? **Non scalda** o **non raffresca**? Fa **rumori strani**?',
      generic: '🔨 Per darti un preventivo preciso, descrivimi **cosa devi fare**: montare, riparare o installare qualcosa?',
    };
    return categorySpecific[category || 'generic'] || categorySpecific.generic;
  }
  
  return questions[slotName] || 'Puoi darmi qualche informazione in più?';
}

export function generatePriceEstimateMessage(slots: ConversationSlots): string {
  const range = calculatePriceRange(slots);
  return `Basandomi su quello che mi hai descritto, **l'intervento si aggira tra ${range.min}€ e ${range.max}€**.\n\n⚠️ *Questo è un range indicativo. Il prezzo finale sarà confermato dal tecnico una volta sul posto.*

Ti va bene? Se confermi, un tecnico ti **chiamerà entro 30-60 minuti** per fissare l'orario.`;
}

export function generateRecapMessage(slots: ConversationSlots): string {
  const range = calculatePriceRange(slots);
  return `✅ **Riepilogo:**\n- **Problema:** ${slots.problemDetails || 'Non specificato'}\n- **Categoria:** ${CATEGORY_NAMES_IT[slots.problemCategory || 'generic']}\n- **Indirizzo:** ${slots.serviceAddress || slots.city || 'Non specificato'}\n- **Telefono:** ${slots.phoneNumber || 'Non specificato'}\n- **Preventivo:** ${range.min}€ - ${range.max}€ (da confermare)\n\nUn tecnico ti **chiamerà entro 30-60 minuti** per confermare. **È tutto corretto?**`;
}