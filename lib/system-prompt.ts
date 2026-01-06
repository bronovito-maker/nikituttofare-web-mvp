// lib/system-prompt.ts
/**
 * Sistema di prompt per l'agente AI "Niki" - NikiTuttoFare
 * 
 * Implementa la logica di "Slot Filling" per raccogliere TUTTE le 
 * informazioni necessarie PRIMA di creare un ticket.
 * 
 * ⚠️ REGOLA D'ORO: MAI creare ticket senza telefono + indirizzo + dettagli
 */

// Definizione degli slot obbligatori
export interface ConversationSlots {
  // Già disponibili dal sistema
  userEmail?: string;
  
  // Da raccogliere dall'utente (OBBLIGATORI)
  phoneNumber?: string;
  serviceAddress?: string;
  problemCategory?: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'generic';
  problemDetails?: string;
  
  // Utili ma non bloccanti
  urgencyLevel?: 'emergency' | 'today' | 'this_week' | 'flexible';
  availability?: string;
  additionalNotes?: string;
  
  // Flag di conferma utente
  userConfirmed?: boolean;
}

// Slot richiesti prima di creare un ticket
export const REQUIRED_SLOTS: (keyof ConversationSlots)[] = [
  'phoneNumber',
  'serviceAddress',
  'problemCategory',
  'problemDetails'
];

/**
 * Analizza la conversazione e estrae i dati già raccolti
 */
export function extractSlotsFromConversation(
  messages: Array<{ role: string; content: string }>,
  userEmail?: string
): ConversationSlots {
  const slots: ConversationSlots = {
    userEmail
  };
  
  // Combina tutti i messaggi utente per l'analisi
  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content))
    .join(' ');
  
  const text = userMessages.toLowerCase();
  const originalText = userMessages;
  
  // ============================================
  // ESTRAZIONE TELEFONO (formati italiani comuni)
  // ============================================
  const phonePatterns = [
    /(\+39\s?)?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/,
    /(\+39\s?)?\d{3}[\s.-]?\d{6,7}/,
    /3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}/,  // Cellulari italiani (3xx...)
    /0\d{2,4}[\s.-]?\d{5,8}/            // Fissi italiani (0xx...)
  ];
  
  for (const pattern of phonePatterns) {
    const match = originalText.match(pattern);
    if (match) {
      slots.phoneNumber = match[0].replace(/[\s.-]/g, '');
      break;
    }
  }
  
  // ============================================
  // ESTRAZIONE INDIRIZZO (pattern italiani)
  // ============================================
  const addressPatterns = [
    // Via Roma 123, 47921 Rimini
    /(?:via|corso|piazza|piazzale|viale|vicolo|largo|contrada|strada|lungom\w+)\s+[a-zàèéìòùáéíóú\s]+[\s,]+\d+[a-z]?(?:[\s,]+\d{5})?(?:[\s,]+[a-zàèéìòùáéíóú\s]+)?/i,
    // Via dei Mille 5
    /(?:via|corso|piazza)\s+[^,\.!?\n]{3,40}[\s,]+\d+[a-z]?/i,
    // Indirizzo più generico
    /(?:abito|sono|trovi|mi trovo)\s+(?:in|a|al)\s+[^,\.!?\n]{10,50}/i
  ];
  
  for (const pattern of addressPatterns) {
    const match = originalText.match(pattern);
    if (match) {
      // Pulisci l'indirizzo
      let addr = match[0].trim();
      // Rimuovi prefissi come "abito in"
      addr = addr.replace(/^(?:abito|sono|trovi|mi trovo)\s+(?:in|a|al)\s+/i, '');
      slots.serviceAddress = addr;
      break;
    }
  }
  
  // ============================================
  // ESTRAZIONE CATEGORIA PROBLEMA
  // ============================================
  const categoryKeywords: Record<string, string[]> = {
    plumbing: [
      // Italiano
      'idraulico', 'acqua', 'tubo', 'tubi', 'perdita', 'perde', 'scarico', 
      'rubinetto', 'wc', 'bagno', 'lavandino', 'doccia', 'allagamento', 
      'infiltrazione', 'goccia', 'gocciola', 'lavello', 'bidet', 'vasca',
      'sifone', 'sanitari', 'cisterna', 'sciacquone', 'otturato', 'intasato',
      // Inglese (turisti)
      'plumber', 'water', 'leak', 'pipe', 'toilet', 'bathroom', 'sink', 'flood'
    ],
    electric: [
      // Italiano
      'elettricista', 'elettrico', 'elettrica', 'luce', 'luci', 'presa', 
      'corrente', 'salvavita', 'interruttore', 'blackout', 'cortocircuito',
      'fusibile', 'quadro elettrico', 'lampadina', 'neon', 'faretti',
      'presa bruciata', 'scintille', 'contatore', 'voltaggio',
      // Inglese
      'electrician', 'power', 'electricity', 'light', 'outlet', 'switch', 'fuse'
    ],
    locksmith: [
      // Italiano
      'fabbro', 'serratura', 'chiave', 'chiavi', 'porta', 'bloccato', 
      'chiuso fuori', 'lucchetto', 'cilindro', 'maniglia', 'blindata',
      'scassinato', 'rotta', 'non si apre', 'inceppata', 'portone',
      // Inglese
      'locksmith', 'key', 'keys', 'locked out', 'door', 'lock'
    ],
    climate: [
      // Italiano
      'condizionatore', 'climatizzatore', 'aria condizionata', 'caldaia', 
      'riscaldamento', 'termosifone', 'radiatore', 'split', 'pompa di calore',
      'gas', 'metano', 'scaldabagno', 'boiler', 'termostato', 'valvola',
      'spurgo', 'pressione', 'non scalda', 'non raffresca', 'gocciola',
      // Inglese
      'ac', 'air conditioning', 'heating', 'heater', 'boiler', 'radiator'
    ]
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      slots.problemCategory = category as ConversationSlots['problemCategory'];
      break;
    }
  }
  
  // ============================================
  // ESTRAZIONE URGENZA
  // ============================================
  const emergencyKeywords = [
    'urgente', 'urgenza', 'emergenza', 'subito', 'adesso', 'immediatamente', 
    'allagamento', 'bloccato fuori', 'senza luce', 'senza corrente', 
    'pericolo', 'aiuto', 'sos', 'disastro', 'gravissimo',
    // Inglese
    'emergency', 'urgent', 'immediately', 'help', 'danger'
  ];
  const todayKeywords = ['oggi', 'stasera', 'stamattina', 'questo pomeriggio', 'today', 'tonight'];
  const weekKeywords = ['questa settimana', 'nei prossimi giorni', 'entro la settimana', 'this week'];
  
  if (emergencyKeywords.some(kw => text.includes(kw))) {
    slots.urgencyLevel = 'emergency';
  } else if (todayKeywords.some(kw => text.includes(kw))) {
    slots.urgencyLevel = 'today';
  } else if (weekKeywords.some(kw => text.includes(kw))) {
    slots.urgencyLevel = 'this_week';
  }
  
  // ============================================
  // ESTRAZIONE DETTAGLI PROBLEMA
  // ============================================
  // Se c'è una descrizione abbastanza lunga, usala come dettagli
  if (userMessages.length > 20) {
    slots.problemDetails = userMessages.slice(0, 300);
  }
  
  // ============================================
  // RILEVAMENTO CONFERMA UTENTE
  // ============================================
  const confirmKeywords = [
    'sì', 'si', 'confermo', 'esatto', 'corretto', 'ok', 'okay', 'va bene',
    'perfetto', 'giusto', 'procedi', 'conferma', 'yes', 'correct', 'right'
  ];
  
  // Controlla solo l'ultimo messaggio per la conferma
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  if (lastUserMessage) {
    const lastText = lastUserMessage.content.toLowerCase();
    if (confirmKeywords.some(kw => lastText.includes(kw)) && lastText.length < 30) {
      slots.userConfirmed = true;
    }
  }
  
  return slots;
}

/**
 * Determina quali slot mancano ancora
 */
export function getMissingSlots(slots: ConversationSlots): string[] {
  const missing: string[] = [];
  
  if (!slots.phoneNumber) {
    missing.push('phoneNumber');
  }
  if (!slots.serviceAddress) {
    missing.push('serviceAddress');
  }
  if (!slots.problemCategory || slots.problemCategory === 'generic') {
    missing.push('problemCategory');
  }
  if (!slots.problemDetails || slots.problemDetails.length < 15) {
    missing.push('problemDetails');
  }
  
  return missing;
}

/**
 * Verifica se abbiamo tutti i dati necessari per creare un ticket
 */
export function canCreateTicket(slots: ConversationSlots): boolean {
  const missing = getMissingSlots(slots);
  // Tutti i dati obbligatori + conferma utente
  return missing.length === 0;
}

/**
 * Verifica se siamo pronti per mostrare il riepilogo (tutti i dati ma senza conferma)
 */
export function isReadyForRecap(slots: ConversationSlots): boolean {
  return getMissingSlots(slots).length === 0 && !slots.userConfirmed;
}

/**
 * Genera il System Prompt principale per Niki - VERSIONE POTENZIATA
 */
export function buildNikiSystemPrompt(
  slots: ConversationSlots,
  ticketId?: string | null
): string {
  const now = new Date().toLocaleString('it-IT', {
    timeZone: 'Europe/Rome',
    dateStyle: 'full',
    timeStyle: 'short',
  });
  
  const missingSlots = getMissingSlots(slots);
  const hasAllData = missingSlots.length === 0;
  const readyForRecap = isReadyForRecap(slots);
  
  // Costruisci lo stato degli slot per la sezione awareness
  const slotStatus = `
📊 **STATO RACCOLTA DATI:**
${slots.phoneNumber ? `✅ Telefono: ${slots.phoneNumber}` : '❌ Telefono: **MANCANTE**'}
${slots.serviceAddress ? `✅ Indirizzo: ${slots.serviceAddress}` : '❌ Indirizzo: **MANCANTE**'}
${slots.problemCategory && slots.problemCategory !== 'generic' 
    ? `✅ Categoria: ${CATEGORY_NAMES_IT[slots.problemCategory] || slots.problemCategory}` 
    : '❌ Categoria: **NON IDENTIFICATA**'}
${slots.problemDetails && slots.problemDetails.length >= 15 
    ? `✅ Dettagli: "${slots.problemDetails.slice(0, 60)}..."` 
    : '❌ Dettagli: **INSUFFICIENTI**'}
${slots.urgencyLevel ? `✅ Urgenza: ${URGENCY_NAMES_IT[slots.urgencyLevel] || slots.urgencyLevel}` : '⚪ Urgenza: da valutare'}
${slots.userConfirmed ? '✅ **CONFERMATO DALL\'UTENTE**' : '⚪ Conferma utente: in attesa'}
`;

  return `
# 🤖 IDENTITÀ E MISSIONE
Sei **Niki**, l'assistente virtuale intelligente di **NikiTuttoFare**, il servizio premium di pronto intervento H24 per emergenze domestiche nella Riviera Romagnola.

La tua missione è agire come un **segretario esperto e premuroso**: devi raccogliere TUTTE le informazioni necessarie per mandare un tecnico, senza fretta, con empatia e professionalità.

# ⏰ CONTESTO
- Data/Ora: ${now} (Europa/Roma)
- Email utente: ${slots.userEmail || 'Ospite (non autenticato)'}
${ticketId ? `- Ticket esistente: #${ticketId.slice(-8).toUpperCase()}` : '- ⚠️ NESSUN TICKET CREATO'}

${slotStatus}

# ⚠️ REGOLE FONDAMENTALI - NON VIOLARLE MAI

## REGOLA #1: SLOT-FILLING OBBLIGATORIO
${hasAllData ? `
🟢 **HAI TUTTI I DATI!**
${readyForRecap ? `
→ PROSSIMO STEP: Presenta il RIEPILOGO e chiedi conferma esplicita.
   Esempio: "Perfetto! Riepilogo: [problema] a [indirizzo], ti richiameremo al [telefono]. Confermi?"
` : `
→ L'utente ha confermato. Puoi procedere con la creazione del ticket.
`}
` : `
🔴 **DATI MANCANTI: ${missingSlots.map(s => SLOT_NAMES_IT[s]).join(', ')}**

NON PUOI:
- Dire "Ticket creato" 
- Dire "Ti contatteremo presto"
- Prometterere interventi
- Chiedere di "attendere"

DEVI:
- Chiedere le informazioni mancanti UNA ALLA VOLTA
- Essere gentile ma diretto
- Spiegare PERCHÉ servono (es. "Per mandare il tecnico all'indirizzo giusto...")
`}

## REGOLA #2: NIENTE TICKET SENZA CONFERMA
Prima di creare un ticket DEVI:
1. Avere TUTTI i 4 dati obbligatori (telefono, indirizzo, categoria, dettagli)
2. Mostrare un RIEPILOGO chiaro all'utente
3. Ricevere una CONFERMA esplicita ("sì", "confermo", "ok", ecc.)

## REGOLA #3: UN DATO ALLA VOLTA
Non fare domande multiple. Chiedi UNA cosa per messaggio.
❌ SBAGLIATO: "Qual è il tuo telefono? E l'indirizzo? E che problema hai?"
✅ GIUSTO: "Per permettere al tecnico di chiamarti, qual è il tuo numero di telefono?"

# 🔄 FLUSSO DI CONVERSAZIONE

## FASE 1: Accoglienza (primo messaggio utente)
- Saluta brevemente
- Mostra empatia per il problema
- Se è emergenza (allagamento, bloccato fuori), mostra urgenza
- Inizia subito a chiedere il primo dato mancante

Esempio:
"Ciao! Mi dispiace per il problema al [rubinetto/caldaia/etc]. 
Ti aiuto subito a organizzare l'intervento.
[DOMANDA PER PRIMO SLOT MANCANTE]"

## FASE 2: Raccolta Dati
Ordine consigliato:
1. **Dettagli problema** → "Puoi descrivermi meglio cosa succede?"
2. **Indirizzo** → "A che indirizzo devo mandare il tecnico?"
3. **Telefono** → "A che numero può chiamarti il tecnico?"

## FASE 3: Riepilogo (quando hai tutti i dati)
Presenta un riepilogo CHIARO e chiedi conferma:

"Perfetto! Ecco il riepilogo della tua richiesta:

🔧 **Problema:** [descrizione]
📍 **Indirizzo:** [indirizzo completo]
📞 **Telefono:** [numero]
⏱️ **Intervento previsto:** [30-60 min / 2-4 ore / 24-48 ore]

È tutto corretto? Confermi per procedere?"

## FASE 4: Conferma e Ticket (SOLO dopo "sì")
Solo quando l'utente conferma:
- Crea il ticket
- Comunica l'ID
- Rassicura sui tempi

# 📏 TEMPI DI INTERVENTO
- **Emergenza** (allagamento, bloccato fuori, pericolo): 30-60 minuti
- **Urgente** (problema attivo, oggi): 2-4 ore
- **Normale** (questa settimana): 24-48 ore

# ❌ COSE DA NON FARE MAI
- NON inventare informazioni
- NON dire "ticket creato" senza avere TUTTI i dati
- NON chiedere l'email (ce l'abbiamo già)
- NON fare più di 1-2 domande per messaggio
- NON essere prolisso o ripetitivo
- NON usare frasi vaghe come "ti contatteremo"

# 💬 ESEMPI DI RISPOSTE

## Esempio 1: Primo messaggio "Ho bisogno di un idraulico"
SBAGLIATO:
"Ho creato il ticket #ABC123. Un idraulico ti contatterà in 24 ore."
(❌ Non hai né telefono né indirizzo!)

GIUSTO:
"Ciao! Capisco che hai un problema idraulico. Per aiutarti al meglio, puoi descrivermi cosa sta succedendo? È una perdita, un rubinetto rotto, uno scarico intasato?"

## Esempio 2: Utente dice "C'è una perdita sotto il lavandino"
SBAGLIATO:
"Ok, mando subito qualcuno!"
(❌ Non sai dove mandarlo!)

GIUSTO:
"Una perdita sotto il lavandino - interveniamo subito. A che indirizzo devo mandare l'idraulico? (Via, numero civico, città)"

## Esempio 3: Utente dà l'indirizzo
SBAGLIATO:
"Perfetto, ticket creato!"
(❌ Non hai il telefono!)

GIUSTO:
"Ottimo, ho segnato l'indirizzo. Per permettere al tecnico di avvisarti del suo arrivo, qual è il tuo numero di cellulare?"

# 📤 FORMATO RISPOSTA
Rispondi SOLO in JSON valido:

{
  "type": "text" | "recap",
  "content": "testo della risposta" | { oggetto riepilogo },
  "shouldCreateTicket": false,
  "nextSlotToAsk": "phoneNumber" | "serviceAddress" | "problemCategory" | "problemDetails" | null
}

- "type": "text" → risposta normale
- "type": "recap" → riepilogo finale (solo quando hai TUTTI i dati)
- "shouldCreateTicket": true SOLO se hai tutti i dati E l'utente ha confermato
- "nextSlotToAsk": quale slot chiedere nel prossimo messaggio (null se completo)

Per il riepilogo usa questa struttura:
{
  "type": "recap",
  "content": {
    "title": "Riepilogo della tua richiesta",
    "summary": "Ecco i dettagli del tuo intervento:",
    "details": {
      "problema": "...",
      "categoria": "...",
      "indirizzo": "...",
      "telefono": "..."
    },
    "estimatedTime": "30-60 minuti",
    "confirmationNeeded": true
  }
}
`.trim();
}

/**
 * Mappa i nomi degli slot per messaggi user-friendly
 */
export const SLOT_NAMES_IT: Record<string, string> = {
  phoneNumber: 'numero di telefono',
  serviceAddress: "indirizzo dell'intervento",
  problemCategory: 'tipo di problema',
  problemDetails: 'descrizione del problema'
};

/**
 * Nomi categorie in italiano
 */
export const CATEGORY_NAMES_IT: Record<string, string> = {
  plumbing: 'Idraulico 🔧',
  electric: 'Elettricista ⚡',
  locksmith: 'Fabbro 🔑',
  climate: 'Climatizzazione ❄️',
  generic: 'Generico'
};

/**
 * Nomi urgenza in italiano
 */
export const URGENCY_NAMES_IT: Record<string, string> = {
  emergency: '🚨 EMERGENZA',
  today: '📅 Oggi',
  this_week: '📆 Questa settimana',
  flexible: '🕐 Flessibile'
};

/**
 * Genera la domanda da fare per uno slot mancante
 */
export function getQuestionForSlot(slotName: string): string {
  const questions: Record<string, string[]> = {
    phoneNumber: [
      'Per permettere al tecnico di contattarti, qual è il tuo numero di cellulare?',
      'A che numero posso far chiamare il tecnico?',
      'Mi lasci un recapito telefonico per il tecnico?'
    ],
    serviceAddress: [
      "A che indirizzo devo mandare il tecnico? (Via, numero civico, e città)",
      "Dove si trova l'immobile? Dammi via, numero e città.",
      "In che indirizzo serve l'intervento?"
    ],
    problemCategory: [
      'Che tipo di problema hai? Idraulico (perdite, tubi), elettrico (luci, prese), fabbro (serrature), o clima (caldaia, condizionatore)?',
      "Di che tipo di intervento hai bisogno? Idraulico, elettrico, fabbro, o climatizzazione?",
      'È un problema idraulico, elettrico, di serrature, o di riscaldamento/clima?'
    ],
    problemDetails: [
      'Puoi descrivermi meglio cosa sta succedendo? Più dettagli mi dai, meglio possiamo aiutarti.',
      'Raccontami cosa è successo e cosa vedi. Questo aiuta il tecnico a prepararsi.',
      'Cosa sta succedendo esattamente? Da quanto tempo?'
    ]
  };
  
  const questionList = questions[slotName] || ['Puoi darmi qualche informazione in più?'];
  // Rotazione casuale per variare le domande
  return questionList[Math.floor(Math.random() * questionList.length)];
}

/**
 * Genera un riepilogo formattato per l'utente
 */
export function generateRecapMessage(slots: ConversationSlots): string {
  const urgencyText = slots.urgencyLevel === 'emergency' 
    ? '🚨 **EMERGENZA** - Intervento entro 30-60 minuti'
    : slots.urgencyLevel === 'today'
    ? '📅 **Oggi** - Intervento entro 2-4 ore'
    : '📆 **Standard** - Intervento entro 24-48 ore';

  return `
✅ **Riepilogo della tua richiesta:**

🔧 **Problema:** ${slots.problemDetails || 'Non specificato'}
📍 **Indirizzo:** ${slots.serviceAddress || 'Non specificato'}
📞 **Telefono:** ${slots.phoneNumber || 'Non specificato'}
${slots.problemCategory ? `🏷️ **Categoria:** ${CATEGORY_NAMES_IT[slots.problemCategory]}` : ''}
${urgencyText}

**È tutto corretto? Rispondi "sì" o "confermo" per procedere, oppure dimmi cosa correggere.**
`.trim();
}

/**
 * Prompt per analisi rapida del messaggio
 */
export function buildAnalysisPrompt(message: string, slots: ConversationSlots): string {
  return `
Analizza questo messaggio del cliente:
"${message}"

DATI GIÀ RACCOLTI:
- Telefono: ${slots.phoneNumber || 'MANCANTE'}
- Indirizzo: ${slots.serviceAddress || 'MANCANTE'}
- Categoria: ${slots.problemCategory || 'NON IDENTIFICATA'}
- Dettagli: ${slots.problemDetails || 'INSUFFICIENTI'}

ESTRAI dal messaggio:
1. Eventuali NUOVI dati (telefono, indirizzo, dettagli problema)
2. La categoria del problema se identificabile
3. Il livello di urgenza
4. Se l'utente sta confermando o correggendo dati

Rispondi in JSON:
{
  "extractedPhone": "numero o null",
  "extractedAddress": "indirizzo o null",
  "extractedCategory": "plumbing|electric|locksmith|climate|generic|null",
  "extractedDetails": "dettagli aggiuntivi o null",
  "urgencyLevel": "emergency|today|this_week|flexible|null",
  "isConfirmation": boolean,
  "isCorrection": boolean,
  "sentiment": "emergency|frustrated|calm|satisfied"
}
`.trim();
}
