// app/api/assist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { findOneByWhere } from '@/lib/noco'; // Importiamo la nostra nuova funzione!
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message, tenant_id } = await req.json();
    const { NOCO_PROJECT_ID, NOCO_TABLE_ASSISTANTS } = process.env;

    if (!tenant_id) {
      return NextResponse.json({ error: 'Tenant ID mancante.' }, { status: 400 });
    }
    if (!NOCO_PROJECT_ID || !NOCO_TABLE_ASSISTANTS) {
        throw new Error("Mancano le variabili d'ambiente per NocoDB (progetto/tabella assistenti)");
    }

    // Usiamo la nostra nuova funzione robusta!
    const assistente = await findOneByWhere(
      NOCO_PROJECT_ID,
      NOCO_TABLE_ASSISTANTS,
      (f: any) => f.eq('tenant_id', tenant_id)
    );

    if (!assistente) {
      // Come suggerito, gestiamo il 404 in modo pulito
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

  } catch (error: any) {
    console.error("Errore nell'API assist:", error);
    return NextResponse.json({ error: "Errore interno del server." }, { status: 500 });
  }
}