// lib/system-prompt.ts
/**
 * Sistema di prompt per l'agente AI "Niki" - NikiTuttoFare
 * 
 * FLUSSO CONVERSAZIONALE AGGIORNATO:
 * 1. Chiedi CITTÀ specifica (Rimini, Riccione, Cattolica, ecc.)
 * 2. Chiedi FOTO del problema (fallback: descrizione dettagliata)
 * 3. Fornisci RANGE PREZZO stimato
 * 4. Chiarisci che il tecnico CHIAMERÀ entro 30-60 min (non arriverà)
 * 5. Raccogli telefono per la chiamata di conferma
 * 6. Conferma e crea ticket
 */

// Definizione degli slot obbligatori
export interface ConversationSlots {
  // Già disponibili dal sistema
  userEmail?: string;
  
  // NUOVI SLOT per geolocalizzazione precisa
  city?: string;                    // Rimini, Riccione, Cattolica, etc.
  streetAddress?: string;           // Via Roma 123
  serviceAddress?: string;          // Indirizzo completo (city + street)
  
  // Da raccogliere dall'utente (OBBLIGATORI)
  phoneNumber?: string;
  problemCategory?: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'handyman' | 'generic';
  problemDetails?: string;
  
  // NUOVO: Foto del problema
  hasPhoto?: boolean;
  photoUrl?: string;
  
  // NUOVO: Range prezzo stimato
  priceRangeMin?: number;
  priceRangeMax?: number;
  priceEstimateGiven?: boolean;
  
  // Urgenza
  urgencyLevel?: 'emergency' | 'today' | 'this_week' | 'flexible';
  
  // Flag di conferma utente
  userConfirmed?: boolean;
}

// Slot richiesti prima di creare un ticket
export const REQUIRED_SLOTS: (keyof ConversationSlots)[] = [
  'city',
  'phoneNumber',
  'problemCategory',
  'problemDetails'
];

// Città servite
export const SERVED_CITIES = [
  'rimini', 'riccione', 'cattolica', 'misano adriatico', 'bellaria',
  'igea marina', 'san giovanni in marignano', 'coriano', 'santarcangelo',
  'verucchio', 'poggio torriana', 'morciano',
  // Zone limitrofe accettate
  'pesaro' // per richieste da Cattolica
];

export const CITY_MAPPING: Record<string, string> = {
  'pesaro': 'Cattolica (zona Pesaro)' // Pesaro viene mappato a Cattolica
};

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
  // ESTRAZIONE CITTÀ (NUOVO - Priorità Alta)
  // ============================================
  for (const city of SERVED_CITIES) {
    if (text.includes(city)) {
      // Usa il mapping se esiste (es. pesaro -> cattolica)
      const mappedCity = CITY_MAPPING[city] || city;
      slots.city = mappedCity.charAt(0).toUpperCase() + mappedCity.slice(1);
      break;
    }
  }
  
  // ============================================
  // ESTRAZIONE TELEFONO (formati italiani comuni)
  // ============================================
  const phonePatterns = [
    /(\+39\s?)?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/,
    /(\+39\s?)?\d{3}[\s.-]?\d{6,7}/,
    /3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}/,
    /0\d{2,4}[\s.-]?\d{5,8}/
  ];
  
  for (const pattern of phonePatterns) {
    const match = originalText.match(pattern);
    if (match) {
      slots.phoneNumber = match[0].replace(/[\s.-]/g, '');
      break;
    }
  }
  
  // ============================================
  // ESTRAZIONE INDIRIZZO (via/numero)
  // ============================================
  const addressPatterns = [
    /(?:via|corso|piazza|piazzale|viale|vicolo|largo|contrada|strada|lungom\w+)\s+[a-zàèéìòùáéíóú\s]+[\s,]+\d+[a-z]?/i,
    /(?:via|corso|piazza)\s+[^,\.!?\n]{3,40}[\s,]+\d+[a-z]?/i,
  ];
  
  for (const pattern of addressPatterns) {
    const match = originalText.match(pattern);
    if (match) {
      slots.streetAddress = match[0].trim();
      break;
    }
  }
  
  // Combina città e indirizzo SOLO se abbiamo entrambi
  if (slots.city && slots.streetAddress) {
    slots.serviceAddress = `${slots.streetAddress}, ${slots.city}`;
  }
  // NON impostare serviceAddress se abbiamo solo la città - serve indirizzo completo
  
  // ============================================
  // ESTRAZIONE CATEGORIA PROBLEMA
  // ============================================
  const categoryKeywords: Record<string, string[]> = {
    plumbing: [
      'idraulico', 'acqua', 'tubo', 'tubi', 'perdita', 'perde', 'scarico', 
      'rubinetto', 'wc', 'bagno', 'lavandino', 'doccia', 'allagamento', 
      'infiltrazione', 'goccia', 'gocciola', 'lavello', 'bidet', 'vasca',
      'sifone', 'sanitari', 'cisterna', 'sciacquone', 'otturato', 'intasato',
      'plumber', 'water', 'leak', 'pipe', 'toilet', 'bathroom', 'sink', 'flood'
    ],
    electric: [
      'elettricista', 'elettrico', 'elettrica', 'luce', 'luci', 'presa', 
      'corrente', 'salvavita', 'interruttore', 'blackout', 'cortocircuito',
      'fusibile', 'quadro elettrico', 'lampadina', 'neon', 'faretti',
      'presa bruciata', 'scintille', 'contatore', 'voltaggio',
      'electrician', 'power', 'electricity', 'light', 'outlet', 'switch', 'fuse'
    ],
    locksmith: [
      'fabbro', 'serratura', 'chiave', 'chiavi', 'porta', 'bloccato', 
      'chiuso fuori', 'lucchetto', 'cilindro', 'maniglia', 'blindata',
      'scassinato', 'rotta', 'non si apre', 'inceppata', 'portone',
      'locksmith', 'key', 'keys', 'locked out', 'door', 'lock'
    ],
    climate: [
      'condizionatore', 'climatizzatore', 'aria condizionata', 'caldaia',
      'riscaldamento', 'termosifone', 'radiatore', 'split', 'pompa di calore',
      'gas', 'metano', 'scaldabagno', 'boiler', 'termostato', 'valvola',
      'spurgo', 'pressione', 'non scalda', 'non raffresca',
      'ac', 'air conditioning', 'heating', 'heater', 'boiler', 'radiator'
    ],
    handyman: [
      'montare', 'montaggio', 'assemblare', 'assemblaggio', 'mobile', 'mobili',
      'ikea', 'componibile', 'armadio', 'libreria', 'tavolo', 'sedia', 'letto',
      'cucina', 'bagno', 'soggiorno', 'camera', 'ufficio', 'montaggio mobili',
      'tuttofare', 'piccole riparazioni', 'lavori di casa', 'bricolage',
      'appendere', 'appendere', 'quadro', 'shelf', 'mensola', 'tenda', 'tende',
      'installare', 'installazione', 'sostituire', 'sostituzione', 'riparare',
      'riparazione', 'aggiustare', 'sistemare', 'piccola riparazione',
      'assemble', 'assembly', 'furniture', 'handyman', 'fix', 'repair', 'install'
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
    'emergency', 'urgent', 'immediately', 'help', 'danger'
  ];
  const todayKeywords = ['oggi', 'stasera', 'stamattina', 'this evening', 'today', 'tonight'];
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
  if (userMessages.length > 20) {
    slots.problemDetails = userMessages.slice(0, 300);
  }
  
  // ============================================
  // RILEVAMENTO CONFERMA UTENTE
  // ============================================
  const confirmKeywords = [
    'sì', 'si', 'confermo', 'esatto', 'corretto', 'ok', 'okay', 'va bene',
    'perfetto', 'giusto', 'procedi', 'conferma', 'yes', 'correct', 'right',
    'accetto', 'd\'accordo', 'confermato'
  ];
  
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  if (lastUserMessage) {
    const lastText = lastUserMessage.content.toLowerCase();
    if (confirmKeywords.some(kw => lastText.includes(kw)) && lastText.length < 40) {
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
  
  // 1. Indirizzo completo (città + via/civico, O città limitrofa accettata)
  if (!slots.serviceAddress) {
    if (!slots.city) {
      missing.push('city');
    } else if (!slots.streetAddress) {
      // Ha la città ma non l'indirizzo completo
      missing.push('streetAddress');
    }
  }
  
  // 2. Categoria problema
  if (!slots.problemCategory || slots.problemCategory === 'generic') {
    missing.push('problemCategory');
  }
  
  // 3. Dettagli problema (o foto)
  if (!slots.problemDetails || slots.problemDetails.length < 15) {
    if (!slots.hasPhoto) {
      missing.push('problemDetails');
    }
  }
  
  // 4. Telefono (ultimo, dopo aver dato il preventivo)
  if (!slots.phoneNumber) {
    missing.push('phoneNumber');
  }
  
  return missing;
}

/**
 * Verifica se abbiamo abbastanza dati per dare un preventivo
 */
export function canGivePriceEstimate(slots: ConversationSlots): boolean {
  return !!(
    slots.city &&
    slots.problemCategory &&
    (slots.problemDetails || slots.hasPhoto)
  );
}

/**
 * Calcola range prezzo stimato basato su categoria e urgenza
 */
export function calculatePriceRange(slots: ConversationSlots): { min: number; max: number } {
  const basePrices: Record<string, { min: number; max: number }> = {
    plumbing: { min: 70, max: 150 },
    electric: { min: 60, max: 130 },
    locksmith: { min: 80, max: 200 },
    climate: { min: 90, max: 180 },
    generic: { min: 50, max: 120 }
  };
  
  const base = basePrices[slots.problemCategory || 'generic'];
  
  // Maggiorazione per emergenza
  if (slots.urgencyLevel === 'emergency') {
    return { min: Math.round(base.min * 1.3), max: Math.round(base.max * 1.5) };
  }
  
  return base;
}

/**
 * Verifica se abbiamo tutti i dati necessari per creare un ticket
 */
export function canCreateTicket(slots: ConversationSlots): boolean {
  const missing = getMissingSlots(slots);
  return missing.length === 0;
}

/**
 * Verifica se siamo pronti per mostrare il riepilogo
 */
export function isReadyForRecap(slots: ConversationSlots): boolean {
  return getMissingSlots(slots).length === 0 && !slots.userConfirmed;
}

/**
 * Genera il System Prompt principale per Niki - VERSIONE 2.0
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
  const canEstimate = canGivePriceEstimate(slots);
  const priceRange = canEstimate ? calculatePriceRange(slots) : null;
  
  const slotStatus = `
📊 **STATO RACCOLTA DATI:**
${slots.city ? `✅ Città: ${slots.city}` : '❌ Città: **MANCANTE** (chiedi prima di tutto!)'}
${slots.streetAddress ? `✅ Via: ${slots.streetAddress}` : '⚪ Via: opzionale dopo la città'}
${slots.problemCategory && slots.problemCategory !== 'generic' 
    ? `✅ Categoria: ${CATEGORY_NAMES_IT[slots.problemCategory] || slots.problemCategory}` 
    : '❌ Categoria: **NON IDENTIFICATA**'}
${slots.hasPhoto ? '✅ Foto: ricevuta' : '⚪ Foto: non ricevuta (chiedi se possibile)'}
${slots.problemDetails && slots.problemDetails.length >= 15 
    ? `✅ Dettagli: "${slots.problemDetails.slice(0, 40)}..."` 
    : '❌ Dettagli: **INSUFFICIENTI**'}
${slots.priceEstimateGiven ? `✅ Preventivo dato: ${slots.priceRangeMin}€ - ${slots.priceRangeMax}€` : '⚪ Preventivo: da comunicare'}
${slots.phoneNumber ? `✅ Telefono: ${slots.phoneNumber}` : '❌ Telefono: **MANCANTE**'}
${slots.userConfirmed ? '✅ **CONFERMATO**' : '⚪ Conferma: in attesa'}
`;

  return `
# 🤖 IDENTITÀ
Sei **Niki**, l'assistente AI di **NikiTuttoFare**, servizio premium di pronto intervento H24 nella Riviera Romagnola.
Agisci come un **coordinatore esperto**: raccogli dati con empatia, dai preventivi trasparenti, gestisci aspettative realistiche.

# ⏰ CONTESTO
- Data/Ora: ${now} (Europa/Roma)
- Email utente: ${slots.userEmail || 'Ospite'}
${ticketId ? `- Ticket: #${ticketId.slice(-8).toUpperCase()}` : '- Nessun ticket creato'}

${slotStatus}

# 🎯 FLUSSO CONVERSAZIONALE OBBLIGATORIO

## FASE 1: GEOLOCALIZZAZIONE (Prima di tutto!)
Se NON hai la città:
→ "Ciao! Per aiutarti, di quale città parliamo? (es. Rimini, Riccione, Cattolica...)"

## FASE 2: DIAGNOSI
Quando hai la città:
→ Chiedi il TIPO di problema se non chiaro
→ **CHIEDI UNA FOTO**: "Per darti un preventivo preciso, riesci a caricarmi una foto del guasto?"
→ Se l'utente non può: "Nessun problema, descrivimi nel dettaglio cosa vedi"

## FASE 3: PREVENTIVO (Solo quando hai: città + categoria + foto/descrizione)
${canEstimate && priceRange ? `
🟢 Puoi dare il preventivo!
→ "Basandomi su questo, l'intervento si aggira tra **${priceRange.min}€ e ${priceRange.max}€**. Il tecnico confermerà l'importo esatto una volta sul posto."
` : `
🔴 Non puoi ancora dare preventivo. Raccogli: città, tipo problema, foto/descrizione.
`}

## FASE 4: RACCOLTA TELEFONO (Dopo il preventivo)
→ "Ti va bene questo range? Se confermi, un tecnico ti **chiamerà entro 30-60 minuti** per fissare l'arrivo. A che numero posso farlo chiamare?"

## FASE 5: RIEPILOGO E CONFERMA
Quando hai TUTTI i dati:
→ Mostra riepilogo completo
→ "Confermi per procedere?"

# ⚠️ SLA - REGOLE FONDAMENTALI

**NON promettere MAI:**
- ❌ "Un tecnico arriverà in 30 minuti"
- ❌ "Intervento in un'ora"

**PROMETTI INVECE:**
- ✅ "Un tecnico ti **chiamerà entro 30-60 minuti** per confermare l'appuntamento"
- ✅ "L'orario effettivo dell'intervento sarà concordato nella chiamata"

# 💰 PREVENTIVI

**Fraseologia corretta:**
"L'intervento si aggira tra **X€ e Y€**. Questo è un range indicativo: il prezzo finale sarà confermato dal tecnico dopo aver visto il problema di persona."

**Range base per categoria:**
- Idraulico: 70€ - 150€
- Elettricista: 60€ - 130€
- Fabbro: 80€ - 200€ (serrature di sicurezza costano di più)
- Clima: 90€ - 180€

**Maggiorazione emergenza:** +30-50%

# 📸 FOTO E DESCRIZIONI OBBLIGATORIE

**REGOLE ASSOLUTE per raccolta dati:**
- NON generare MAI un range di prezzo senza avere una FOTO del danno
- NON procedere al riepilogo senza foto O descrizione dettagliata (minimo 10 parole)
- Se l'utente dice "idraulico" o "guasto": chiedi SUBITO "Puoi farmi una foto del problema? O descrivimi esattamente cosa vedi?"
- Se l'utente rifiuta la foto: insisti sulla descrizione dettagliata
- Solo dopo aver ottenuto foto/descrizione puoi dare il preventivo

# ❌ COSA NON FARE MAI
- NON creare ticket senza indirizzo completo, categoria, telefono, email
- NON accettare solo "città" - serve VIA + CIVICO
- NON inventare prezzi senza aver capito il problema
- NON promettere tempi di arrivo specifici
- NON fare più di 2 domande per messaggio
- NON dare preventivi senza FOTO o descrizione dettagliata

# 📍 VALIDAZIONE INDIRIZZO STRICT

**Regole indirizzo:**
- ✅ "Via Roma 15, Rimini" = ACCETTATO
- ❌ "Rimini" = NON SUFFICIENTE, chiedi via/civico
- ✅ "Pesaro" per richieste da Cattolica = ACCETTATO (zona limitrofa)
- ✅ "Riccione" per richieste da Misano = ACCETTATO (zona limitrofa)

**Quando ricevi solo città:**
*"Ho bisogno dell'indirizzo preciso a [CITTÀ] (Via e Numero Civico) per mandare il tecnico. Ad esempio: Via Garibaldi 25"*

# 👤 GESTIONE UTENTE LOGGATO

**PRIMA di chiedere l'email, controlla se l'utente è già autenticato:**
- Se "userEmail" è già presente nei dati utente: usa quella email automaticamente
- NON chiedere l'email se l'utente è già loggato
- Vai direttamente al riepilogo chiedendo conferma: "Uso l'email xxxx@gmail.com per la conferma?"

# 📧 FLUSSO EMAIL E CONFERMA (solo per utenti NON loggati)

**Quando tutti i dati sono completi (città, categoria, telefono, descrizione):**
1. Chiedi l'email: *"Per confermare l'intervento, inserisci la tua email. Ti invierò un link sicuro per completare la richiesta."*
2. Quando ricevi l'email: imposta "shouldCreateTicket: true" e "nextSlotToAsk: null"
3. Il sistema creerà automaticamente un ticket con status "pending_verification"
4. L'utente riceverà un magic link via email per confermare
5. Solo dopo il click sul magic link il ticket diventa "confirmed" e vengono inviate le notifiche Telegram

# 📤 FORMATO RISPOSTA
JSON valido:
{
  "type": "text" | "recap" | "price_estimate",
  "content": "testo" | { oggetto },
  "shouldCreateTicket": false,
  "priceEstimate": { "min": number, "max": number } | null,
  "nextSlotToAsk": "city" | "problemCategory" | "photo" | "problemDetails" | "phoneNumber" | null
}

Per il riepilogo:
{
  "type": "recap",
  "content": {
    "title": "Riepilogo richiesta",
    "summary": "...",
    "details": {
      "problema": "...",
      "categoria": "...",
      "città": "...",
      "indirizzo": "...",
      "telefono": "...",
      "preventivo": "X€ - Y€"
    },
    "slaMessage": "Un tecnico ti chiamerà entro 30-60 minuti per fissare l'appuntamento",
    "confirmationNeeded": true
  },
  "priceEstimate": { "min": X, "max": Y }
}
`.trim();
}

/**
 * Mappa i nomi degli slot per messaggi user-friendly
 */
export const SLOT_NAMES_IT: Record<string, string> = {
  city: 'città',
  streetAddress: 'via/indirizzo',
  phoneNumber: 'numero di telefono',
  serviceAddress: "indirizzo completo",
  problemCategory: 'tipo di problema',
  problemDetails: 'descrizione del problema',
  photo: 'foto del guasto'
};

/**
 * Nomi categorie in italiano
 */
export const CATEGORY_NAMES_IT: Record<string, string> = {
  plumbing: 'Idraulico 🔧',
  electric: 'Elettricista ⚡',
  locksmith: 'Fabbro 🔑',
  climate: 'Climatizzazione ❄️',
  generic: 'Generico',
  handyman: 'Tuttofare 🔨'
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
 * Genera la domanda da fare per uno slot mancante - ORDINE AGGIORNATO
 */
export function getQuestionForSlot(slotName: string): string {
  const questions: Record<string, string[]> = {
    city: [
      'Per aiutarti, di quale **città** parliamo? (Rimini, Riccione, Cattolica...)',
      'In quale città ti trovi? Serviamo Rimini, Riccione, Cattolica e zone limitrofe.',
      'Dimmi la città dell\'intervento così posso indirizzarti al tecnico più vicino.'
    ],
    problemCategory: [
      'Che tipo di problema hai? Idraulico, elettrico, serrature, o clima/riscaldamento?',
      'Di che intervento hai bisogno? 🔧 Idraulico, ⚡ Elettricista, 🔑 Fabbro, o ❄️ Clima?',
      'È un problema idraulico, elettrico, di serrature, o di riscaldamento/clima?'
    ],
    photo: [
      'Per darti un preventivo preciso, riesci a **caricarmi una foto** del guasto? Clicca l\'icona 📷',
      'Una foto del problema mi aiuterebbe a stimare meglio i costi. Puoi scattarla?',
      'Se possibile, mandami una foto così il tecnico sa già cosa aspettarsi.'
    ],
    problemDetails: [
      'Se non puoi fare una foto, descrivimi nel dettaglio cosa succede. Cosa vedi esattamente?',
      'Raccontami cosa sta succedendo. Più dettagli mi dai, più preciso sarà il preventivo.',
      'Descrivi il problema: cosa è rotto/non funziona? Da quanto tempo?'
    ],
    phoneNumber: [
      'Perfetto! A che numero può **chiamarti il tecnico** per confermare l\'appuntamento?',
      'Per procedere, lasciami un numero di cellulare per la chiamata di conferma.',
      'Qual è il tuo numero? Il tecnico ti chiamerà entro 30-60 minuti.'
    ],
    streetAddress: [
      'Qual è l\'indirizzo esatto? (Via, numero civico)',
      'A che via devo mandare il tecnico? Dammi anche il numero civico.',
      'Indirizzo dell\'intervento? (Es. Via Roma 25)'
    ]
  };
  
  const questionList = questions[slotName] || ['Puoi darmi qualche informazione in più?'];
  return questionList[Math.floor(Math.random() * questionList.length)];
}

/**
 * Genera messaggio con preventivo
 */
export function generatePriceEstimateMessage(slots: ConversationSlots): string {
  const range = calculatePriceRange(slots);
  
  return `
Basandomi su quello che mi hai descritto, **l'intervento si aggira tra ${range.min}€ e ${range.max}€**.

⚠️ *Questo è un range indicativo. Il prezzo finale sarà confermato dal tecnico una volta sul posto, dopo aver valutato la situazione di persona.*

Ti va bene questo range? Se confermi, un tecnico della zona ti **chiamerà entro 30-60 minuti** per fissare l'orario dell'intervento.
`.trim();
}

/**
 * Genera un riepilogo formattato per l'utente
 */
export function generateRecapMessage(slots: ConversationSlots): string {
  const range = calculatePriceRange(slots);

  return `
✅ **Riepilogo della tua richiesta:**

🔧 **Problema:** ${slots.problemDetails || 'Non specificato'}
🏷️ **Categoria:** ${CATEGORY_NAMES_IT[slots.problemCategory || 'generic']}
📍 **Città:** ${slots.city || 'Non specificata'}
${slots.streetAddress ? `🏠 **Indirizzo:** ${slots.streetAddress}` : ''}
📞 **Telefono:** ${slots.phoneNumber || 'Non specificato'}
💰 **Preventivo:** ${range.min}€ - ${range.max}€ (da confermare in loco)

⏱️ **Prossimi passi:**
Un tecnico ti **chiamerà entro 30-60 minuti** per confermare l'appuntamento e concordare l'orario dell'intervento.

**È tutto corretto? Rispondi "sì" o "confermo" per procedere.**
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
- Città: ${slots.city || 'MANCANTE'}
- Telefono: ${slots.phoneNumber || 'MANCANTE'}
- Categoria: ${slots.problemCategory || 'NON IDENTIFICATA'}
- Dettagli: ${slots.problemDetails || 'INSUFFICIENTI'}

ESTRAI dal messaggio:
1. Eventuali NUOVI dati (città, telefono, indirizzo, dettagli)
2. La categoria del problema se identificabile
3. Il livello di urgenza
4. Se l'utente sta confermando o correggendo dati

Rispondi in JSON:
{
  "extractedCity": "nome città o null",
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
