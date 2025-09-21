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

  // --- PROMPT AGGIORNATO ---
  const prompt = `
    Analizza la richiesta di un utente per un servizio di assistenza domestica a Livorno.
    La tua risposta deve essere ESCLUSIVAMENTE un oggetto JSON valido.

    Richiesta utente: "${message}"

    ISTRUZIONI:
    1.  **Analisi Iniziale**: Se la richiesta è un insulto o palesemente off-topic, imposta \`"category": "off_topic"\` e ignora il resto.
    
    2.  **Categorizzazione**: Assegna la categoria più appropriata tra "idraulico", "elettricista", "fabbro", "serramenti", "tuttofare", ecc. Usa "serramenti" per tapparelle e finestre.
    
    3.  **Urgenza**: Valuta l'urgenza come "bassa", "media" o "alta".
    
    4.  **Tipo Richiesta**: Classifica come "problem" (qualcosa di rotto) o "task" (un lavoro da fare).
    
    5.  **Conferma per l'Utente (\`acknowledgement\`)**: Scrivi una breve frase che confermi di aver capito il problema. Esempio: "Capisco, la sua tapparella è bloccata."
    
    6.  **Domanda di Chiarimento (\`clarification_question\`)**: Formula una domanda pertinente per ottenere dettagli essenziali.
    
    7.  **Riassunto per il Tecnico (\`summary_for_technician\`)**: Crea un riassunto conciso e professionale basato su TUTTE le informazioni raccolte.

    8.  **--- NUOVO --- Istruzioni per il Tecnico (\`technical_instructions\`)**: Crea una lista di 2-3 passaggi chiave che il tecnico dovrebbe seguire. Esempio per una tapparella bloccata: ["Ispezionare il cassonetto per verificare lo stato del rullo e della cinghia.", "Controllare se ci sono lamelle danneggiate o fuori guida.", "Sbloccare o sostituire le parti danneggiate come necessario."]

    9.  **--- NUOVO --- Attrezzi Suggeriti (\`tools\`)**: Elenca una breve lista di attrezzi pertinenti. Esempio: ["Scala", "Avvitatore", "Pinze", "Cacciaviti"]

    La struttura JSON di output deve essere:
    {
      "category": "...",
      "request_type": "problem | task",
      "urgency": "bassa | media | alta",
      "acknowledgement": "...",
      "clarification_question": "...",
      "summary_for_technician": "...",
      "technical_instructions": ["...", "..."],
      "tools": ["...", "..."]
    }`;
  // --- FINE PROMPT ---

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Errore API: ${errorText}`);
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
    console.error("[AI_ERROR]", error);
    return {
      category: "none", request_type: "problem", urgency: 'bassa',
      acknowledgement: "Mi dispiace, non riesco a elaborare la richiesta.",
      clarification_question: "Potresti riformulare il problema?",
      summary_for_technician: "Analisi AI fallita."
    };
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const result = await getAiResponse(body?.message ?? "");
    return NextResponse.json({ ok: true, data: result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "Errore interno." }, { status: 500 });
  }
}