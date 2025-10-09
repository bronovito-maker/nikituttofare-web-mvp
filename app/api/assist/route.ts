import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getNocoClient } from '@/lib/noco'; // CORREZIONE: Usiamo getNocoClient

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const noco = getNocoClient(); // Otteniamo il client all'interno della funzione
  try {
    const { prompt, tenant_id } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Il prompt è obbligatorio' }, { status: 400 });
    }
    if (!tenant_id) {
      return NextResponse.json({ error: 'Tenant ID mancante' }, { status: 400 });
    }

    const viewName = 'Assistenti';
    const assistente = await noco.db.dbViewRow.findOne(viewName, {
      where: (f: any) => f.eq('tenant_id', tenant_id)
    });

    if (!assistente) {
      return NextResponse.json({ error: `Assistente con ID '${tenant_id}' non trovato.` }, { status: 404 });
    }

    const systemPromptString = `
      ${assistente.prompt_sistema}

      Informazioni aggiuntive a tua disposizione per rispondere alle domande degli utenti:
      ---
      ${assistente.info_extra}
      ---
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPromptString },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0].message.content;

    return NextResponse.json({ response: responseText });

  } catch (error: any) {
    console.error("Errore nell'API assist:", error);
    const errorMessage = error.message || "Si è verificato un errore sconosciuto.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}