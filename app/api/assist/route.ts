// app/api/assist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { findOneByWhereREST } from '@/lib/noco';
import { buildSystemPrompt } from '@/lib/prompt-builder';
import { LeadSnapshot } from '@/lib/chat-parser';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { prompt, tenant_id, lead_snapshot } = await req.json();
    const { NOCO_PROJECT_SLUG, NOCO_TABLE_ASSISTANTS } = process.env;

    if (!tenant_id) {
      return NextResponse.json({ error: 'Tenant ID mancante.' }, { status: 400 });
    }
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Messaggio utente mancante.' }, { status: 400 });
    }
    if (!NOCO_PROJECT_SLUG || !NOCO_TABLE_ASSISTANTS) {
      console.error('Mancano variabili d\'ambiente per NocoDB (progetto/tabella assistenti)');
      return NextResponse.json({ error: 'Configurazione del server incompleta.' }, { status: 500 });
    }

    // --- CORREZIONE CHIAVE ---
    // Costruiamo la clausola 'where' come stringa
    const whereClause = `(tenant_id,eq,${tenant_id})`;

    const assistente = await findOneByWhereREST(
      NOCO_PROJECT_SLUG,
      NOCO_TABLE_ASSISTANTS,
      whereClause // Passiamo la stringa corretta
    );

    if (!assistente) {
      return NextResponse.json({ error: `Assistente con ID '${tenant_id}' non trovato.` }, { status: 404 });
    }

    const systemPromptString = buildSystemPrompt({
      assistant: assistente as Record<string, any>,
      leadSnapshot: lead_snapshot as LeadSnapshot | undefined,
    });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: "system", content: systemPromptString },
        { role: "user", content: prompt },
      ],
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        (async () => {
          try {
            for await (const part of completion) {
              const token = part.choices[0]?.delta?.content;
              if (token) {
                controller.enqueue(encoder.encode(token));
              }
            }
          } catch (streamError) {
            console.error('Errore durante lo streaming OpenAI:', streamError);
            controller.error(streamError);
          } finally {
            controller.close();
          }
        })();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });

  } catch (err: any) {
    console.error("Errore nell'API assist:", err.message || err);
    return NextResponse.json(
      { error: 'Errore interno del server.', detail: err.message || String(err) },
      { status: 500 }
    );
  }
}
