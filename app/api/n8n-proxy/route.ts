import { NextRequest, NextResponse } from "next/server";
import { verifyChatToken } from "@/lib/chat-security";
import { z } from "zod";

// Zod Schema for validation
const chatSchema = z.object({
  message: z.string().min(1, "Messaggio vuoto").max(2000, "Messaggio troppo lungo"),
  chatId: z.string().min(1, "ChatID mancante"),
  userId: z.string().optional()
});

export async function POST(req: NextRequest) {
  // Variable to hold the URL for error logging purposes
  let webhookUrl = process.env.N8N_WEBHOOK_URL || '';

  try {
    // 1. Validate Token (HMAC check)
    // Client sends it in 'x-chat-token' header
    const token = req.headers.get("x-chat-token");

    if (!verifyChatToken(token)) {
      return NextResponse.json(
        { error: "Token di sicurezza non valido o scaduto. Ricarica la pagina." },
        { status: 401 }
      );
    }

    // 2. Read Client Payload
    const body = await req.json();

    // 3. Zod Validation
    const validation = chatSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dati non validi", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { message, chatId, userId } = validation.data;

    // 4. Prepare n8n connection
    const n8nSecret = process.env.N8N_WEBHOOK_SECRET;
    const n8nToken = process.env.N8N_SECRET_TOKEN;

    if (!webhookUrl) {
      console.error("❌ ERRORE: N8N_WEBHOOK_URL mancante nel .env");
      return NextResponse.json({ error: "Configurazione Server Mancante" }, { status: 500 });
    }

    if (!n8nToken) {
      console.warn("⚠️ WARNING: N8N_SECRET_TOKEN mancante. La chiamata a n8n potrebbe fallire se Header Auth è attivo.");
    }

    // Safety Fix: Normalize URL if protocol is missing
    if (!webhookUrl.startsWith('http')) {
      webhookUrl = `https://${webhookUrl}`;
    }

    // 5. Forward to n8n
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-n8n-secret": n8nSecret || "",
        "x-api-key": n8nToken || "",
      },
      body: JSON.stringify({
        message,
        chatId,
        userId,
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      console.error(`❌ Errore n8n: ${response.status} ${response.statusText}`);
      return NextResponse.json({ text: "Errore di comunicazione con l'assistente." }, { status: 502 });
    }

    // 6. Return response
    const data = await response.json();
    const text = data.text || data.output || data.message || "Risposta ricevuta.";

    return NextResponse.json({ text });

  } catch (error) {
    console.error(`❌ Errore chiamata n8n su URL: ${webhookUrl}`);
    console.error("❌ Errore Proxy:", error);
    return NextResponse.json({ text: "Errore interno del server." }, { status: 500 });
  }
}