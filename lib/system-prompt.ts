// lib/system-prompt.ts
import { getTasksKnowledgeString } from '@/lib/task-definitions';
import { DOMAIN_KNOWLEDGE, buildTechnicianContextPrompt } from '@/lib/domain-knowledge';
import { buildExamplesContext } from '@/lib/training-examples';
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

  // Flag rifiuto preventivo (per non riproporre all'infinito dopo un "no")
  quoteRejected?: boolean;
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
  // ESTRAZIONE CATEGORIA PROBLEMA (usando DOMAIN_KNOWLEDGE)
  // ============================================
  for (const [category, data] of Object.entries(DOMAIN_KNOWLEDGE)) {
    const bag = [...data.keywords, ...(data.user_phrases || [])].map(k => k.toLowerCase());
    if (bag.some(kw => text.includes(kw))) {
      slots.problemCategory = category as ConversationSlots['problemCategory'];
      if (!slots.problemDetails && text.length > 10) {
        slots.problemDetails = text.slice(0, 300);
      }
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
  // Cerca il messaggio che descrive il problema (dopo la selezione categoria)
  const problemMessages = [];
  let foundCategoryQuestion = false;

  for (const msg of messages.slice().reverse()) { // Dalla fine all'inizio
    const assistantContent = (msg.content || '').toLowerCase();
    if (
      msg.role === 'assistant' &&
      (
        assistantContent.includes('raccontami') ||
        assistantContent.includes('descrivi') ||
        assistantContent.includes('per il preventivo') ||
        assistantContent.includes('dimmi cosa succede') ||
        assistantContent.includes('cosa succede')
      )
    ) {
      foundCategoryQuestion = true;
      continue;
    }
    if (foundCategoryQuestion && msg.role === 'user' && typeof msg.content === 'string') {
      problemMessages.unshift(msg.content); // Aggiungi all'inizio per mantenere ordine
      if (problemMessages.length >= 3) break; // Prendi max 3 messaggi di descrizione
    }
  }

  if (problemMessages.length > 0) {
    slots.problemDetails = problemMessages.join(' ').slice(0, 300);
  } else if (userMessages.length > 10) {
    // Fallback: usa il testo completo
    slots.problemDetails = userMessages.slice(0, 300);
  }
  
  // ============================================
  // RILEVAMENTO CONFERMA UTENTE
  // ============================================
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  if (lastUserMessage) {
    const lastText = (lastUserMessage.content || '').toLowerCase().trim();

    // Rifiuto ha priorità (evita "non mi va bene" -> match su "va bene")
    const rejectPatterns: RegExp[] = [
      /^no\b/i,
      /\bno grazie\b/i,
      /\brifiuto\b/i,
      /\bnon accetto\b/i,
      /\bnon mi va bene\b/i,
      /\bnon va bene\b/i,
      /\bnon procedere\b/i,
    ];

    if (rejectPatterns.some((re) => re.test(lastText))) {
      slots.userConfirmed = false;
      slots.quoteRejected = true;
    } else {
      const acceptPatterns: RegExp[] = [
        /\bsì\b/i,
        /\bsi\b/i,
        /\bconfermo\b/i,
        /\besatto\b/i,
        /\bcorretto\b/i,
        /\bok\b/i,
        /\bokay\b/i,
        /\bva bene\b/i,
        /\bperfetto\b/i,
        /\bprocedi\b/i,
        /\bconferma\b/i,
        /\byes\b/i,
        /\baccetto\b/i,
        /\bd'accordo\b/i,
        /s[iì],?\s*accetto il preventivo\.?\s*procediamo!?/i,
      ];

      if (acceptPatterns.some((re) => re.test(lastText)) && lastText.length < 80) {
        slots.userConfirmed = true;
      }
    }
  }

  // ============================================
  // Persistenza preventivo: se l'assistente ha già inviato un price_estimate
  // (il frontend lo manda come JSON stringify)
  // ============================================
  for (const msg of messages) {
    if (msg.role !== 'assistant') continue;
    const raw = msg.content;
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed !== 'object' || parsed === null) continue;
      const t = (parsed as { type?: unknown }).type;
      if (t !== 'price_estimate') continue;
      const c = (parsed as { content?: unknown }).content;
      if (typeof c !== 'object' || c === null) continue;
      const priceMin = (c as { priceMin?: unknown }).priceMin;
      const priceMax = (c as { priceMax?: unknown }).priceMax;
      if (typeof priceMin === 'number' && typeof priceMax === 'number') {
        slots.priceEstimateGiven = true;
        slots.priceRangeMin = priceMin;
        slots.priceRangeMax = priceMax;
      }
    } catch {
      // ignore
    }
  }
  
  return slots;
}

/**
 * Determina quali slot mancano ancora.
 * 
 * ORDINE STRICT OBBLIGATORIO (non saltare!):
 * 1. CITTÀ - Dove sei?
 * 2. CATEGORIA - Che tipo di intervento? (se non già chiaro)
 * 3. DETTAGLI PROBLEMA - Cosa succede esattamente? (BLOCCANTE!)
 * 4. [Preventivo dato qui]
 * 5. INDIRIZZO COMPLETO - Via e civico
 * 6. TELEFONO - Per la chiamata del tecnico
 */
export function getMissingSlots(slots: ConversationSlots): string[] {
  const missing: string[] = [];
  
  // ============================================
  // STEP 1: CITTÀ (obbligatoria per prima)
  // ============================================
  if (!slots.city) {
    missing.push('city');
    return missing; // BLOCCO: non procedere senza città
  }
  
  // ============================================
  // STEP 2: CATEGORIA (se non già identificata)
  // ============================================
  if (!slots.problemCategory || slots.problemCategory === 'generic') {
    missing.push('problemCategory');
    return missing; // BLOCCO: non procedere senza categoria
  }
  
  // ============================================
  // STEP 3: DETTAGLI PROBLEMA (BLOCCANTE!)
  // Questo è il FIX principale: NON si può andare avanti
  // senza sapere COSA è successo
  // ============================================
  const hasValidProblemDetails = checkProblemDetailsValid(slots);
  
  if (!hasValidProblemDetails) {
    missing.push('problemDetails');
    return missing; // BLOCCO CRITICO: non procedere senza diagnosi
  }
  
  // ============================================
  // STEP 4: A questo punto possiamo dare il preventivo
  // ============================================
  
  // ============================================
  // STEP 5: INDIRIZZO COMPLETO (via + civico)
  // Solo DOPO aver dato il preventivo
  // ============================================
  if (!slots.streetAddress) {
    missing.push('streetAddress');
    return missing; // BLOCCO: serve indirizzo per mandare il tecnico
  }
  
  // ============================================
  // STEP 6: TELEFONO (ultimo step)
  // ============================================
  if (!slots.phoneNumber) {
    missing.push('phoneNumber');
  }
  
  return missing;
}

/**
 * Verifica se i dettagli del problema sono sufficienti.
 * Richiede descrizione specifica o foto.
 */
export function checkProblemDetailsValid(slots: ConversationSlots): boolean {
  // Se c'è una foto, è sufficiente
  if (slots.hasPhoto) {
    return true;
  }
  
  // Se non c'è descrizione, non valido
  if (!slots.problemDetails) {
    return false;
  }
  
  // Normalizza testo e rimuove lettere duplicate (rubinettto -> rubinetto)
  let details = slots.problemDetails.toLowerCase().trim();
  details = details.replace(/(.)\1{2,}/g, '$1$1');
  details = details
    .replace(/\brubinett[oa]\b/g, 'rubinetto')
    .replace(/\bmiscelator[ei]\b/g, 'miscelatore')
    .replace(/\bsifon[ei]\b/g, 'sifone')
    .replace(/\bflessibil[ei]\b/g, 'flessibile');
  const wordCount = details.split(/\s+/).filter(w => w.length > 0).length;

  // Normalizza typo comuni per match keyword
  details = details
    .replace(/\bintatast[oa]\b/g, 'intasato')
    .replace(/\bintassat[oa]\b/g, 'intasato')
    .replace(/\bintasat[oa]\b/g, 'intasato');
  
  // ============================================
  // FIX VALIDAZIONE: Blacklist frasi generiche che NON sono dettagli
  // ============================================
  const genericPhrases = [
    // Richieste generiche di preventivo
    /^(vorrei|ho bisogno|cerco|serve|mi serve).{0,30}(preventivo|intervento|aiuto|tecnico|assistenza)/i,
    // Solo categoria menzionata
    /^(problema|guasto|emergenza).{0,15}(idraulico|elettrico|fabbro|clima|condizionatore|caldaia)$/i,
    // Risposte monosillabiche
    /^(si|sì|no|ok|certo|va bene|perfetto)\.?$/i,
    // Solo città o indirizzo
    /^(via|corso|piazza|rimini|riccione|cattolica)/i,
  ];
  
  // Se il testo è troppo generico, NON è valido
  for (const genericPattern of genericPhrases) {
    if (genericPattern.test(details)) {
      return false;
    }
  }
  
  // ============================================
  // Keywords specifiche per categoria che indicano un problema CONCRETO
  // ============================================
  const specificKeywords = {
    // Fabbro - problemi specifici
    locksmith: /\b(chiave.{0,10}(spezzata|rotta|bloccata|incastrata|persa|non gira)|cilindro|serratura.{0,10}(rotta|bloccata)|chiuso fuori|non si apre|gira a vuoto|scassinata)\b/i,
    // Idraulico - sintomi concreti
    plumbing: /\b(perde|perdita|goccia|allagamento|intasato|otturato|non scarica|scarico.{0,10}(lento|bloccato)|rubinetto.{0,12}(rotto|perde|cambiare|sostituire)|miscelatore.{0,10}(rotto|perde|cambiare|sostituire)|wc|lavandino|bidet|doccia.{0,10}(perde|rotta)|pressione.{0,10}(bassa|alta)|acqua calda.{0,10}(non|manca))\b/i,
    // Elettricista - sintomi concreti
    electric: /\b(scatta|salvavita.{0,10}scatta|blackout|cortocircuito|presa.{0,12}(bruciata|non funziona|da aggiungere|da spostare)|interruttore|lampadina.{0,10}non|scintille|bruciato|quadro|contatore|senza corrente|senza luce|installare.{0,8}lampadario|montare.{0,8}lampadario|punto luce.{0,10}(aggiungere|spostare|nuovo))\b/i,
    // Clima - sintomi concreti
    climate: /\b(non scalda|non raffresca|non raffredda|non parte|rumore.{0,10}(strano|forte)|perde acqua|condensa|gocciola|gas|ricarica|manutenzione|caldaia.{0,10}(non|errore|blocca)|termostato.{0,10}non|split.{0,10}non)\b/i,
    // Generico - azioni concrete con oggetto
    generic: /\b(montare.{0,15}\w+|smontare.{0,15}\w+|installare.{0,15}\w+|sostituire.{0,15}\w+|riparare.{0,15}\w+|appendere.{0,15}\w+|fissare.{0,15}\w+)\b/i
  };
  
  // Controlla se contiene keywords specifiche per la categoria
  const categoryKeywords = specificKeywords[slots.problemCategory as keyof typeof specificKeywords] || specificKeywords.generic;
  const hasSpecificKeyword = categoryKeywords.test(details);
  
  // Se ha keyword specifica del problema, è valido
  if (hasSpecificKeyword) {
    return true;
  }
  
  // ============================================
  // Fallback: lunghezza minima PIÙ alta
  // Richiede una descrizione SOSTANZIOSA se non ci sono keywords
  // ============================================
  // Almeno 15 parole O 80 caratteri per essere considerato "dettaglio"
  const hasSubstantialLength = wordCount >= 15 || details.length >= 80;
  
  // Debug log per capire perché i dettagli sono invalidi
  if (!hasSubstantialLength) {
    console.log('⚠️ Details validation failed:', {
      details: details.slice(0, 50) + '...',
      wordCount,
      length: details.length,
      hasKeyword: hasSpecificKeyword
    });
  }
  
  return hasSubstantialLength;
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
  const canEstimate = canGivePriceEstimate(slots) && !slots.userConfirmed;
  const priceRange = canEstimate ? calculatePriceRange(slots) : null;
  
  // Verifica se i dettagli sono validi
  const detailsValid = slots.hasPhoto || (slots.problemDetails && slots.problemDetails.length >= 20);
  
  const slotStatus = `
📊 **STATO RACCOLTA DATI (in ordine):**
${slots.city ? `✅ 1. Città: ${slots.city}` : '❌ 1. Città: **MANCANTE** → CHIEDI PRIMA!'}
${slots.problemCategory && slots.problemCategory !== 'generic' 
    ? `✅ 2. Categoria: ${CATEGORY_NAMES_IT[slots.problemCategory] || slots.problemCategory}` 
    : '❌ 2. Categoria: **NON IDENTIFICATA** → CHIEDI!'}
${detailsValid
    ? `✅ 3. Diagnosi: "${(slots.problemDetails || 'foto ricevuta').slice(0, 35)}..."` 
    : '🔴 3. Diagnosi: **MANCANTE** → CHIEDI COSA È SUCCESSO!'}
${slots.priceEstimateGiven ? `✅ 4. Preventivo: ${slots.priceRangeMin}€ - ${slots.priceRangeMax}€` : '⚪ 4. Preventivo: da dare dopo diagnosi'}
${slots.streetAddress ? `✅ 5. Via: ${slots.streetAddress}` : '⚪ 5. Via: da chiedere dopo preventivo'}
${slots.phoneNumber ? `✅ 6. Telefono: ${slots.phoneNumber}` : '⚪ 6. Telefono: da chiedere per ultimo'}
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

# 🧠 ESPERTO TECNICO
Usa la knowledge base tecnica per capire se il lavoro è domestico (prezzo base) o Horeca/Commerciale (impianti complessi, sopralluogo/range "a partire da"). Se emergono termini di hotel/ristoranti/impianti industriali, adotta tono professionale, evita prezzi fissi e proponi sopralluogo o range alto.

${buildTechnicianContextPrompt()}

# 🧪 CASI DI RIFERIMENTO (SEED + SIMULATED)
Usa questi esempi reali per orientare tono e priorità. Non copiarli, ma riconosci pattern di categoria/urgenza e expected_action simili.

${buildExamplesContext(18)}

# 🧠 CLASSIFICAZIONE INTERVENTI
Usa questa knowledge base per capire se il lavoro è Residenziale (standard) o Commerciale/Horeca (complesso). Se l'utente menziona attrezzature di hotel/ristoranti (celle frigo, degrassatori, maniglioni antipanico, VRF/VRV, abbattitori, cappe industriali), chiedi sempre se è un'attività commerciale e adatta il tono: più professionale, proponi sopralluogo se il lavoro è complesso, evita preventivi bassi "da casa".

${getTasksKnowledgeString()}

# 🎯 FLUSSO CONVERSAZIONALE STRICT (NON SALTARE STEP!)

## ⚠️ REGOLA CRITICA: ORDINE BLOCCANTE
Devi seguire quest'ordine ESATTO. NON puoi passare allo step successivo senza completare il precedente!

## STEP 1: CITTÀ 📍
Se NON hai la città:
→ "Per aiutarti, di quale città parliamo? (Rimini, Riccione, Cattolica...)"
**BLOCCO:** Non procedere senza città.

## STEP 2: CATEGORIA 🔧
Se hai la città ma NON la categoria:
→ "Che tipo di intervento ti serve? Idraulico, elettricista, fabbro, o clima?"
**BLOCCO:** Non procedere senza sapere il tipo.

## STEP 3: DIAGNOSI DEL PROBLEMA 🔍 (CRITICO!)
Questo è il passaggio PIÙ IMPORTANTE. NON puoi chiedere indirizzo o telefono se non sai COSA è successo!

**Domande specifiche per categoria:**
- 🔑 **Fabbro:** "Sei chiuso fuori? La chiave si è spezzata? La serratura non gira?"
- 🔧 **Idraulico:** "Da dove perde? Lo scarico è intasato? C'è allagamento?"
- ⚡ **Elettricista:** "Salta il salvavita? Blackout? Presa bruciata?"
- ❄️ **Clima:** "Non scalda/raffresca? Non parte? Fa rumore?"

**Se l'utente è vago ("non funziona", "è rotto"):**
→ INSISTI: "Capisco, ma per darti il prezzo giusto devo sapere cosa vedi. Puoi descrivermi meglio o mandarmi una foto?"

**BLOCCO ASSOLUTO:** Senza descrizione specifica, NON procedere!

## STEP 4: PREVENTIVO 💰
**SOLO quando hai:** città ✅ + categoria ✅ + problema specifico ✅
${slots.userConfirmed ? `
✅ **PREVENTIVO GIÀ ACCETTATO**
L'utente ha confermato il preventivo.
⛔ NON mostrare più il preventivo.
⏭️ PASSA SUBITO ALLO STEP 5 (Indirizzo).
` : (canEstimate && priceRange ? `
🟢 ORA puoi dare il preventivo!
→ "Basandomi su [problema specifico], l'intervento si aggira tra **${priceRange.min}€ e ${priceRange.max}€**."
` : `
🔴 NON puoi ancora dare preventivo! Torna agli step precedenti.
`)}

## STEP 5: INDIRIZZO 🏠
Solo DOPO che l'utente ha **ACCETTATO** il preventivo (userConfirmed = true):
→ "Perfetto. Dimmi l'indirizzo esatto (via e numero civico)"

**REGOLA ANTI-LOOP:** se userConfirmed = true, NON ripetere il preventivo: passa subito a indirizzo/telefono.

## STEP 6: TELEFONO 📞
Ultimo step:
→ "A che numero può chiamarti il tecnico per confermare?"

## STEP 7: RIEPILOGO E CONFERMA ✅
→ Mostra tutti i dati raccolti
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

# 📸 DIAGNOSI OBBLIGATORIA - REGOLA CRITICA

**IL PROBLEMA PIÙ COMUNE:**
L'utente dice "Vorrei un fabbro" o "Ho bisogno di un idraulico" → NON SAI ANCORA NULLA!
Non sai se deve aprire una porta blindata (80€) o cambiare tutto il cilindro (200€).

**SEQUENZA OBBLIGATORIA:**
1. ✅ Utente: "Vorrei un fabbro"
2. ✅ Tu: "Certo! Per darti il prezzo giusto, dimmi cosa è successo: sei chiuso fuori? La chiave si è spezzata? La serratura non gira?"
3. ✅ Utente: "La chiave si è rotta dentro"
4. ✅ Tu: "Capito, estrazione chiave spezzata. Il costo è tra 80€ e 120€. Se ti va bene, dammi l'indirizzo."

**RISPOSTE VALIDE (accetta e procedi):**
- "chiave spezzata dentro" ✅
- "porta blindata bloccata" ✅  
- "serratura gira a vuoto" ✅
- "chiuso fuori casa" ✅
- "perde acqua dal tubo sotto il lavandino" ✅
- "salvavita che scatta ogni volta" ✅

**RISPOSTE VAGHE (chiedi di più):**
- "non funziona" ❌ → Chiedi: "Cosa non funziona esattamente?"
- "è rotto" ❌ → Chiedi: "Cosa vedi? Cosa succede quando provi ad usarlo?"
- "ho un problema" ❌ → Chiedi: "Descrivimi il problema: cosa vedi/senti?"

**DOPO 2 TENTATIVI:** Se l'utente rimane vago, accetta e procedi con preventivo generico.

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

# 👤 GESTIONE UTENTE LOGGATO - REGOLA ASSOLUTA

**CHECK OBBLIGATORIO PRIMA DI QUALSIASI DOMANDA:**
- Se "userEmail" è popolato e valido: USA QUELL'EMAIL AUTOMATICAMENTE
- NON chiedere MAI l'email se "userEmail" esiste
- Salta direttamente al riepilogo: "Perfetto! Ho tutte le informazioni necessarie. Procediamo con la conferma?"
- Se "userEmail" è null/undefined/vuoto: ALLORA chiedi l'email all'utente

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
 * Genera la domanda da fare per uno slot mancante.
 * Le domande per problemDetails sono specifiche per categoria.
 */
export function getQuestionForSlot(slotName: string, category?: string): string {
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
    phoneNumber: [
      'Perfetto! A che numero può **chiamarti il tecnico** per confermare l\'appuntamento?',
      'Per procedere, lasciami un numero di cellulare per la chiamata di conferma.',
      'Qual è il tuo numero? Il tecnico ti chiamerà entro 30-60 minuti.'
    ],
    streetAddress: [
      'Ora mi serve l\'**indirizzo esatto** per mandare il tecnico. Via e numero civico?',
      'A che via ti trovo? Dammi anche il numero civico.',
      'Indirizzo completo dell\'intervento? (Es. Via Roma 25)'
    ]
  };

  // Domande specifiche per problemDetails in base alla categoria
  const categorySpecificQuestions: Record<string, string[]> = {
    locksmith: [
      '🔑 Per darti il preventivo giusto, dimmi cosa è successo:\n• Sei rimasto **chiuso fuori**?\n• La **chiave si è spezzata** nella serratura?\n• La serratura **non gira** o gira a vuoto?\n• Devi **cambiare il cilindro** o la maniglia?',
      '🔑 Descrivimi il problema con la serratura. È una porta blindata? La chiave funziona? Sei chiuso fuori o riesci ad aprire?',
      '🔑 Cosa succede esattamente? Porta bloccata, chiave rotta dentro, serratura che non gira?'
    ],
    plumbing: [
      '🔧 Per il preventivo, dimmi cosa vedi:\n• Da **dove perde** l\'acqua?\n• Lo **scarico è intasato**?\n• C\'è un **allagamento** in corso?\n• Il rubinetto/WC non funziona?',
      '🔧 Descrivimi il problema idraulico: perde da un tubo? Lo scarico è bloccato? C\'è acqua per terra?',
      '🔧 Cosa succede? Perdita d\'acqua, scarico otturato, rubinetto rotto? Da dove viene il problema?'
    ],
    electric: [
      '⚡ Per il preventivo, dimmi cosa succede:\n• Salta il **salvavita**?\n• C\'è un **blackout** in casa?\n• Qualche **presa non funziona**?\n• Vedi **scintille** o senti odore di bruciato?',
      '⚡ Descrivimi il problema elettrico: scatta il salvavita? Hai perso corrente? Una presa non funziona?',
      '⚡ Cosa è successo? Blackout totale, salvavita che scatta, prese bruciate?'
    ],
    climate: [
      '❄️ Per il preventivo, dimmi cosa succede:\n• Il condizionatore/caldaia **non si accende**?\n• **Non scalda** o **non raffresca**?\n• Fa **rumori strani**?\n• Serve una **manutenzione** o ricarica gas?',
      '❄️ Descrivimi il problema: non parte? Non raffresca/scalda abbastanza? Fa rumore?',
      '❄️ Cosa non funziona? Condizionatore, caldaia, termosifoni? Descrivi il problema.'
    ],
    generic: [
      '🔨 Per darti un preventivo preciso, descrivimi **cosa devi fare**:\n• Cosa va **montato/installato**?\n• Cosa è **rotto** e va riparato?\n• Di che tipo di lavoro si tratta?',
      '🔨 Dimmi di più sul lavoro da fare: cosa devo montare, riparare o sistemare?',
      '🔨 Descrivimi nel dettaglio cosa serve: montaggio, riparazione, installazione?'
    ]
  };

  // Se è problemDetails, usa le domande specifiche per categoria
  if (slotName === 'problemDetails') {
    const categoryQuestions = categorySpecificQuestions[category || 'generic'] || categorySpecificQuestions.generic;
    return categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
  }
  
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
