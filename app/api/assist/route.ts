// app/api/assist/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { AiResult } from '@/lib/types';
import { getFallbackResponse } from "@/lib/chat-copy";

/* ─────────────────────────────────────────────────────────
   Costanti globali (evita TDZ e duplicazioni)
────────────────────────────────────────────────────────── */
const GREETINGS = [
  'ciao','salve','buongiorno','buonasera','ehi','yo','ue','ueilà','buondì',
  'buona sera','buona giornata','buona serata','saluti','salve a tutti'
];

/* ─────────────────────────────────────────────────────────
   Tipi categoria
────────────────────────────────────────────────────────── */
type StandardCategoryConfig = {
  type: 'standard';
  keywords: string[];
  clarification_question: string;
  priceRange: [number, number];
  est_minutes: number;
  weight?: number;
};
type UnitBasedCategoryConfig = {
  type: 'unit_based';
  keywords: string[];
  clarification_question: string;
  pricePerUnit: number;
  timePerUnit: number;
  basePrice: number;
  unitKeywords: string[];
  weight?: number;
};
type SpecialistCategoryConfig = {
  type: 'contact_specialist';
  keywords: string[];
  clarification_question: string;
  weight?: number;
};
type CategoryConfig = StandardCategoryConfig | UnitBasedCategoryConfig | SpecialistCategoryConfig;

/* ─────────────────────────────────────────────────────────
   Dizionario categorie
────────────────────────────────────────────────────────── */
const CATEGORIES_CONFIG: Record<string, CategoryConfig> = {
  trasloco: {
    type: 'contact_specialist',
    keywords: ['trasloco','spostare','sgombero','svuotare','cantina','garage','trasporto','portare via mobili'],
    clarification_question: "Per un trasloco o sgombero serve un preventivo dettagliato. Per iniziare, potresti indicarmi il punto di partenza, quello di arrivo e la quantità di merce da trasportare? (es. 'da Livorno centro a Pisa, una cucina e una camera da letto').",
    weight: 20
  },
  muratore: {
    type: 'contact_specialist',
    keywords: ['ristrutturazione','demolire','costruire','tramezzo','massetto','rifare bagno','rifare cucina','pavimento','impermeabilizzazione'],
    clarification_question: "Per lavori di muratura importanti facciamo sempre un preventivo su misura. Puoi descrivermi brevemente il lavoro che hai in mente?",
    weight: 15
  },

  "trattamento-muffa": {
    type: 'standard',
    keywords: ['muffa','macchia umidità','alone','condensa','angolo nero','antimuffa'],
    clarification_question: "Riguarda un piccolo angolo, una parete intera o più punti della casa?",
    priceRange: [80, 140], est_minutes: 90, weight: 10
  },
  "piccoli-lavori-murari": {
    type: 'standard',
    keywords: ['crepa','buco nel muro','stuccare','riparare muro','intonaco','piastrella rotta','battiscopa'],
    clarification_question: "Capito, un piccolo lavoro di muratura. Si tratta di una crepa, un buco da stuccare o una piastrella da sostituire?",
    priceRange: [70, 120], est_minutes: 75, weight: 10
  },
  idraulico: {
    type: 'standard',
    keywords: ['lavandino','rubinetto','miscelatore','sifone','wc','water','sciacquone','scarico','perdita','gocciola','allagato','infiltrazione','acqua','caldaia','scaldabagno','boiler','tubo','tubatura','flessibile','doccia','bidet','sanitari','disotturazione','sturare','ingorgo','termosifone','calorifero','radiatore','valvola'],
    clarification_question: "Riguarda una perdita, uno scarico bloccato o un problema alla caldaia?",
    priceRange: [70, 120], est_minutes: 60
  },
  elettricista: {
    type: 'standard',
    keywords: ['presa','interruttore','corrente','luce','cavi','quadro elettrico','salvavita','cortocircuito','scintille','lampadario','contatore','scossa','blackout','citofono','videocitofono','cavo antenna','impianto elettrico','messa a terra','frutto','placca','faretti','illuminazione','lampadina','lampada','luci','elettricità'],
    clarification_question: "Riguarda una presa, un interruttore, le luci o è saltata la corrente in generale?",
    priceRange: [70, 110], est_minutes: 60
  },
  fabbro: {
    type: 'standard',
    keywords: ['porta','portone','porta blindata','serratura','chiave','bloccata','incastrata','sblocco','apriporta','cancello','cilindro europeo','difesa','cambiare serratura','copia chiave','fabbro'],
    clarification_question: "La porta è bloccata e non riesci ad entrare, oppure vuoi cambiare la serratura per sicurezza?",
    priceRange: [100, 180], est_minutes: 75
  },
  serramentista: {
    type: 'standard',
    keywords: ['finestra','infisso','tapparella','persiana','zanzariera','vetro','maniglia','avvolgibile','cinghia','corda','motorizzazione','basculante','garage'],
    clarification_question: "Il problema riguarda una tapparella bloccata o una finestra che non si chiude bene?",
    priceRange: [80, 150], est_minutes: 90
  },
  climatizzazione: {
    type: 'standard',
    keywords: ['condizionatore','climatizzatore','clima','aria condizionata','pompa di calore','split','non raffredda','non scalda','perde acqua','ricarica gas','filtri','fan coil','motore esterno'],
    clarification_question: "Non fa più aria fredda/calda, perde acqua dall'unità interna o ha bisogno di manutenzione?",
    priceRange: [90, 160], est_minutes: 90
  },
  giardinaggio: {
    type: 'standard',
    keywords: ['giardino','siepe','tagliare','potare','rasare','prato','erba','decespugliatore','irrigazione','piante','albero','cespuglio','fiori','orto','zappa','tosaerba'],
    clarification_question: "Hai bisogno di tagliare la siepe, rasare il prato o un altro tipo di manutenzione?",
    priceRange: [70, 130], est_minutes: 120
  },
  tuttofare: {
    type: 'standard',
    keywords: ['montare','smontare','appendere','fissare','sistemare','piccoli lavori','mensola','quadro','specchio','bastone tenda','tende','mobile','scaffale','silicone','montaggio tv','montaggio mobili','ikea','leroy merlin','brico','bricoman'],
    clarification_question: "Hai già tutto il materiale necessario (viti, tasselli, etc.) o dobbiamo pensare a tutto noi?",
    priceRange: [60, 90], est_minutes: 60, weight: 5
  },
  imbianchino: {
    type: 'unit_based',
    keywords: ['tingere','tinteggiare','dipingere','imbiancare','verniciare','pitturare','rasatura','pareti','soffitto','intonaco','smalto','idropittura','lavabile','trattamento antimuffa'],
    clarification_question: "Quante stanze sarebbero da imbiancare circa?",
    pricePerUnit: 250, timePerUnit: 240, basePrice: 80,
    unitKeywords: ['stanza','stanze','camera','camere','locale','locali','cucina','salotto','soggiorno','bagno'],
    weight: 2
  }
};

/* ─────────────────────────────────────────────────────────
   Utils
────────────────────────────────────────────────────────── */
function extractUnitCount(text: string): number {
  const s = text.toLowerCase();

  const numberWords: Record<string, number> = {
    'un': 1, 'uno': 1, 'una': 1, 'due': 2, 'tre': 3, 'quattro': 4, 'cinque': 5,
    'sei': 6, 'sette': 7, 'otto': 8, 'nove': 9, 'dieci': 10
  };

  const match = s.match(/\b(\d+|un|uno|una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\b/);
  if (match) {
    const token = match[1];
    const n = parseInt(token, 10);
    if (!isNaN(n)) return n;
    if (token in numberWords) return numberWords[token];
  }

  if (/\b(stanza|stanze|camera|camere|locale|locali)\b/.test(s)) return 1;

  return 0;
}

function classifyAndPrepare(text: string): AiResult {
  const s = text.toLowerCase().trim();

  if (GREETINGS.includes(s)) {
    return {
      category: 'none',
      summary: 'Ciao! Sono Niki, il tuo assistente virtuale. Descrivi il problema che hai in casa e ti aiuterò a trovare una soluzione e una stima dei costi.'
    };
  }

  let bestCategory: string | null = null;
  let maxScore = 0;

  for (const cat in CATEGORIES_CONFIG) {
    const config = CATEGORIES_CONFIG[cat];
    let score = 0;
    for (const keyword of config.keywords) {
      if (s.includes(keyword)) score += config.weight ?? 1;
    }
    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat;
    }
  }

  if (!bestCategory || maxScore === 0) {
    return { category: 'none', summary: getFallbackResponse() };
  }

  const config = CATEGORIES_CONFIG[bestCategory];
  const urgency = (s.includes('urgente') || s.includes('subito') || s.includes('allagato') || s.includes('scossa'))
    ? 'alta'
    : 'media';

  if (config.type === 'contact_specialist') {
    return {
      category: bestCategory,
      urgency,
      summary: text,
      clarification_question: config.clarification_question,
      requires_specialist_contact: true
    };
  }

  if (config.type === 'unit_based') {
    const units = extractUnitCount(s);
    if (units > 0) {
      const priceLow = Math.ceil((config.basePrice + (config.pricePerUnit * units * 0.9)) / 10) * 10;
      const priceHigh = Math.ceil((config.basePrice + (config.pricePerUnit * units * 1.1)) / 10) * 10;
      return {
        category: bestCategory,
        urgency,
        summary: text,
        clarification_question: `Mi confermi che si tratta di circa ${units} stanz${units > 1 ? 'e' : 'a'}?`,
        price_low: priceLow,
        price_high: priceHigh,
        est_minutes: config.timePerUnit * units
      };
    }
    return {
      category: bestCategory,
      urgency,
      summary: text,
      clarification_question: config.clarification_question
    };
  }

  const [price_low, price_high] = (config as StandardCategoryConfig).priceRange;
  return {
    category: bestCategory,
    urgency,
    summary: text,
    clarification_question: config.clarification_question,
    price_low,
    price_high,
    est_minutes: (config as StandardCategoryConfig).est_minutes
  };
}

/* ─────────────────────────────────────────────────────────
   Route: POST
────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message || '').trim();

    if (message.length < 4 && !GREETINGS.includes(message.toLowerCase())) {
      return NextResponse.json({
        ok: true,
        data: { category: 'none', summary: 'Per poterti aiutare, per favore descrivi un po\' meglio il problema.' }
      });
    }

    const result = classifyAndPrepare(message);
    return NextResponse.json({ ok: true, data: result });

  } catch (e) {
    console.error("[API Assist Error]:", e);
    return NextResponse.json(
      { ok: false, error: "Errore interno del server durante l'analisi della richiesta." },
      { status: 500 }
    );
  }
}