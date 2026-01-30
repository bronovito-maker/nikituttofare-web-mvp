import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Leggi il messaggio dal client
    const body = await req.json();
    const { message, chatId } = body;

    // 2. Prepara l'URL e la Password
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    // Usa la password semplice che hai messo su n8n
    const n8nSecret = process.env.N8N_WEBHOOK_SECRET;

    if (!n8nUrl) {
      console.error("❌ ERRORE: N8N_WEBHOOK_URL mancante nel .env");
      return NextResponse.json({ error: "Configurazione Server Mancante" }, { status: 500 });
    }

    // 3. Invia la richiesta a n8n (Metodo Standard Header Auth)
    const response = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Qui inviamo la password nell'header che n8n si aspetta per "Header Auth"
        "x-n8n-secret": n8nSecret || "",
      },
      body: JSON.stringify({
        message,
        chatId,
        // Aggiungiamo un timestamp per debug, male non fa
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      console.error(`❌ Errore n8n: ${response.status} ${response.statusText}`);
      return NextResponse.json({ text: "Errore di comunicazione con l'assistente." }, { status: 502 });
    }

    // 4. Restituisci la risposta al frontend
    const data = await response.json();
    // Gestisce vari formati di risposta di n8n
    const text = data.text || data.output || data.message || "Risposta ricevuta.";

    return NextResponse.json({ text });

  } catch (error) {
    console.error("❌ Errore Proxy:", error);
    return NextResponse.json({ text: "Errore interno del server." }, { status: 500 });
  }
}