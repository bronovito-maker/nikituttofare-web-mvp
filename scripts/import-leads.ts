import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

// 1. CONFIGURAZIONE ENV
// Carica le variabili d'ambiente
dotenv.config({ path: '.env.local' });
// Fallback su .env se non trova le variabili
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    dotenv.config({ path: '.env' });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Controllo critico configurazione
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ ERRORE CRITICO: Variabili d\'ambiente mancanti.');
    console.error('Verifica di avere NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nel file .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper: Converte stringa "TRUE" in boolean
const parseBool = (val: any) => String(val).toUpperCase().trim() === 'TRUE';

// Helper: Geocoding separato per pulizia codice
async function getCoordinates(indirizzo: string, citta: string): Promise<string | null> {
    if (!indirizzo || !citta) return null;

    try {
        const query = `${indirizzo}, ${citta}`;
        // User-Agent obbligatorio per Nominatim
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
            headers: { 'User-Agent': 'NikiTuttofare-ImportScript/1.0' }
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            // Restituisce formato POINT(lon, lat) compatibile con Postgres
            return `(${data[0].lon},${data[0].lat})`;
        }
    } catch (error) {
        console.warn(`⚠️ Errore geocoding per ${indirizzo}:`, error);
    }
    return null;
}

// 2. FUNZIONE PRINCIPALE
async function main() {
    console.log('🚀 Avvio importazione Leads...');

    const csvPath = path.join(process.cwd(), 'scripts', 'leads.csv');

    if (!fs.existsSync(csvPath)) {
        console.error(`❌ File non trovato: ${csvPath}`);
        console.error('Assicurati di aver rinominato il file in "leads.csv" e di averlo messo nella cartella "scripts".');
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');

    interface CsvRow {
        'Nome Struttura': string;
        'Città': string;
        'Tipologia': string;
        'Valutazione': string;
        'Indirizzo completo': string;
        'Numero di telefono'?: string;
        'Contatto telefonico'?: string;
        'Email di contatto': string;
        'Stato Invio Mail': string;
        'Visita di Persona': string;
        'Cliente Confermato': string;
        'Note/Servizi Suggeriti'?: string;
        'Risposta'?: string;
        [key: string]: any;
    }

    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        from_line: 2 // Skip the first empty line
    }) as CsvRow[];

    console.log(`📄 Trovate ${records.length} righe. Elaborazione in corso...`);

    let successCount = 0;
    let errorCount = 0;

    for (const row of records) {
        const nome = row['Nome Struttura'];

        const values = Object.values(row).filter(v => v !== '');
        if (values.length === 0) {
            // Silently skip completely empty rows
            continue;
        }

        if (!nome) {
            console.warn('⚠️ Riga incompleta saltata (Nome mancante):', JSON.stringify(row));
            continue;
        }

        // Ottieni coordinate (con delay per rispettare il rate limit di Nominatim)
        const coords = await getCoordinates(row['Indirizzo completo'], row['Città']);
        if (coords) await new Promise(resolve => setTimeout(resolve, 1000)); // 1 secondo di pausa

        // Inserimento DB
        const { error } = await supabase.from('leads').insert({
            name: nome,
            city: row['Città'],
            type: row['Tipologia'],
            rating: Number.parseInt(row['Valutazione'] || '0', 10),
            address: row['Indirizzo completo'],
            phone: row['Numero di telefono'] || row['Contatto telefonico'],
            email: row['Email di contatto'],
            status_mail_sent: parseBool(row['Stato Invio Mail']),
            status_called: parseBool(row['Contatto telefonico']),
            status_visited: parseBool(row['Visita di Persona']),
            status_confirmed: parseBool(row['Cliente Confermato']),
            notes: row['Note/Servizi Suggeriti'] || row['Risposta'],
            coordinates: coords
        });

        if (error) {
            console.error(`❌ Errore insert ${nome}:`, error.message);
            errorCount++;
        } else {
            console.log(`✅ Inserito: ${nome} ${coords ? '📍' : ''}`);
            successCount++;
        }
    }

    console.log(`\n🏁 Finito! Inseriti: ${successCount}, Errori: ${errorCount}`);
}

// 3. ESECUZIONE (Fix Top-Level Await)
// Invece di 'await main()', usiamo .catch() per gestire la Promise
main().catch((e) => {
    console.error('❌ Errore fatale nello script:', e);
    process.exit(1);
});