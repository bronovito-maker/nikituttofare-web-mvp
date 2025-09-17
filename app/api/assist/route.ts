import { NextRequest, NextResponse } from "next/server";
import type { AiResult } from "@/lib/types";

const priceMap: Record<string, { priceRange: [number, number]; est_minutes: number }> = {
  idraulico: { priceRange: [70, 120], est_minutes: 60 },
  elettricista: { priceRange: [70, 110], est_minutes: 60 },
  "fabbro-emergenza": { priceRange: [120, 200], est_minutes: 60 },
};

async function getAiResponse(message: string): Promise<AiResult> {
  const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
  if (!GOOGLE_AI_API_KEY) throw new Error("Configurazione AI mancante.");

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const prompt = `
    Analizza la richiesta dell'utente per un servizio di assistenza domestica e rispondi SOLO con un oggetto JSON.
    Richiesta: "${message}"
    La struttura JSON deve essere:
    {
      "category": "una tra [idraulico, elettricista, fabbro-emergenza, none]",
      "acknowledgement": "una breve frase empatica di conferma.",
      "clarification_question": "una singola domanda per ottenere un dettaglio cruciale."
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
      acknowledgement: "Ops, non ho capito bene.",
      clarification_question: "Puoi descrivere il problema in modo diverso?",
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