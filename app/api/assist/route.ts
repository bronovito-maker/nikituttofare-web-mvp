// app/api/assist/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { AiResult } from "@/lib/types";
import { priceMap } from "@/lib/config";

async function getAiResponse(message: string): Promise<AiResult> {
  const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
  if (!GOOGLE_AI_API_KEY) {
    console.error("[AI_ERROR] GOOGLE_AI_API_KEY non è configurata.");
    throw new Error("Configurazione AI mancante sul server.");
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GOOGLE_AI_API_KEY}`;

  const prompt = `
    Analizza la richiesta di un utente per un servizio di assistenza domestica a Livorno.
    La tua risposta deve essere ESCLUSIVAMENTE un oggetto JSON valido.

    Richiesta utente: "${message}"

    ISTRUZIONI:
    1.  **Analisi Iniziale**: Se la richiesta è un insulto o palesemente off-topic, imposta \`"category": "off_topic"\` e ignora il resto.
    
    2.  **Categorizzazione**: Assegna la categoria più appropriata tra "idraulico", "elettricista", "fabbro", "serramenti", "tuttofare", ecc. Usa "serramenti" per tapparelle e finestre.
    
    3.  **Urgenza**: Valuta l'urgenza come "bassa", "media" o "alta" basandoti su parole come "urgente", "subito", "peggiorando", "appena possibile" (alta), o richieste pianificabili (bassa).
    
    4.  **Tipo Richiesta**: Classifica come "problem" (qualcosa di rotto) o "task" (un lavoro da fare).
    
    5.  **Conferma per l'Utente (\`acknowledgement\`)**: Scrivi una breve frase che confermi di aver capito il problema iniziale. Esempio: "Capisco, la tapparella si è bloccata."
    
    6.  **Domanda di Chiarimento (\`clarification_question\`)**: Formula una domanda pertinente per ottenere dettagli essenziali. Per una tapparella, chiedi se è manuale o motorizzata e che tipo di problema presenta.
    
    7.  **Riassunto per il Tecnico (\`summary_for_technician\`)**: Crea un riassunto conciso e professionale basato su TUTTE le informazioni raccolte (richiesta iniziale + dettagli). Questo riassunto deve essere chiaro e diretto per il tecnico. Esempio: "Cliente segnala una tapparella motorizzata bloccata. Non risponde più né al comando vocale Alexa né al pulsante a muro."

    La struttura JSON di output deve essere:
    {
      "category": "...",
      "request_type": "problem | task",
      "urgency": "bassa | media | alta",
      "acknowledgement": "...",
      "clarification_question": "...",
      "summary_for_technician": "..." 
    }`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI_ERROR] Errore dall'API di Google (${response.status}): ${errorText}`);
      throw new Error(`Errore di comunicazione con il servizio AI: ${response.statusText}`);
    }

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
    console.error("[AI_ERROR] Errore critico durante la chiamata AI:", error);
    return {
      category: "none",
      request_type: "problem",
      urgency: 'bassa',
      acknowledgement: "Mi dispiace, al momento non riesco a elaborare la tua richiesta.",
      clarification_question: "Potresti per favore riformulare il tuo problema?",
      summary_for_technician: "Analisi AI fallita."
    };
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const message = (body?.message ?? "").toString().trim();

    if (!message) {
      return NextResponse.json({ ok: false, error: "Il messaggio non può essere vuoto." }, { status: 400 });
    }

    const result = await getAiResponse(message);
    return NextResponse.json({ ok: true, data: result });

  } catch (e: any) {
    console.error("[API_ASSIST_ERROR] Errore:", e);
    return NextResponse.json({ ok: false, error: "Errore interno del server durante l'analisi della richiesta." }, { status: 500 });
  }
}