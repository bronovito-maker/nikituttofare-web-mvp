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

        // 1. Recupero Dettagli Ticket con controllo autorizzazione
        const { data: ticketRes, error: ticketError } = await supabase
            .from('tickets')
            .select('*')
            .eq('id', ticketId)
            .single();

        const ticket = ticketRes as any;

        if (ticketError || !ticket) {
            return NextResponse.json({ error: 'Ticket non trovato' }, { status: 404 });
        }

        // SICUREZZA: Verifica che il tecnico sia l'assegnatario o il creatore
        const isAuthorized = ticket.assigned_technician_id === user.id || ticket.created_by_technician_id === user.id;

        if (!isAuthorized) {
            console.warn(`Tentativo di accesso non autorizzato al ticket ${ticketId} da parte dell'utente ${user.id}`);
            return NextResponse.json({ error: 'Non hai i permessi per accedere a questo intervento' }, { status: 403 });
        }

        // 2. Recupero Memoria Progetto
        const memoryQuery = await supabase
            .from('assistant_project_memory' as any)
            .select('*')
            .eq('ticket_id', ticketId)
            .single();

        const memory = memoryQuery.data as any;

        // Recupero inventario disponibile se abbiamo il tenant id
        let inventoryContext = 'Nessun materiale attualmente in inventario / Magazzino non disponibile.';
        if (ticket?.tenant_id) {
            const inventoryRes = await (supabase as any).from('inventory_items').select('name, sku, quantity_at_hand, unit_of_measure').eq('tenant_id', ticket.tenant_id);
            if (inventoryRes.data && inventoryRes.data.length > 0) {
                const availableItems = inventoryRes.data.filter((item: any) => item.quantity_at_hand > 0);
                if (availableItems.length > 0) {
                    inventoryContext = availableItems.map((i: any) => `- ${i.name} (SKU: ${i.sku || 'N/A'}) - Disp: ${i.quantity_at_hand} ${i.unit_of_measure}`).join('\n');
                } else {
                    inventoryContext = "Tutti gli articoli in inventario sono esauriti (quantità 0).";
                }
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
            model: "gemini-flash-lite-latest", // Utilizzo flash per tool calling stabile
            tools: tools
        });

        let result;
        if (image) {
            // Estrai il mimeType e i dati base64 dal data URL
            const mimeMatch = image.match(/^data:([^;]+);base64,/);
            const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
            const base64Data = image.replace(/^data:([^;]+);base64,/, "");

            console.log(`[AI Assistant] Processing image with mimeType: ${mimeType}`);

            result = await model.generateContent([
                systemPrompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
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

                let toolResultData;
                try {
                    // Bypass nativo tramite le API pubbliche di Typesense (motore di ricerca usato da Tecnomat)
                    // Nessun blocco DataDome su questo endpoint!
                    const typesenseRes = await fetch(
                        `https://eap1gtvsjbd4xhiyp-1.a1.typesense.net/collections/tm_prod_products_1_116/documents/search?q=${encodeURIComponent(searchQuery)}&query_by=name&per_page=5`,
                        {
                            method: "GET",
                            headers: {
                                "X-TYPESENSE-API-KEY": process.env.TYPESENSE_API_KEY || "",
                                "Content-Type": "application/json"
                            }
                        }
                    );

                    if (!typesenseRes.ok) {
                        throw new Error(`Typesense error: ${typesenseRes.status}`);
                    }

                    const data = await typesenseRes.json();

                    if (data.hits && data.hits.length > 0) {
                        const risultati = data.hits.map((hit: any) => {
                            const doc = hit.document;
                            return {
                                nome: doc.name || "N/A",
                                prezzo: doc.seller_offer_116?.price ? `${Number(doc.seller_offer_116.price).toFixed(2)} €` : "N/A",
                                quantita_disponibile: doc.seller_offer_116?.qty || 0,
                                corsia: doc.att_10637 || doc.smart_subdepartment_code || "N/A",
                                reparto: doc.smart_department_code || "N/A",
                                url: doc.url || "N/A"
                            }
                        });

                        toolResultData = {
                            negozio: "Tecnomat Rimini",
                            query_cercata: searchQuery,
                            risultati: risultati
                        };
                    } else {
                        toolResultData = {
                            negozio: "Tecnomat Rimini",
                            query_cercata: searchQuery,
                            nota: "Nessun prodotto trovato per questa ricerca."
                        };
                    }
                } catch (e: any) {
                    console.error("Typesense Direct Fetch Error:", e);
                    toolResultData = { error: "Impossibile recuperare i dati da Tecnomat: " + e.message };
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
