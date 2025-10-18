// lib/noco.ts
import { Api, lib as nocoLib } from 'nocodb-sdk';
import type { User as NocoDbUser } from './types';

const NC_API_URL = process.env.NOCO_API_URL!;
const NC_API_TOKEN = process.env.NOCO_API_TOKEN!;
const NC_PROJECT_ID = process.env.NOCO_PROJECT_ID!;
const NC_DB_ALIAS = process.env.NOCO_DB_ALIAS!;

const TBL_USERS_ID = process.env.NOCO_TABLE_USERS_ID!;
const VW_USERS_ID = process.env.NOCO_VIEW_USERS_ID!;

if (!NC_API_URL || !NC_API_TOKEN || !NC_PROJECT_ID || !NC_DB_ALIAS) {
  throw new Error("Variabili d'ambiente NocoDB (.env.local) non configurate correttamente.");
}

export const noco = new Api({
  baseURL: NC_API_URL,
  headers: {
    'xc-token': NC_API_TOKEN,
  },
});

export async function getUserByEmail(email: string): Promise<NocoDbUser | null> {
  if (!TBL_USERS_ID || !VW_USERS_ID) {
    throw new Error('ID Tabella/Vista Utenti non trovati in .env.local');
  }

  try {
    const records = await noco.dbViewRow.list(
      NC_DB_ALIAS,
      NC_PROJECT_ID,
      TBL_USERS_ID,
      VW_USERS_ID,
      {
        where: `(email,eq,${email})`,
        limit: 1,
      }
    );
    return (records.list[0] as NocoDbUser) ?? null;
  } catch (error) {
    console.error(`Errore nel recupero utente ${email} da NocoDB:`, error);
    return null;
  }
}
