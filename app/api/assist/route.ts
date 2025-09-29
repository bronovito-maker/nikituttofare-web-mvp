// File: app/api/assist/route.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { Step, ChatFormState } from '@/lib/types';
import { SERVICES, generateSystemPrompt } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const { prompt, formState, step }: { prompt: string; formState: ChatFormState; step: Step } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Il prompt è obbligatorio' }, { status: 400 });
    }

    let summary = { ...formState };
    if (step === 'service') {
        summary = { message: prompt, details: {} }; // Resetta il riepilogo per una nuova richiesta
    } else if (step === 'details') {
        const detailCount = Object.keys(summary.details || {}).length;
        summary.details = { ...summary.details, [`clarification${detailCount + 1}`]: prompt };
    }

    const { systemPrompt, nextStep } = generateSystemPrompt(step, summary, prompt);

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();
    
    if (nextStep === 'confirm') {
        // Estrae i dati solo se stiamo per fare il preventivo
        const conversationHistory = `Richiesta iniziale: ${summary.message}, Dettagli: ${JSON.stringify(summary.details)}`;
        const dataExtractionPrompt = `Basandoti sulla seguente conversazione, estrai un oggetto JSON con queste chiavi: "category" (una tra: ${SERVICES.join(', ')}), "urgency" (bassa, media, alta), "price_low" (numero), "price_high" (numero), "est_minutes" (numero), "summary_for_technician" (stringa), "tools" (array di stringhe). Conversazione: ${conversationHistory}`;
        
        const finalDataResponse = await model.generateContent(dataExtractionPrompt);
        let finalData = {};
        try {
            const text = finalDataResponse.response.text().replace(/```json|```/g, '').trim();
            finalData = JSON.parse(text);
            summary = { ...summary, ai: finalData };
        } catch (e) {
            console.error("Errore nel parsing del JSON dall'AI:", e);
        }
    }

    return NextResponse.json({ response: aiResponse, nextStep, summary });

  } catch (error) {
    console.error('Errore API Google AI:', error);
    return NextResponse.json({ error: 'Errore durante la generazione della risposta.' }, { status: 500 });
  }
}