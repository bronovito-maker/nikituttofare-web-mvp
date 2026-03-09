// app/api/technician/assistant/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(
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

        const body = await req.json();
        const { ticketId, message, image, history = [] } = body;

        if (!ticketId) {
            return NextResponse.json({ error: 'Ticket ID mancante' }, { status: 400 });
        }

        // 1. Recupero Memoria Progetto e Dettagli Ticket
        // Casting 'as any' necessario perché i tipi generati non includono ancora le nuove tabelle/colonne
        const [ticketRes, memoryRes] = await Promise.all([
            supabase.from('tickets').select('*').eq('id', ticketId).single(),
            supabase.from('assistant_project_memory' as any).select('*').eq('ticket_id', ticketId).single()
        ]);

        const ticket = ticketRes.data as any;
        const memory = memoryRes.data as any;

        // Recupero inventario disponibile se abbiamo il tenant id
        let inventoryContext = 'Catalogo inventario non disponibile.';
        if (ticket?.tenant_id) {
            const inventoryRes = await (supabase as any).from('inventory_items').select('name, sku, quantity_at_hand, unit_of_measure').eq('tenant_id', ticket.tenant_id);
            if (inventoryRes.data) {
                const availableItems = inventoryRes.data.filter((item: any) => item.quantity_at_hand > 0);
                inventoryContext = availableItems.map((i: any) => `- ${i.name} (SKU: ${i.sku || 'N/A'}) - Disp: ${i.quantity_at_hand} ${i.unit_of_measure}`).join('\n');
            }
        }

        const systemPrompt = `
      Sei Niki AI, l'assistente tecnico esperto di "Niki Tuttofare".
      Stai assistendo un tecnico sul campo per l'intervento: "${ticket?.description}".
      Categoria: ${ticket?.category}. Priorità: ${ticket?.priority}.
      
      CONTESTO DI PROGETTO E MEMORIA:
      ${memory?.summary || 'Nessuna nota precedente.'}
      OGGETTI APERTI: ${JSON.stringify(memory?.open_items || [])}
      
      INVENTARIO DISPONIBILE AL TECNICO MENTRE ESEGUE I LAVORI (Scegli solo materiali da questa lista se suggerisci pezzi di ricambio necessari):
      ${inventoryContext}
      
      ISTRUZIONI:
      - Sii estremamente conciso e tecnico.
      - Se ricevi un'immagine, analizzala per identificare guasti, modelli di componenti o materiali necessari e confrontali con l'inventario disponibile.
      - Suggerisci check di sicurezza o passaggi mancanti.
      - Formatta le risposte in Markdown pulito per la visualizzazione mobile. Seleziona ed elenca ESATTAMENTE i nomi e le quantità dei materiali necessari presenti in inventario.
      - Se il tecnico ti chiede di cercare un materiale, prezzo o disponibilità su Tecnomat, usa SEMPRE il tool 'cerca_materiale_tecnomat' a tua disposizione.
    `;

        const tools = [{
            functionDeclarations: [
                {
                    name: "cerca_materiale_tecnomat",
                    description: "Cerca un prodotto fisico nel catalogo di Tecnomat Rimini. Usa questo strumento SOLO E SEMPRE quando il tecnico ti chiede informazioni su listini esterni, materiali da comprare, novità o prezzi da Tecnomat.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            query: {
                                type: SchemaType.STRING,
                                description: "Il termine di ricerca esatto, marca o SKU (es. 'Smalto bianco all'acqua', 'Tasselli fischer', 'Trapano bosch')"
                            }
                        },
                        required: ["query"]
                    }
                }
            ]
        }] as any;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash", // Utilizzo flash per tool calling stabile
            tools: tools
        });

        let result;
        if (image) {
            const base64Data = image.split(',')[1] || image;
            result = await model.generateContent([
                systemPrompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/jpeg"
                    }
                },
                message || "Analizza questa foto del cantiere e dammi suggerimenti tecnici."
            ]);
        } else {
            const chat = model.startChat({
                history: [
                    { role: "user", parts: [{ text: systemPrompt }] },
                    { role: "model", parts: [{ text: "Ricevuto. Sono pronto ad assisterti tecnicamente." }] },
                    ...history.map((h: any) => ({
                        role: h.role === 'user' ? 'user' : 'model',
                        parts: [{ text: h.content }]
                    }))
                ],
            });
            result = await chat.sendMessage(message);

            // GESTIONE FUNCTION CALLING (Se Gemini decide di invocare un tool)
            let call = result.response.functionCalls()?.[0];
            if (call && call.name === 'cerca_materiale_tecnomat') {
                const searchQuery = (call.args as any).query;

                // --- PROXY CALL TRAMITE SAAS (WEB UNLOCKER) ---
                // Utilizziamo ScraperAPI per aggirare il blocco Datadome di Tecnomat.
                // Inserire l'API Key in .env come SCRAPER_API_KEY
                let toolResultData;
                const apiKey = process.env.SCRAPER_API_KEY;

                if (apiKey) {
                    try {
                        // Creiamo l'URL effettivo dell'API di ricerca nascosta di Tecnomat
                        const targetUrl = encodeURIComponent(`https://www.tecnomat.it/api/v1/search?text=${encodeURIComponent(searchQuery)}`);
                        // Costruiamo l'URL per ScraperAPI con bypass antibot (opzione premium consigliata per WAF)
                        const proxyUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${targetUrl}&premium=true`;

                        const proxyRes = await fetch(proxyUrl, {
                            method: 'GET'
                        });

                        if (!proxyRes.ok) {
                            throw new Error(`Proxy error: ${proxyRes.status}`);
                        }

                        // L'API di Tecnomat restituisce JSON
                        const rawData = await proxyRes.json();

                        // Mappiamo i risultati in un formato sintetico per Niki AI
                        const products = rawData.results?.slice(0, 5).map((p: any) => ({
                            nome: p.name,
                            prezzo: `${p.price?.formattedValue || 'N/A'}`,
                            disponibilita: p.stock?.stockLevel > 0 ? `Disponibile (${p.stock.stockLevel})` : 'Esaurito',
                            reparto: p.categories?.[0]?.name || 'Generico'
                        })) || [];

                        toolResultData = {
                            negozio: "Tecnomat",
                            query_cercata: searchQuery,
                            risultati: products.length > 0 ? products : "Nessun prodotto trovato."
                        };

                    } catch (e: any) {
                        console.error("Scraper Proxy Error:", e);
                        toolResultData = { error: "Impossibile recuperare i dari via ScraperAPI: " + e.message };
                    }
                } else {
                    // Fallback Demo Response (finché non metti l'API KEY)
                    toolResultData = {
                        negozio: "Tecnomat Rimini",
                        query_cercata: searchQuery,
                        risultati: [
                            { nome: "Articolo Correlato Premium a " + searchQuery, prezzo: "24.90 €", disponibilita: "Alta (25 pz)", corsia: "Corsia 15, Reparto D" },
                            { nome: "Articolo Base a " + searchQuery, prezzo: "12.50 €", disponibilita: "Bassa (2 pz)", corsia: "Corsia 15, Reparto D" }
                        ],
                        nota: "Attenzione: questo è un risultato demo. Inserisci la SCRAPER_API_KEY nel file .env per i dati reali."
                    };
                }

                // Restituisci il risultato al modello
                result = await chat.sendMessage([{
                    functionResponse: {
                        name: 'cerca_materiale_tecnomat',
                        response: toolResultData
                    }
                }]);
            }
        }

        const responseText = result.response.text();

        if (ticket && !ticket.assistant_thread_id) {
            await supabase.from('tickets').update({ assistant_thread_id: 'active' } as any).eq('id', ticketId);
        }

        return NextResponse.json({ content: responseText });

    } catch (error: any) {
        console.error('AI Assistant Error:', error);
        return NextResponse.json({ error: 'Errore assistente AI', details: error.message }, { status: 500 });
    }
}
