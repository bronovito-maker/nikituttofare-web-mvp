// File: app/api/assist/route.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { Step, ChatFormState } from '@/lib/types';

async function callGenerativeAI(systemPrompt: string, userPrompt: string) {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt,
    });
    const result = await model.generateContent(userPrompt);
    return result.response.text();
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, formState, step }: { prompt: string; formState: ChatFormState; step: Step } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Il prompt è obbligatorio' }, { status: 400 });
    }

    let systemPrompt = '';
    let nextStep: Step = step;
    let summary = { ...formState };

    // Logica per aggiornare il riepilogo
    if (step === 'service') {
        summary.message = prompt;
    } else if (step === 'details') {
        const detailCount = Object.keys(summary.details || {}).length;
        summary.details = { ...summary.details, [`clarification${detailCount + 1}`]: prompt };
    }

    const detailCount = Object.keys(summary.details || {}).length;

    switch (step) {
      case 'intro':
      case 'service':
        systemPrompt = `
            ROLE: Concierge Tecnico NikiTuttoFare (Brand: "Rolex").
            TASK: Hai ricevuto la richiesta: "${prompt}". Fai la PRIMA di tre domande tecniche per qualificare il problema.
            TONE: Conciso, professionale, esperto.
            ESEMPIO (per 'tapparella bloccata'): "Preso in carico. La tapparella è manuale o motorizzata?"
        `;
        nextStep = 'details';
        break;

      case 'details':
        if (detailCount < 3) {
            systemPrompt = `
                ROLE: Concierge Tecnico.
                CONTEXT: Stai continuando la qualificazione per: "${summary.message}". Dettagli raccolti: ${JSON.stringify(summary.details)}.
                TASK: Fai la SUCCESSIVA domanda tecnica (sei alla domanda ${detailCount + 1} di 3).
                TONE: Efficiente, diretto.
                ESEMPIO (se la precedente era 'motorizzata'): "Capito. La tapparella è completamente bloccata o si muove a scatti?"
            `;
            nextStep = 'details';
        } else {
            systemPrompt = `
                ROLE: Esperto Preventivista.
                CONTEXT: Hai raccolto i dettagli tecnici. Il preventivo è 80€.
                TASK: Presenta il preventivo e chiedi esplicitamente la conferma per procedere.
                TONE: Autorevole, trasparente.
                ACTION:
                1. Preventivo: "Grazie per i dettagli. Il nostro preventivo per un intervento specializzato è di 80€, tutto incluso."
                2. Call to Action: "Possiamo procedere? Mi basta un suo 'sì' o 'confermo' per avviare la raccolta dati per l'intervento."
            `;
            nextStep = 'confirm'; // Aspetta la conferma del cliente
        }
        break;

      case 'confirm':
        // L'utente ha risposto al preventivo (es. "sì", "confermo")
        systemPrompt = `
            ROLE: Coordinatore.
            CONTEXT: Il cliente ha confermato il preventivo.
            TASK: Conferma la ricezione e passa le consegne al flusso scriptato.
            TONE: Organizzato, efficiente.
            ACTION: Rispondi solo con "Perfetto, procediamo con i dati per l'intervento." e nient'altro.
        `;
        nextStep = 'done'; // Lo step 'done' ora significa "fine AI, inizio script"
        break;
      
      case 'done':
        // Questo caso non dovrebbe più essere raggiunto dall'AI, ma lo teniamo per sicurezza.
        systemPrompt = `Sei Niki. Ringrazia il cliente e concludi.`;
        nextStep = 'done';
        break;
    }

    const aiResponse = await callGenerativeAI(systemPrompt, prompt);
    return NextResponse.json({ response: aiResponse, nextStep, summary });

  } catch (error) {
    console.error('Errore API Google AI:', error);
    return NextResponse.json({ error: 'Errore durante la generazione della risposta.' }, { status: 500 });
  }
}