import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';   // Fix SonarLint: node:fs
import path from 'node:path'; // Fix SonarLint: node:path
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

// 1. CONFIGURAZIONE ENV
dotenv.config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ ERRORE: Mancano le variabili d\'ambiente (URL o SERVICE_KEY).');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper: Converte stringa "TRUE" in boolean
const parseBool = (val: any) => String(val).toUpperCase().trim() === 'TRUE';

// Helper: Estrae la logica di Geocoding per ridurre la complessità del main
async function getCoordinates(indirizzo: string, citta: string): Promise<string | null> {
    if (!indirizzo || !citta) return null;

    try {
        const query = `${indirizzo}, ${citta}`;
        // User-Agent è obbligatorio per Nominatim
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
            headers: { 'User-Agent': 'NikiTuttofare-ImportScript/1.0' }
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            // Restituisce formato POINT(lon, lat) per Postgres
            return `(${data[0].lat},${data[0].lon})`;
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
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');

    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
    });

    console.log(`📄 Trovate ${records.length} righe. Elaborazione in corso...`);

    let successCount = 0;
    let errorCount = 0;

    for (const row of records) {
        const nome = row['Nome Struttura'];

        if (!nome) {
            console.warn('⚠️ Riga saltata: Nome mancante');
            continue;
        }

        // Ottieni coordinate (con delay per rate limit)
        const coords = await getCoordinates(row['Indirizzo completo'], row['Città']);
        if (coords) await new Promise(resolve => setTimeout(resolve, 1000)); // 1 secondo di pausa

        // Inserimento DB
        const { error } = await supabase.from('leads').insert({
            name: nome,
            city: row['Città'],
            type: row['Tipologia'],
            rating: Number.parseInt(row['Valutazione'] || '0', 10), // Fix SonarLint: Number.parseInt
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

// Esecuzione Top-Level Await (supportata da tsx)
await main();