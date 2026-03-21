// app/api/technician/assistant/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { saveMessage } from '@/lib/supabase-helpers';

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

        // SALVATAGGIO MESSAGGIO UTENTE (Se non è un init invisibile)
        if (message && !message.startsWith('[SYSTEM_INIT]')) {
            await saveMessage(ticketId, 'user', message, image);
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
      Sei Niki AI, assistente tecnico per l'intervento: "${ticket?.description}".
      
      CONTESTO MAGAZZINO (Materiali disponibili subito):
      ${inventoryContext}

      REGOLE MANDATORIE (SINTESI ESTREMA):
      1. SINTESI: Solo frasi brevi e tecniche. Mai discorsivo.
      2. RICERCA: Se serve materiale NON presente in magazzino, usa 'cerca_materiale_tecnomat' immediatamente.
      3. VISUAL CARDS: Per ogni prodotto trovato, genera un blocco 'product'. 
         IMPORTANTE: Inserisci SEMPRE una riga vuota PRIMA e DOPO ogni blocco \` \` \` product.
         Esempio:
         Ecco il materiale:

         \`\`\`product
         { "nome": "...", ... }
         \`\`\`

         Aggiungo alla lista?
      4. AZIONE: Chiedi sempre "Aggiungo alla lista?" dopo aver mostrato le card.
      5. NO TABELLE.
      6. WARNING: Solo per procedure pericolose.
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
                },
                {
                    name: "aggiungi_a_lista_spesa",
                    description: "Salva un materiale o prodotto nella lista della spesa permanente dell'intervento. Usa questo strumento quando il tecnico conferma di voler acquistare un prodotto trovato o quando identifichi materiale necessario mancante.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            nome: { type: SchemaType.STRING, description: "Nome del prodotto" },
                            sku: { type: SchemaType.STRING, description: "Codice SKU del prodotto (se disponibile)" },
                            prezzo: { type: SchemaType.STRING, description: "Prezzo stimato" },
                            url: { type: SchemaType.STRING, description: "URL del prodotto (se disponibile)" }
                        },
                        required: ["nome"]
                    }
                }
            ]
        }] as any;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-pro", // Versione Pro 2.5 disponibile nell'ambiente
            systemInstruction: systemPrompt,
            tools: tools,
            generationConfig: {
                temperature: 0,
                maxOutputTokens: 2048, // Aumentato per evitare troncamenti con molte card
            }
        });

        // Gemini API requirement: history must start with 'user' role
        // and must alternate user/model.
        let chatHistory = history.slice(-20).map((h: { role: string; content?: string; image_url?: string }) => {
            const parts: any[] = [];
            if (h.image_url) {
                parts.push({ text: `[Immagine allegata: ${h.image_url}]` });
            }
            if (h.content) {
                parts.push({ text: h.content });
            }

            // Garantiamo che ci sia almeno un part
            if (parts.length === 0) {
                parts.push({ text: "..." });
            }

            return {
                role: h.role === 'user' ? 'user' : 'model',
                parts: parts
            };
        });

        const firstUserIndex = chatHistory.findIndex((h: { role: string }) => h.role === 'user');
        if (firstUserIndex !== -1) {
            chatHistory = chatHistory.slice(firstUserIndex);
        } else {
            chatHistory = [];
        }

        // 3. Preparazione messaggio corrente (User)
        const currentMessageParts: any[] = [];
        if (image) {
            const base64Data = image.replace(/^data:([^;]+);base64,/, "");
            const mimeType = image.match(/^data:([^;]+);base64,/)?.[1] || "image/jpeg";

            currentMessageParts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            });
        }
        if (message) {
            currentMessageParts.push({ text: message });
        } else if (image) {
            currentMessageParts.push({ text: "Analizza questa foto." });
        }

        // Se non c'è nulla da inviare, usciamo
        if (currentMessageParts.length === 0) {
            return NextResponse.json({ content: "Nessun messaggio inviato." });
        }

        // Inizia la sessione di chat
        const chat = model.startChat({ history: chatHistory });

        // Primo invio: User -> Assistente
        let result = await chat.sendMessage(currentMessageParts);

        // 4. GESTIONE FUNCTION CALLING (Loop ricorsivo)
        // L'SDK `startChat` di Gemini gestisce automaticamente la cronologia interna
        // quando usiamo `chat.sendMessage` ripetutamente per i risultati dei tool.
        let response = result.response;
        let calls = response.functionCalls() || [];

        while (calls.length > 0) {
            const resultsForModel: any[] = [];
            for (const call of calls) {
                console.log(`[AI Assistant] Tool Call: ${call.name}`, call.args);

                if (call.name === 'cerca_materiale_tecnomat') {
                    const searchQuery = (call.args as any).query;
                    try {
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

                        if (!typesenseRes.ok) throw new Error(`Typesense error: ${typesenseRes.status}`);
                        const data = await typesenseRes.json();
                        const toolResultData = data.hits && data.hits.length > 0 ? {
                            risultati: data.hits.map((hit: any) => {
                                const doc = hit.document;
                                // Logica Corsia: Se è "MOBILE" o simile, lo consideriamo come Reparto.
                                // Se è un numero, è la corsia specifica.
                                let corsiaRaw = doc.att_10637 || doc.att_10637_value || doc.smart_subdepartment_code || "N/A";
                                let corsia = corsiaRaw;
                                if (corsiaRaw === doc.smart_department_code || corsiaRaw === doc.smart_subdepartment_code) {
                                    corsia = `Reparto ${corsiaRaw}`;
                                } else if (/^\d+$/.test(corsiaRaw)) {
                                    corsia = `Corsia ${corsiaRaw}`;
                                }

                                // Pulizia titolo
                                const nome = (doc.name || "N/A").replace(/\s+/g, ' ').trim();

                                // Cerchiamo di ottenere un'immagine di qualità migliore se disponibile
                                const imageUrl = doc.image || doc.small_image || doc.thumbnail || "N/A";

                                return {
                                    nome: nome,
                                    prezzo: doc.seller_offer_116?.price ? `${Number(doc.seller_offer_116.price).toFixed(2)} €` : "Verificare in sede",
                                    sku: doc.sku || "N/A",
                                    corsia: corsia,
                                    url: doc.url || "N/A",
                                    image_url: imageUrl
                                }
                            })
                        } : { nota: "Nessun prodotto trovato per questa ricerca." };

                        resultsForModel.push({
                            functionResponse: { name: 'cerca_materiale_tecnomat', response: toolResultData }
                        });
                    } catch (e: any) {
                        resultsForModel.push({
                            functionResponse: { name: 'cerca_materiale_tecnomat', response: { error: "Errore durante la ricerca: " + e.message } }
                        });
                    }
                }

                if (call.name === 'aggiungi_a_lista_spesa') {
                    const { nome, sku, prezzo, url } = call.args as any;
                    try {
                        const { data: currentMemory } = await (supabase
                            .from('assistant_project_memory' as any)
                            .select('open_items')
                            .eq('ticket_id', ticketId)
                            .single() as any);

                        const items = currentMemory?.open_items || [];
                        items.push({ nome, sku, prezzo, url, added_at: new Date().toISOString() });
                        await supabase.from('assistant_project_memory' as any).upsert({
                            ticket_id: ticketId,
                            open_items: items,
                            updated_at: new Date().toISOString()
                        } as any);

                        resultsForModel.push({
                            functionResponse: { name: 'aggiungi_a_lista_spesa', response: { success: true, message: "Prodotto aggiunto correttamente alla lista della spesa." } }
                        });
                    } catch (e: any) {
                        resultsForModel.push({
                            functionResponse: { name: 'aggiungi_a_lista_spesa', response: { success: false, error: e.message } }
                        });
                    }
                }
            }

            // Invia le risposte delle funzioni e ottieni la risposta testuale finale (o nuove chiamate)
            // chat.sendMessage aggiungerà automaticamente questi come parte della conversazione
            result = await chat.sendMessage(resultsForModel);
            response = result.response;
            calls = response.functionCalls() || [];
        }

        let responseText = "";
        try {
            // Gemmi-Pro può a volte non restituire testo se la risposta è interamente 
            // costituita da chiamate a funzioni e non c'è un testo di accompagnamento.
            responseText = response.text() || "Ho completato la ricerca. Ecco i risultati:";
        } catch (e) {
            console.warn('[AI Assistant] Impossibile estrarre testo dalla risposta:', e);
            responseText = "Ho elaborato la tua richiesta.";
        }

        // SALVATAGGIO RISPOSTA ASSISTENTE
        if (responseText) {
            await saveMessage(ticketId, 'assistant', responseText);
        }

        if (ticket && !ticket.assistant_thread_id) {
            await supabase.from('tickets').update({ assistant_thread_id: 'active' } as any).eq('id', ticketId);
        }

        return NextResponse.json({ content: responseText });

    } catch (error: any) {
        console.error('AI Assistant Error:', error);
        return NextResponse.json({
            error: 'Errore assistente AI',
            details: error.message,
            content: "⚠️ Si è verificato un errore durante l'elaborazione. Per favore riprova."
        }, { status: 500 });
    }
}
