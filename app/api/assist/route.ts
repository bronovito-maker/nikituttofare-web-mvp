// app/api/assist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { findOneByWhereREST } from '@/lib/noco'; // Usiamo la funzione REST
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message, tenant_id } = await req.json();
    const { NOCO_PROJECT_SLUG, NOCO_TABLE_ASSISTANTS } = process.env;

    if (!tenant_id) {
      return NextResponse.json({ error: 'Tenant ID mancante.' }, { status: 400 });
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

    const systemPromptString = `
      ${(assistente as any).prompt_sistema}
      ---
      ${(assistente as any).info_extra}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPromptString },
        { role: "user", content: message },
      ],
    });

    const aiResponse = completion.choices[0].message.content;
    return NextResponse.json({ response: aiResponse });

  } catch (err: any) {
    console.error("Errore nell'API assist:", err.message || err);
    return NextResponse.json(
      { error: 'Errore interno del server.', detail: err.message || String(err) },
      { status: 500 }
    );
  }
}