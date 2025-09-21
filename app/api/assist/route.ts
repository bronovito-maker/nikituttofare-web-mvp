// app/api/assist/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { AiResult } from "@/lib/types";
import { priceMap } from "@/lib/config"; // <-- IMPORTAZIONE CHIAVE

/**
 * Funzione per ottenere una risposta dall'API di Google AI (Gemini).
 * Analizza il messaggio dell'utente e restituisce una struttura JSON con la categoria,
 * una domanda di chiarimento e altri dettagli.
 * @param message Il messaggio dell'utente.
 * @returns Un oggetto AiResult con l'analisi della richiesta.
 */
async function getAiResponse(message: string): Promise<AiResult> {
  const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
  if (!GOOGLE_AI_API_KEY) {
    console.error("[AI_ERROR] GOOGLE_AI_API_KEY non è configurata.");
    throw new Error("Configurazione AI mancante sul server.");
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GOOGLE_AI_API_KEY}`;

  const prompt = `
    Analizza la richiesta di un utente per un servizio di assistenza domestica a Livorno.
    La tua risposta deve essere ESCLUSIVAMENTE un oggetto JSON valido. Non aggiungere mai testo, commenti o markdown (come \`\`\`json) prima o dopo il JSON.

    Richiesta utente: "${message}"

    ISTRUZIONI:
    1.  Prima di tutto, valuta se il messaggio è un insulto, una volgarità o palesemente non pertinente. Se lo è, imposta la categoria su "off_topic" e salta gli altri passaggi.
    2.  Se pertinente, determina la categoria del servizio tra: "idraulico", "elettricista", "fabbro", "muratore", "serramenti", "clima", "trasloco", "tuttofare", o "none" se non è chiaro.
    3.  Identifica il tipo di richiesta: "problem" (qualcosa di rotto) o "task" (un lavoro da fare).
    4.  Formula una "acknowledgement": una breve frase di conferma per l'utente.
    5.  **ISTRUZIONE SPECIALE**: Controlla se la richiesta contiene parole chiave ad alta complessità come "pianoforte", "cassaforte", "opera d'arte", "oggetto antico".
        - Se trovi una di queste parole, formula una "clarification_question" SPECIFICA per quel contesto. Esempi:
          - Per "pianoforte": "Capisco, un lavoro delicato. Per preparare un preventivo corretto, mi serve sapere: si trova a un piano terra o ci sono scale da fare?"
          - Per "cassaforte": "Certamente. Per assisterti al meglio, mi puoi dire se si tratta di un'apertura, uno spostamento o un'installazione?"
        - Se NON trovi parole chiave speciali, formula una "clarification_question" generica ma PERTINENTE al servizio richiesto.

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI_ERROR] Errore dall'API di Google (${response.status}): ${errorText}`);
      throw new Error(`Errore di comunicazione con il servizio AI: ${response.statusText}`);
    }

    const data = await response.json();
    const jsonText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
    const parsedJson = JSON.parse(jsonText) as AiResult;

    // Aggiunge i dati di prezzo e tempo dalla configurazione centralizzata
    if (parsedJson.category && priceMap[parsedJson.category]) {
      parsedJson.price_low = priceMap[parsedJson.category].priceRange[0];
      parsedJson.price_high = priceMap[parsedJson.category].priceRange[1];
      parsedJson.est_minutes = priceMap[parsedJson.category].est_minutes;
    }
    return parsedJson;

  } catch (error: any) {
    console.error("[AI_ERROR] Errore critico durante la chiamata AI:", error);
    // Risposta di fallback in caso di fallimento
    return {
      category: "none",
      request_type: "problem",
      acknowledgement: "Mi dispiace, al momento non riesco a elaborare la tua richiesta.",
      clarification_question: "Potresti per favore riformulare il tuo problema? Sarò pronto ad aiutarti tra poco.",
    };
  }
}

/**
 * API Route per l'analisi della richiesta dell'utente.
 * Riceve un messaggio, lo invia al servizio AI e restituisce l'analisi.
 */
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