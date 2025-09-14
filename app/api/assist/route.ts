import { NextRequest, NextResponse } from "next/server";
import { AiResult } from '@/lib/types';

// --- DIZIONARIO DELLE CONOSCENZE DELL'ASSISTENTE ---
// Ogni categoria ora ha una "domanda di chiarimento" per le richieste generiche.
const CATEGORIES_CONFIG = {
  imbianchino: {
    keywords: ['tinteggiare', 'tingere', 'imbiancare', 'verniciare', 'pitturare', 'rasatura', 'stucco', 'pareti', 'soffitto', 'muro'],
    clarification_question: "Certo! Per farti un preventivo preciso, potresti dirmi quante stanze sono da tinteggiare?",
    pricePerUnit: 180, timePerUnit: 120, basePrice: 50,
    unitKeywords: ['stanza', 'stanze', 'camera', 'camere', 'locale', 'locali', 'cucina', 'salotto', 'soggiorno', 'bagno']
  },
  idraulico: { 
    keywords: ['lavandino', 'rubinetto', 'sifone', 'wc', 'scarico', 'perdita', 'acqua', 'caldaia', 'scaldabagno', 'boiler', 'tubo', 'doccia'],
    clarification_question: "Ok, ti aiuto volentieri. Il problema riguarda una perdita, uno scarico bloccato o altro?",
    priceRange: [70, 90] 
  },
  elettricista: { 
    keywords: ['presa', 'interruttore', 'corrente', 'luce', 'cavi', 'quadro', 'salvavita', 'cortocircuito', 'scintille'],
    clarification_question: "Capito. Per darti una mano, puoi dirmi se il problema è su una presa, un interruttore o riguarda le luci?",
    priceRange: [70, 90]
  },
  fabbro: { 
      keywords: ['porta', 'serratura', 'chiave', 'bloccata', 'sblocco', 'cancello'], 
      priceRange: [100, 150] 
  },
  // Aggiungiamo domande anche alle altre categorie per coerenza
  serramenti: { 
      keywords: ['finestra', 'infisso', 'tapparella', 'persiana', 'zanzariera', 'vetro'], 
      clarification_question: "Certo. Il problema è su una finestra, una tapparella o una porta finestra?",
      priceRange: [80, 120] 
  },
  tuttofare: { 
      keywords: ['montare', 'appendere', 'fissare', 'sistemare', 'piccoli lavori', 'mensola', 'quadro', 'lampadario'], 
      priceRange: [60, 80] 
  }
};

// --- FUNZIONI DI ANALISI DEL TESTO ---

function extractUnitCount(text: string, unitKeywords: string[]): number {
  const words = text.toLowerCase().split(/[\s,.;-]+/);
  let count = 0;
  const numberWords: { [key: string]: number } = { 'una': 1, 'un': 1, 'due': 2, 'tre': 3, 'quattro': 4, 'cinque': 5 };
  
  words.forEach((word, i) => {
    if (unitKeywords.includes(word)) {
      const prevWord = words[i - 1];
      if (!isNaN(parseInt(prevWord))) {
        count += parseInt(prevWord);
      } else if (numberWords[prevWord]) {
        count += numberWords[prevWord];
      }
    }
  });

  const mentionedUnits = new Set(words.filter(w => unitKeywords.includes(w)));
  if (count === 0 && mentionedUnits.size > 0) {
      count = mentionedUnits.size;
  }

  return count;
}

// --- LOGICA DI CLASSIFICAZIONE POTENZIATA ---
function classify(text: string): AiResult | { category: 'none', summary: string } {
  const s = text.toLowerCase();
  let bestCategory = 'tuttofare';
  let maxScore = 0;

  // 1. Calcolo del punteggio
  for (const [category, config] of Object.entries(CATEGORIES_CONFIG)) {
    let score = 0;
    for (const keyword of config.keywords) {
      if (s.includes(keyword)) {
        score += (category === 'imbianchino' ? 10 : 1);
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  const config = (CATEGORIES_CONFIG as any)[bestCategory];

  // --- SOLUZIONE: Logica di chiarimento per richieste generiche ---
  if (bestCategory === 'imbianchino') {
    const units = extractUnitCount(s, config.unitKeywords);
    // Se la richiesta è generica (es. "tingere casa") e non troviamo stanze, facciamo una domanda.
    if (units === 0) {
      return { category: 'none', summary: config.clarification_question };
    }
    // Se troviamo stanze, procediamo con la stima
    const price_low = Math.ceil((config.basePrice + (config.pricePerUnit * units * 0.9)) / 5) * 5;
    const price_high = Math.ceil((config.basePrice + (config.pricePerUnit * units * 1.1)) / 5) * 5;
    const est_minutes = config.timePerUnit * units;
    
    return {
        category: bestCategory,
        urgency: 'media',
        summary: text,
        price_low,
        price_high,
        est_minutes
    };
  }
  
  // Logica di chiarimento per altre categorie se la richiesta è troppo breve/generica
  if (s.length < 20 && config.clarification_question && maxScore > 0) {
      const genericWords = ['problema', 'guasto', 'rotto', 'aiuto', 'quanto costa'];
      if(genericWords.some(w => s.includes(w))) {
          return { category: 'none', summary: config.clarification_question };
      }
  }


  // Se la richiesta è sufficientemente dettagliata, fornisce una stima standard
  const [price_low, price_high] = config.priceRange;
  return {
    category: bestCategory,
    urgency: s.includes('urgente') || s.includes('subito') ? 'alta' : 'media',
    summary: text,
    price_low,
    price_high,
    est_minutes: 60
  };
}

// --- GESTIONE ROUTE API ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message || '');

    if (message.trim().length < 4) {
      return NextResponse.json({
        ok: true,
        data: { category: 'none', summary: 'Per darti una stima precisa, descrivi meglio il problema. Esempio: "perdita sotto il lavandino in cucina"' }
      });
    }

    const result = classify(message);
    return NextResponse.json({ ok: true, data: result });

  } catch (e: any) {
    console.error("API Assist Error:", e);
    return NextResponse.json(
      { ok: false, error: "Errore interno del server durante l'analisi." },
      { status: 500 }
    );
  }
}

