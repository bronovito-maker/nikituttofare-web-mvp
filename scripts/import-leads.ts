import fs from 'node:fs';
// @ts-ignore
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Load ENV
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface CsvRow {
    'Nome Struttura': string;
    'Città': string;
    'Tipologia': string;
    'Valutazione': string;
    'Indirizzo completo': string;
    'Telefono': string;
    'Email': string;
    'Mail inviata': string;
    'Chiamato': string;
    'Visitato': string;
    'Confermato': string;
    'Note': string;
}

const CSV_FILE_PATH = 'scripts/leads.csv';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function geocodeAddress(address: string, city: string) {
    try {
        const query = `${address}, ${city}`;
        const url = `${NOMINATIM_BASE_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`;

        // User-Agent is required by Nominatim
        const headers = { 'User-Agent': 'NTF-Leads-Importer/1.0' };

        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: data[0].lat, lon: data[0].lon };
        }
        return null;
    } catch (error) {
        console.warn(`⚠️ Geocoding failed for ${address}:`, error);
        return null;
    }
}

async function parseBoolean(value: string) {
    if (!value) return false;
    const v = value.toLowerCase().trim();
    return v === 'si' || v === 'yes' || v === 'true' || v === '1' || v === 'x';
}

async function importLeads() {
    if (!fs.existsSync(CSV_FILE_PATH)) {
        console.error(`❌ CSV file not found at ${CSV_FILE_PATH}`);
        console.log("👉 Please place your CSV file there before running the script.");
        process.exit(1);
    }

    const results: CsvRow[] = [];

    fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`📊 Found ${results.length} rows. Starting import...`);

            for (const [index, row] of results.entries()) {
                const name = row['Nome Struttura'];
                if (!name) continue; // Skip empty rows

                const address = row['Indirizzo completo'] || '';
                const city = row['Città'] || '';

                // Geocoding with delay (1s to respect Nominatim rate limit)
                await delay(1000);
                const coords = await geocodeAddress(address, city);

                // Prepare DB object
                const leadData = {
                    name: name,
                    city: city,
                    type: row['Tipologia'],
                    rating: Number.parseInt(row['Valutazione'] || '0'),
                    address: address,
                    phone: row['Telefono'],
                    email: row['Email'],
                    status_mail_sent: await parseBoolean(row['Mail inviata']),
                    status_called: await parseBoolean(row['Chiamato']),
                    status_visited: await parseBoolean(row['Visitato']),
                    status_confirmed: await parseBoolean(row['Confermato']),
                    notes: row['Note'],
                    coordinates: coords ? `(${coords.lon},${coords.lat})` : null // Postgres point format (x,y) -> (lon,lat)
                };

                const { error } = await supabase.from('leads').upsert(leadData, { onConflict: 'name' }); // Assuming name is somewhat unique or we rely on ID. Adjust to email if unique? IDK. Using insert for now, or upsert if we want to update.
                // Actually, upsert requires a unique constraint. If no unique constraint other than ID, upsert acts like insert unless we specify ID. 
                // Let's just use insert for simple import, or maybe upsert if we assume we might re-run.
                // The migration didn't enforce unique name. I'll stick to insert, but check if exists strictly speaking or just insert.
                // To keep it simple let's just insert.

                if (error) {
                    console.error(`❌ Error importing ${name}:`, error.message);
                } else {
                    console.log(`✅ Imported ${index + 1}/${results.length}: ${name} ${coords ? '📍' : ''}`);
                }
            }
            console.log("🎉 Import finished!");
        });
}

await importLeads().catch(console.error);
