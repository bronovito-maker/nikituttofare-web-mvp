// app/api/assist/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { AiResult } from '@/lib/types';
import { getFallbackResponse } from "@/lib/chat-copy";

type StandardCategoryConfig = { type: 'standard'; keywords: string[]; clarification_question: string; priceRange: [number, number]; est_minutes: number; weight?: number; };
type UnitBasedCategoryConfig = { type: 'unit_based'; keywords: string[]; clarification_question: string; pricePerUnit: number; timePerUnit: number; basePrice: number; unitKeywords: string[]; weight?: number; };
type SpecialistCategoryConfig = { type: 'contact_specialist'; keywords: string[]; clarification_question: string; weight?: number; };
type CategoryConfig = StandardCategoryConfig | UnitBasedCategoryConfig | SpecialistCategoryConfig;

const CATEGORIES_CONFIG: Record<string, CategoryConfig> = {
  trasloco: { type: 'contact_specialist', keywords: ['trasloco', 'sgombero', 'svuotare cantina'], clarification_question: "Per un trasloco serve un preventivo. Indicami punto di partenza, arrivo e merce da trasportare.", weight: 20 },
  muratore: { type: 'contact_specialist', keywords: ['muratore', 'ristrutturazione', 'demolire', 'tramezzo', 'rifare bagno'], clarification_question: "Per lavori di muratura serve un preventivo. Descrivimi brevemente il lavoro.", weight: 15 },
  "fabbro-emergenza": { type: 'standard', keywords: ['fabbro', 'porta bloccata', 'chiave incastrata', 'non riesco ad entrare', 'sblocco porta'], clarification_question: "Capito, è un'emergenza. Ti trovi fuori o dentro casa?", priceRange: [120, 200], est_minutes: 60, weight: 12 },
  "fabbro-installazione": { type: 'standard', keywords: ['cambiare serratura', 'sostituire serratura', 'cilindro europeo'], clarification_question: "Perfetto. Si tratta di una porta normale o blindata?", priceRange: [100, 180], est_minutes: 75, weight: 12 },
  idraulico: { type: 'standard', keywords: ['idraulico', 'lavandino', 'rubinetto', 'perdita', 'wc', 'scarico', 'caldaia'], clarification_question: "Riguarda una perdita, uno scarico bloccato o un problema alla caldaia?", priceRange: [70, 120], est_minutes: 60 },
  elettricista: { type: 'standard', keywords: ['elettricista', 'presa', 'interruttore', 'corrente', 'luce', 'salvavita', 'blackout'], clarification_question: "Riguarda una presa, un interruttore, le luci o è saltata la corrente?", priceRange: [70, 110], est_minutes: 60 },
  tuttofare: { type: 'standard', keywords: ['tuttofare', 'montare', 'appendere', 'fissare', 'mensola', 'ikea'], clarification_question: "Hai già tutto il materiale necessario (viti, tasselli, etc.)?", priceRange: [60, 90], est_minutes: 60, weight: 5 },
  imbianchino: { type: 'unit_based', keywords: ['imbianchino', 'dipingere', 'imbiancare', 'verniciare', 'pitturare', 'pareti'], clarification_question: "Perfetto! Per darti una stima, quante stanze sarebbero da imbiancare circa?", pricePerUnit: 250, timePerUnit: 240, basePrice: 80, unitKeywords: ['stanza', 'stanze', 'camera'], weight: 10 },
  fabbro: { type: 'standard', keywords: ['serratura', 'chiave', 'portone'], clarification_question: "Certo. La porta è bloccata o vuoi cambiare la serratura per sicurezza?", priceRange: [100, 180], est_minutes: 75, weight: 1 },
};

function extractUnitCount(text: string): number {
    const s = text.toLowerCase();
    const numberWords: Record<string, number> = { 'un': 1, 'una': 1, 'due': 2, 'tre': 3, 'quattro': 4, 'cinque': 5 };
    const match = s.match(/\b(\d+|un|una|due|tre|quattro|cinque)\b/);
    if (match) {
      const token = match[1];
      const n = parseInt(token, 10);
      if (!isNaN(n)) return n;
      if (token in numberWords) return numberWords[token];
    }
    return 0;
}
  
function classifyAndPrepare(text: string): AiResult {
    const s = text.toLowerCase().trim();
    let bestCategory: string | null = null;
    let maxScore = 0;
  
    for (const cat in CATEGORIES_CONFIG) {
      const config = CATEGORIES_CONFIG[cat];
      let score = 0;
      for (const keyword of config.keywords) {
        if (s.includes(keyword)) score += (config.weight ?? 1);
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
    const urgency = (s.includes('urgente') || s.includes('subito')) ? 'alta' : 'media';
  
    if (config.type === 'contact_specialist') {
      return { category: bestCategory, urgency, summary: text, clarification_question: config.clarification_question, requires_specialist_contact: true };
    }
  
    if (config.type === 'unit_based') {
      const units = extractUnitCount(s);
      if (units > 0) {
        const priceLow = Math.ceil((config.basePrice + (config.pricePerUnit * units * 0.9)) / 10) * 10;
        const priceHigh = Math.ceil((config.basePrice + (config.pricePerUnit * units * 1.1)) / 10) * 10;
        return { category: bestCategory, urgency, summary: text, clarification_question: `Mi confermi che si tratta di circa ${units} stanz${units > 1 ? 'e' : 'a'}?`, price_low: priceLow, price_high: priceHigh, est_minutes: config.timePerUnit * units };
      }
    }
  
    const { priceRange, est_minutes, clarification_question } = config as StandardCategoryConfig;
    return { category: bestCategory, urgency, summary: text, clarification_question, price_low: priceRange[0], price_high: priceRange[1], est_minutes };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message || '').trim();
    if (!message) {
      return NextResponse.json({ ok: false, error: "Messaggio vuoto" }, { status: 400 });
    }
    const result = classifyAndPrepare(message);
    return NextResponse.json({ ok: true, data: result });
  } catch (e) {
    console.error("[API Assist Error]:", e);
    return NextResponse.json({ ok: false, error: "Errore interno del server." }, { status: 500 });
  }
}