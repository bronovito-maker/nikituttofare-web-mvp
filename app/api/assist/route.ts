// File: app/api/assist/route.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Rimuoviamo l'inizializzazione da qui

export async function POST(req: NextRequest) {
  try {
    // Inizializza il client QUI, al momento della richiesta
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Il prompt è obbligatorio' }, { status: 400 });
    }

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Errore API Google AI:', error);
    return NextResponse.json({ error: 'Errore durante la generazione della risposta.' }, { status: 500 });
  }
}