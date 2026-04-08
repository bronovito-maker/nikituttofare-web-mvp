import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { InventoryItem } from '@/lib/actions/inventory';

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

        // Recuperiamo il tenant_id dell'utente
        const tenantId = user.user_metadata?.tenant_id || 'rimini';

        const { transcription, mode } = await req.json();

        if (!transcription) {
            return NextResponse.json({ error: 'Trascrizione mancante' }, { status: 400 });
        }

        // Fetch del catalogo attuale
        const { data: catalogData, error: dbError } = await (supabase as any)
            .from('inventory_items')
            .select('id, name, sku, category, unit_of_measure')
            .eq('tenant_id', tenantId);

        if (dbError) {
            console.error('Error fetching catalog for AI smart match:', dbError);
            return NextResponse.json({ error: 'Impossibile leggere il catalogo per il matching' }, { status: 500 });
        }

        // Formattiamo il catalogo per alleggerire i token
        const compactCatalog = (catalogData || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            sku: item.sku,
            unit: item.unit_of_measure
        }));

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        matched: {
                            type: SchemaType.ARRAY,
                            description: "Articoli identificati con successo presenti nel catalogo fornito.",
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    inventoryItemId: { type: SchemaType.STRING, description: "L'ID esatto (UUID) dell'articolo dal JSON del catalogo" },
                                    nameFromCatalog: { type: SchemaType.STRING, description: "Il nome esatto estratto dal JSON" },
                                    quantity: { type: SchemaType.NUMBER },
                                    unit: { type: SchemaType.STRING }
                                },
                                required: ["inventoryItemId", "nameFromCatalog", "quantity"]
                            }
                        },
                        unmatched: {
                            type: SchemaType.ARRAY,
                            description: "Articoli menzionati dalla voce ma NON trovati con chiarezza nel catalogo fornito.",
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    nameMentioned: { type: SchemaType.STRING, description: "Il nome del materiale non riconosciuto" },
                                    quantity: { type: SchemaType.NUMBER },
                                    unit: { type: SchemaType.STRING, description: "pz, m, l, kg" },
                                    category: { type: SchemaType.STRING }
                                },
                                required: ["nameMentioned", "quantity", "unit"]
                            }
                        }
                    },
                    required: ["matched", "unmatched"]
                },
            },
        });

        const prompt = `
Sei un magazziniere intelligente dotato di AI. 
Un tecnico sul campo ha inviato la seguente nota vocale: "${transcription}"
Obiettivo: L'utente sta effettuando una operazione di tipo: "${mode === 'discharge' ? 'Scarico sul cantiere' : 'Carico in magazzino'}".
Estrai gli articoli e le loro quantità dalla nota vocale.
        
Fai un MATCH tra ciò che ha detto e questo catalogo JSON esistente:
${JSON.stringify(compactCatalog)}

Regole IMPORTANTI:
1. Se il nome detto dall'utente somiglia o equivale a qualcosa nel catalogo, inseriscilo in "matched" usando il suo "id" ESATTO dal catalogo JSON. Non inventare ID.
2. Includi tutte le varianti linguistiche appropriate (es. "flessibile" = "smerigliatrice angolare", "flex" = "smerigliatrice").
3. Se menziona materiali completamente sconosciuti che NON hanno alcun corrispondente ovvio (o la quantità di ambiguità è troppo alta), inseriscili in "unmatched", deduci unità di misura e una categoria generica.
4. Le quantità devono essere estrapolate come numeri interi o decimanli validi. "Un", "uno", "una" = 1.
5. Inserisci in unmatched eventuali articoli di cui si capisce essenzialmente il nome ma non sono nel catalogo Json sopra fornito.
`;

        const result = await model.generateContent(prompt);
        const response = JSON.parse(result.response.text());

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('Inventory Smart Match Error:', error);
        return NextResponse.json({ error: 'Errore durante il parsing vocale', details: error.message }, { status: 500 });
    }
}
