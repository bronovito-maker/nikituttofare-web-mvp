// lib/noco.ts
import { Noco } from '@/lib/nc'; // Importa il nostro nuovo client REST v2

const NC_URL = process.env.NOCO_API_URL!;
const NC_TOKEN = process.env.NC_TOKEN!;

if (!NC_URL || !NC_TOKEN) {
  throw new Error(
    "Variabili d'ambiente NocoDB (NOCO_API_URL, NC_TOKEN) non impostate"
  );
}

// Inizializza il nostro client REST v2
export const noco = new Noco({
  baseUrl: NC_URL,
  token: NC_TOKEN,
});
