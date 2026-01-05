import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Inizializza Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    // Usa il modello Flash (veloce ed economico)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Costruiamo il prompt per la Generative UI
    const prompt = `
      Sei NikiTuttoFare, un assistente esperto per la manutenzione domestica.
      Il tuo compito NON è chattare, ma capire il problema e restituire un JSON strutturato.
      
      Categorie disponibili:
      - plumbing (idraulico: perdite, tubi, scarichi)
      - electric (elettrico: prese, luci, salvavita)
      - locksmith (fabbro: porte, chiavi, serrature)
      - climate (clima: condizionatori, caldaie)
      - generic (altro)

      Analizza questo messaggio utente: "${message}"

      Rispondi ESCLUSIVAMENTE con questo formato JSON (senza markdown):
      {
        "type": "form", 
        "formType": "plumbing" | "electric" | "locksmith" | "climate" | "generic",
        "reason": "breve spiegazione del perché hai scelto questa categoria"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Pulizia del JSON (Gemini a volte aggiunge ```json ... ```)
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return NextResponse.json(JSON.parse(cleanJson));

  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback sicuro se l'AI fallisce
    return NextResponse.json({ 
      type: "form", 
      formType: "generic", 
      reason: "Fallback per errore AI" 
    });
  }
}
