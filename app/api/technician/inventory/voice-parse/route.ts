// app/api/technician/inventory/voice-parse/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ''
);

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
        }

        const { transcription } = await req.json();

        if (!transcription) {
            return NextResponse.json({ error: 'Trascrizione mancante' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        items: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    name: { type: SchemaType.STRING },
                                    quantity: { type: SchemaType.NUMBER },
                                    unit: { type: SchemaType.STRING },
                                    category: { type: SchemaType.STRING },
                                    sku: { type: SchemaType.STRING }
                                },
                                required: ["name", "quantity", "unit"]
                            }
                        }
                    },
                    required: ["items"]
                },
            },
        });

        const prompt = `Analizza la seguente dettatura vocale di un tecnico che sta caricando il magazzino del suo furgone.
        Estrai una lista strutturata degli articoli menzionati.
        Dettatura: "${transcription}"
        
        Note:
        - Se l'unità di misura non è chiara, usa 'pz'.
        - Cerca di indovinare una categoria sensata (es. Elettricità, Idraulica, Minuteria).
        - Se menziona codici, mettili nello SKU.
        - Restituisci SOLO il JSON conforme allo schema.`;

        const result = await model.generateContent(prompt);
        const response = JSON.parse(result.response.text());

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('Inventory Voice Parse Error:', error);
        return NextResponse.json({ error: 'Errore durante il parsing vocale', details: error.message }, { status: 500 });
    }
}
