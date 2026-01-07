// lib/task-definitions.ts
// Knowledge base per classificare lavori comuni vs complessi/commerciali

type TaskGroup = {
  label: string;
  common_residential: string[];
  complex_commercial: string[];
};

export const TASK_KNOWLEDGE_BASE: Record<
  'plumbing' | 'electric' | 'locksmith' | 'climate' | 'handyman',
  TaskGroup
> = {
  plumbing: {
    label: 'Idraulico 🔧',
    common_residential: [
      'Sostituzione rubinetto/miscelatore',
      'Disotturazione lavandino/bidet/WC (scarico lento)',
      'Riparazione cassetta scarico WC (perde o non carica)',
      'Sostituzione flessibili o sifoni',
      'Allacciamento lavatrice/lavastoviglie',
      'Piccole perdite da tubi visibili',
      'Sostituzione soffione doccia',
    ],
    complex_commercial: [
      'Spurgo colonne di scarico condominiali o industriali',
      'Riparazione pompe sommerse o autoclavi (Hotel)',
      'Installazione/Riparazione degrassatori (Ristoranti)',
      'Ricerca perdite occulte con strumentazione',
      'Rifacimento linee bagno complete',
      'Manutenzione impianti antincendio (idranti)',
    ],
  },
  electric: {
    label: 'Elettricista ⚡',
    common_residential: [
      'Sostituzione prese, interruttori o deviatori',
      'Riparazione lampadari o punti luce',
      'Riarmo salvavita che scatta (ricerca guasto semplice)',
      'Installazione ventole o aspiratori bagno',
      'Sostituzione citofono standard',
    ],
    complex_commercial: [
      'Certificazione impianti e adeguamento 37/08',
      'Guasti su quadri elettrici industriali/trifase (380V)',
      'Illuminazione di emergenza (Hotel/Locali)',
      'Automazione cancelli elettrici',
      'Cablaggi strutturati reti LAN/Dati',
      'Installazione colonnine ricarica auto',
    ],
  },
  locksmith: {
    label: 'Fabbro 🔑',
    common_residential: [
      'Apertura porta bloccata (senza mandate)',
      'Sostituzione cilindro europeo standard',
      'Riparazione maniglia porta interna',
      'Sblocco tapparella manuale',
      'Cambio serratura cassetta postale',
    ],
    complex_commercial: [
      'Apertura giudiziaria o porta blindata in sicurezza',
      'Installazione/Riparazione maniglioni antipanico (Uscite sicurezza)',
      'Motorizzazione tapparelle o serrande negozi',
      'Serrature elettroniche per controllo accessi (Hotel)',
      'Saldature su cancelli o inferriate',
      'Masterizzazione chiavi (passe-partout per Hotel)',
    ],
  },
  climate: {
    label: 'Climatizzazione ❄️',
    common_residential: [
      'Pulizia filtri e sanificazione split',
      'Ricarica gas condizionatore (se perdita trovata)',
      'Sblocco caldaia in blocco di sicurezza',
      'Controllo fumi caldaia (manutenzione ordinaria)',
      'Sostituzione termostato ambiente',
    ],
    complex_commercial: [
      'Riparazione celle frigorifere (Ristoranti/Macellerie)',
      'Manutenzione impianti VRV/VRF (Hotel)',
      'Riparazione abbattitori di temperatura',
      'Manutenzione cappe aspiranti industriali',
      'Sostituzione scambiatori o compressori',
      'Ricerca perdite gas su grandi impianti',
    ],
  },
  handyman: {
    label: 'Tuttofare 🔨',
    common_residential: [
      'Montaggio mobili in kit (IKEA, ecc.)',
      'Installazione mensole, quadri, specchi, bastoni tende',
      'Piccole stuccature o tinteggiature parziali',
      'Cambio serratura semplice porta interna',
      'Sostituzione silicone doccia/lavabo',
    ],
    complex_commercial: [
      'Manutenzione ordinaria stanze Hotel (silicone, ritocchi, maniglie)',
      'Spostamento arredi pesanti o uffici',
      'Montaggio stand o arredi per eventi',
      'Piccoli lavori di muratura o cartongesso',
      'Sgombero locali cantine/magazzini',
    ],
  },
};

/**
 * Converte la knowledge base in testo leggibile dal modello.
 */
export function getTasksKnowledgeString(): string {
  let output = 'ELENCO LAVORI E COMPLESSITÀ:\n';

  for (const [_, data] of Object.entries(TASK_KNOWLEDGE_BASE)) {
    output += `\n${data.label.toUpperCase()}:\n`;
    output += `- COMUNI (Prezzo Base): ${data.common_residential.join(', ')}\n`;
    output += `- COMPLESSI/COMMERCIALI (Prezzo Alto/Su Preventivo): ${data.complex_commercial.join(', ')}\n`;
  }

  return output;
}
