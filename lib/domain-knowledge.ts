// lib/domain-knowledge.ts
/**
 * Base di conoscenza tecnica per NikiTuttoFare.
 * Serve per classificare l'intento, stimare la complessità e distinguere B2C (Casa) da B2B (Horeca).
 */

export const DOMAIN_KNOWLEDGE = {
  // ==========================================
  // IDRAULICO 🔧
  // ==========================================
  plumbing: {
    label: 'Idraulico',
    keywords: [
      'acqua', 'tubo', 'tubi', 'perdita', 'perde', 'goccia', 'scarico', 'wc', 'water', 'bidet',
      'lavandino', 'lavello', 'doccia', 'vasca', 'sifone', 'rubinetto', 'miscelatore', 'sciacquone',
      'cassetta', 'galleggiante', 'flessibile', 'autoclave', 'pompa', 'pozzetto', 'fossa', 'biologica',
      'calcare', 'pressione', 'allagato', 'intasato', 'otturato', 'sanitari', 'trituratore', 'sanitrit',
    ],
    user_phrases: [
      'ho acqua per terra', 'il lavandino non scarica', 'sento scorrere acqua', 'macchia sul muro',
      'rubinetto che perde', 'doccia fredda', 'wc intasato', 'cattivo odore dagli scarichi',
      'non arriva acqua', 'pressione bassa',
    ],
    tasks_residential: [
      'Sostituzione rubinetteria/miscelatori',
      'Riparazione cassetta scarico WC (Geberit/esterna)',
      'Disotturazione lavello/bidet/doccia (sifoni)',
      'Sostituzione flessibili e guarnizioni',
      'Installazione lavatrice/lavastoviglie',
      'Sostituzione sanitari (WC/Bidet)',
      'Ricerca perdita semplice (visiva)',
    ],
    tasks_commercial: [
      'Spurgo colonne scarico cucine industriali',
      'Manutenzione degrassatori (Ristoranti)',
      'Riparazione/Sostituzione pompe sommerse e autoclavi (Hotel)',
      'Installazione addolcitori industriali',
      'Manutenzione bagni ospiti (batterie di scarico)',
      'Interventi su bollitori grandi utenze',
    ],
    diagnosis_questions: [
      "L'acqua scorre continuamente o solo quando apri il rubinetto?",
      'Si tratta di una perdita visibile o vedi solo la macchia?',
      'Il problema riguarda un solo sanitario o tutto il bagno?',
      "È un impianto condominiale o privato?",
    ],
  },

  // ==========================================
  // ELETTRICISTA ⚡
  // ==========================================
  electric: {
    label: 'Elettricista',
    keywords: [
      'luce', 'corrente', 'elettricità', 'presa', 'interruttore', 'pulsante', 'salvavita', 'differenziale',
      'magnetotermico', 'contatore', 'blackout', 'corto', 'cortocircuito', 'scintilla', 'bruciato', 'puzza di bruciato',
      'lampadario', 'faretto', 'led', 'neon', 'cavo', 'fili', 'messa a terra', 'cancello', 'citofono', 'videocitofono',
    ],
    user_phrases: [
      'è saltata la luce', 'non si alza il salvavita', 'presa che frigge', 'odore di plastica bruciata',
      'interruttore rotto', 'non va il campanello', 'metà casa senza corrente', 'lampadina esplosa',
      'cavi scoperti',
    ],
    tasks_residential: [
      'Sostituzione prese/interruttori (frutti)',
      'Installazione lampadari/applique',
      'Riarmo salvavita e ricerca guasto base',
      'Sostituzione citofono standard',
      'Spostamento punti luce',
      'Certificazione conformità base',
    ],
    tasks_commercial: [
      'Interventi su quadri elettrici 380V (Trifase)',
      "Illuminazione d'emergenza (Hotel/Locali)",
      'Manutenzione insegne luminose',
      'Cablaggi strutturati (Rete/Dati)',
      'Quadri comando celle frigo/cucine',
      'Verifiche messa a terra periodiche',
    ],
    diagnosis_questions: [
      'Salta la corrente appena accendi un elettrodomestico specifico?',
      "È saltato il contatore generale in strada o solo quello in casa?",
      'Senti odore di bruciato vicino al quadro elettrico?',
      'Hai provato a staccare tutti gli elettrodomestici?',
    ],
  },

  // ==========================================
  // FABBRO 🔑
  // ==========================================
  locksmith: {
    label: 'Fabbro',
    keywords: [
      'porta', 'portone', 'blindata', 'serratura', 'cilindro', 'chiave', 'chiavi', 'maniglia', 'pomolo',
      'mandata', 'scatto', 'rotta', 'spezzata', 'incastrata', 'bloccata', 'chiuso fuori', 'perso chiavi',
      'ladri', 'scasso', 'cassaforte', 'tapparella', 'serranda', 'basculante', 'garage', 'molla', 'chiudiporta',
    ],
    user_phrases: [
      'sono rimasto chiuso fuori', 'la chiave non gira', 'chiave spezzata dentro', 'porta bloccata',
      'non si apre la porta blindata', 'serratura dura', 'maniglia che cade', 'cambio serratura per sicurezza',
      'tapparella caduta',
    ],
    tasks_residential: [
      'Apertura porta (senza scasso se possibile)',
      'Sostituzione cilindro europeo',
      'Riparazione tapparelle (cinghia/rullo)',
      'Sostituzione serratura porta blindata',
      'Regolazione cerniere porte interne',
    ],
    tasks_commercial: [
      'Installazione/Riparazione maniglioni antipanico (Uscite sicurezza)',
      'Riparazione molle aeree chiudiporta (Negozi/Condomini)',
      'Sblocco serrande motorizzate negozi',
      'Masterizzazione chiavi (Passepartout Hotel)',
      'Apertura casseforti bloccate (Hotel)',
      'Manutenzione porte tagliafuoco',
    ],
    diagnosis_questions: [
      'La porta è solo accostata o chiusa a chiave con le mandate?',
      'La chiave entra e non gira, o non entra proprio?',
      'Siete dentro casa o bloccati fuori?',
      'È una porta blindata di sicurezza o una porta normale?',
    ],
  },

  // ==========================================
  // CLIMATIZZAZIONE ❄️
  // ==========================================
  climate: {
    label: 'Climatizzazione',
    keywords: [
      'condizionatore', 'clima', 'split', 'aria condizionata', 'caldo', 'freddo', 'refrigerazione',
      'caldaia', 'termosifone', 'radiatore', 'termostato', 'comando', 'telecomando', 'filtri', 'gas',
      'ricarica', 'perdita acqua split', 'rumore', 'ventola', 'motore esterno', 'pompa di calore',
      'cella', 'frigo', 'banco frigo', 'fancoil', 'vrv', 'vrf',
    ],
    user_phrases: [
      'il condizionatore non raffredda', 'esce aria calda', 'perde acqua in casa', 'caldaia in blocco',
      'termosifoni freddi', 'errore sul display', 'fanno rumore le tubature', 'devo ricaricare il gas',
      'puzza quando accendo l\'aria',
    ],
    tasks_residential: [
      'Manutenzione ordinaria (pulizia filtri/sanificazione)',
      'Ricarica gas refrigerante (previa ricerca perdita)',
      'Sblocco caldaia murale',
      'Sostituzione termostato ambiente',
      'Disostruzione scarico condensa split',
    ],
    tasks_commercial: [
      'Riparazione celle frigorifere (Ristoranti/Alimentari)',
      'Interventi su abbattitori di temperatura',
      'Manutenzione impianti canalizzati o VRV (Hotel)',
      'Riparazione banchi frigo bar/negozi',
      'Manutenzione lame d’aria ingresso negozi',
      'Riparazione fabbricatori di ghiaccio',
    ],
    diagnosis_questions: [
      'Il motore esterno parte o rimane fermo?',
      'Vedi qualche codice di errore sul display?',
      'Quando è stata fatta l’ultima manutenzione?',
      'Il problema è su una sola unità o su tutto l’impianto?',
    ],
  },

  // ==========================================
  // TUTTOFARE 🔨
  // ==========================================
  handyman: {
    label: 'Tuttofare',
    keywords: [
      'montare', 'smontare', 'fissare', 'appendere', 'silicone', 'stucco', 'imbiancare', 'ritocco',
      'mobile', 'armadio', 'libreria', 'ikea', 'tenda', 'bastone', 'mensola', 'specchio', 'quadro',
      'tv', 'staffa', 'zanzariera', 'persiana', 'sostituire', 'piccolo lavoro', 'manutenzione',
    ],
    user_phrases: [
      'devo montare un armadio', 'fissare la tv al muro', 'cambiare il silicone della doccia',
      'appendere dei quadri', 'piccoli lavoretti di casa', 'montaggio mobili ikea', 'sistemare un’anta',
    ],
    tasks_residential: [
      'Montaggio mobili in kit (IKEA, Mondo Conv, ecc.)',
      'Installazione mensole, quadri, specchi',
      'Fissaggio supporti TV a muro',
      'Siliconature bagni/cucine',
      'Riparazione tapparelle manuali',
      'Installazione bastoni tende',
    ],
    tasks_commercial: [
      'Manutenzione generica camere Hotel (ritocchi pittura, siliconi)',
      'Montaggio arredi per negozi/uffici',
      'Sostituzione lampadine faretti vetrine (altezze elevate)',
      'Sgombero locali/cantine',
      'Piccoli traslochi interni',
    ],
    diagnosis_questions: [
      'Hai già i materiali o deve procurarli il tecnico?',
      'Quanto è grande il mobile da montare (quante ante)?',
      'Serve un trapano o tasselli specifici per muri particolari (cartongesso)?',
      'A che piano si trova l’intervento?',
    ],
  },
};

/**
 * Keywords che identificano un cliente Business (Hotel/Ristoranti)
 */
export const BUSINESS_TRIGGERS = [
  'hotel', 'albergo', 'ristorante', 'cucina industriale', 'bar', 'negozio', 'ufficio',
  'azienda', 'camere', 'reception', 'hall', 'cliente', 'ospiti', 'cella frigo',
  'banco', 'vetrina', 'insegna', 'spogliatoio dipendenti', 'magazzino', 'fattura elettronica',
];

/**
 * Genera il prompt di contesto per l'AI
 */
export function buildTechnicianContextPrompt(): string {
  let prompt = '🧠 **KNOWLEDGE BASE TECNICA & SETTORI**\n\n';

  // Aggiungi trigger Business
  prompt += '**⚠️ RILEVAMENTO CONTESTO B2B (Hotel/Ristoranti):**\n';
  prompt += `Se l'utente usa parole come: [${BUSINESS_TRIGGERS.join(', ')}]\n`;
  prompt += "-> CLASSIFICA come intervento 'COMMERCIALE'.\n";
  prompt += "-> AZIONI: Richiedi partita IVA se necessario, aspettati impianti complessi, priorità alta.\n\n";

  // Aggiungi dettagli per categoria
  for (const [, data] of Object.entries(DOMAIN_KNOWLEDGE)) {
    prompt += `### ${data.label.toUpperCase()}\n`;
    prompt += `🔹 **Parole Chiave:** ${data.keywords.slice(0, 15).join(', ')}...\n`;
    prompt += `🏠 **Casa (Standard):** ${data.tasks_residential.join(', ')}\n`;
    prompt += `🏢 **Business (Complesso):** ${data.tasks_commercial.join(', ')}\n`;
    prompt += `❓ **Cosa Chiedere:** "${data.diagnosis_questions[0]}" o "${data.diagnosis_questions[1]}"\n\n`;
  }

  return prompt;
}
