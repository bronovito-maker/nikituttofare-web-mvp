// app/api/n8n-proxy/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Questo è l'indirizzo del tuo n8n locale
    const N8N_URL = 'http://localhost:5678/webhook-test/chat';

    const response = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Errore Ponte n8n:', error);
    return NextResponse.json({ text: "Errore di connessione." }, { status: 500 });
  }
}