// app/api/assist/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { AiResult } from "@/lib/types";

const priceMap: Record<string, { priceRange: [number, number]; est_minutes: number }> = {
  idraulico: { priceRange: [70, 120], est_minutes: 60 },
  elettricista: { priceRange: [70, 110], est_minutes: 60 },
  fabbro: { priceRange: [90, 180], est_minutes: 60 },
  muratore: { priceRange: [70, 130], est_minutes: 60 },
  serramenti: { priceRange: [80, 150], est_minutes: 60 },
  clima: { priceRange: [80, 140], est_minutes: 75 },
  trasloco: { priceRange: [150, 400], est_minutes: 120 },
  tuttofare: { priceRange: [60, 100], est_minutes: 60 },
};

async function getAiResponse(message: string): Promise<AiResult> {
  const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
  if (!GOOGLE_AI_API_KEY) throw new Error("Configurazione AI mancante.");

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const prompt = `
    Analizza la richiesta di un utente per un servizio di assistenza domestica a Livorno.
    La tua risposta deve essere ESCLUSIVAMENTE un oggetto JSON. Non aggiungere mai testo prima o dopo il JSON.

    Richiesta utente: "${message}"

    ISTRUZIONI:
    1.  Prima di tutto, valuta se il messaggio è un insulto, una volgarità o palesemente non pertinente. Se lo è, imposta la categoria su "off_topic" e salta gli altri passaggi.
    2.  Se pertinente, determina la categoria del servizio tra: "idraulico", "elettricista", "fabbro", "muratore", "serramenti", "clima", "trasloco", "tuttofare", o "none" se non è chiaro.
    3.  Identifica il tipo di richiesta: "problem" (qualcosa di rotto) o "task" (un lavoro da fare).
    4.  Formula una "acknowledgement": una breve frase di conferma.
    5.  Formula una "clarification_question": una singola domanda CHIARA e PERTINENTE.

    La struttura JSON di output deve essere:
    {
      "category": "...",
      "request_type": "problem | task",
      "acknowledgement": "...",
      "clarification_question": "..."
    }`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!response.ok) throw new Error(`Errore API: ${response.statusText}`);
    
    const data = await response.json();
    const jsonText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
    const parsedJson = JSON.parse(jsonText) as AiResult;
    
    if (parsedJson.category && priceMap[parsedJson.category]) {
      parsedJson.price_low = priceMap[parsedJson.category].priceRange[0];
      parsedJson.price_high = priceMap[parsedJson.category].priceRange[1];
      parsedJson.est_minutes = priceMap[parsedJson.category].est_minutes;
    }
    return parsedJson;

  } catch (error: any) {
    console.error("Errore chiamata AI:", error);
    return {
      category: "none",
      request_type: "problem",
      acknowledgement: "Mi dispiace, non ho capito la tua richiesta.",
      clarification_question: "Potresti per favore riformulare la tua richiesta specificando il tipo di assistenza di cui hai bisogno?",
    };
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const message = (body?.message ?? "").toString().trim();
    if (!message) return NextResponse.json({ ok: false, error: "Messaggio vuoto" }, { status: 400 });
    
    const result = await getAiResponse(message);
    return NextResponse.json({ ok: true, data: result });
  } catch (e: any) {
    console.error("[API Assist Error]:", e);
    return NextResponse.json({ ok: false, error: "Errore interno del server." }, { status: 500 });
  }
}