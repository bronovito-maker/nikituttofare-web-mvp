// lib/noco.ts
import 'server-only';
import { Api } from 'nocodb-sdk';

// Definiamo un tipo per il nostro client basato sull'istanza della classe Api
type NocoClient = InstanceType<typeof Api>;

let nocoClient: NocoClient | null = null;

export function getNocoClient(): NocoClient {
  const { NOCO_API_URL, NOCO_API_TOKEN } = process.env;
  if (!NOCO_API_URL || !NOCO_API_TOKEN) {
    throw new Error("Definisci NOCO_API_URL e NOCO_API_TOKEN in .env.local");
  }

  if (!nocoClient) {
    nocoClient = new Api({
      baseURL: NOCO_API_URL,
      headers: { 'xc-token': NOCO_API_TOKEN },
    });
    console.log('Client NocoDB inizializzato con successo.');
  }
  return nocoClient;
}

/**
 * Funzione helper robusta per trovare una singola riga usando dbTableRow.
 */
export async function findOneByWhere(
  project: string,
  table: string,
  where: (f: any) => any
) {
  const noco = getNocoClient();
  const tableApi = (noco as any).dbTableRow;

  // Tentativo con findOne (se supportato)
  if (tableApi?.findOne) {
    return await tableApi.findOne(project, table, { where });
  }

  // Fallback universale con list + limit 1
  const res = await tableApi.list(project, table, { where, limit: 1 });
  const rows = res?.list || res?.data || res || [];
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

export async function getUserByEmail(email: string) {
  try {
    const { NOCO_PROJECT_ID, NOCO_TABLE_USERS } = process.env;
    if (!NOCO_PROJECT_ID || !NOCO_TABLE_USERS) {
      throw new Error('Mancano NOCO_PROJECT_ID o NOCO_TABLE_USERS in .env.local');
    }
    
    return await findOneByWhere(NOCO_PROJECT_ID, NOCO_TABLE_USERS, (f: any) =>
      f.eq('Email', email)
    );
  } catch (error) {
    console.error(`Errore in getUserByEmail con email ${email}:`, error);
    return null;
  }
}