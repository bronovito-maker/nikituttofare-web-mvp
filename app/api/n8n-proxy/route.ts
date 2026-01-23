// app/api/n8n-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const n8nProxySchema = z.object({
  message: z.string(),
  chatId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const authToken = req.headers.get('Authorization')?.split(' ')[1];
    if (authToken !== process.env.N8N_PROXY_SECRET) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // 2. Environment variable for URL
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      console.error('N8N_WEBHOOK_URL non è configurato');
      return NextResponse.json({ error: "Errore di configurazione del server" }, { status: 500 });
    }

    const body = await req.json();

    // 3. Input Validation
    const validation = n8nProxySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dati non validi', details: validation.error.flatten() }, { status: 400 });
    }

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data),
    });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Errore Ponte n8n:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ text: "Errore di connessione." }, { status: 500 });
  }
}