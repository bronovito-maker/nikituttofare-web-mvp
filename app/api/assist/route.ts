// app/api/assist/route.ts

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { OpenAI } from 'openai';
import { auth } from '@/auth'; // Importa la funzione auth
import { buildSystemPrompt } from '@/lib/prompt-builder'; // Importa il nostro nuovo builder

// Inizializza il client OpenAI (o un altro LLM)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
export async function POST(req: NextRequest) {
  try {
    // 1. Autenticazione e recupero TenantID
    const session = await auth(); // Recupera la sessione
    
    // Controlla se l'utente è loggato e ha un tenantId
    // Nota: Per un widget pubblico, potresti dover passare un 'tenant-api-key'
    // Ma per ora, assumiamo che sia usato da un utente loggato (es. /chat)
    if (!session?.user?.tenantId) {
      console.warn('API Assist: Tentativo di accesso non autorizzato o tenantId mancante.');
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }
    const tenantId = session.user.tenantId;

    // 2. Estrazione dei messaggi dal corpo della richiesta
    const { messages } = await req.json();
    if (!messages) {
      return NextResponse.json({ error: 'Messaggi mancanti' }, { status: 400 });
    }

    // 3. Costruzione del System Prompt dinamico
    const systemPrompt = await buildSystemPrompt(tenantId);
    
    // 4. Creazione del payload per OpenAI
    const payload = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages, // Aggiungi la cronologia della chat
    ];

    // 5. Chiamata a OpenAI
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
      stream: true,
      messages: payload,
    });

    // 6. Restituzione della risposta in streaming
    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error('Errore API Assist:', error);
    // Gestisci diversi tipi di errore se necessario
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json({ error: `Errore OpenAI: ${error.message}` }, { status: error.status });
    }
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
