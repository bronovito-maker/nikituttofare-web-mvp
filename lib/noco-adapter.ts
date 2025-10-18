// lib/noco-adapter.ts
import { createRecord, extractSingleRecord, getRecordById, listRecords, updateRecord } from './noco';
import type { Adapter, AdapterUser } from '@auth/core/adapters';
import type { User as NocoDbUser } from './types'; // Importa il nostro tipo User definito in types.ts

// Usa le variabili d'ambiente definite in .env.example
const USERS_TABLE_KEY = process.env.NOCO_TABLE_USERS!; // Deve essere 'users'
const USERS_VIEW_ID = process.env.NOCO_VIEW_USERS || undefined; // Vista opzionale

// Funzione per mappare i dati di NocoDB all'utente atteso da Auth.js (AdapterUser)
const mapNocoToAuthUser = (nocoUser: NocoDbUser | null): AdapterUser | null => {
  if (!nocoUser) return null;
  return {
    // Mappa i campi della tabella 'users' ai campi attesi da AdapterUser
    id: String(nocoUser.Id), // Usa 'Id' come definito nella tua tabella
    email: nocoUser.email, // Usa 'email'
    name: nocoUser.name ?? undefined, // Usa 'name', rendilo opzionale se può mancare
    emailVerified: null, // Auth.js richiede questo, ma non lo gestiamo da NocoDB per ora
    // *** Aggiunta Chiave: Passiamo il tenant_id ***
    // Questa proprietà non è standard in AdapterUser, ma la aggiungiamo
    // perché la useremo nei callback di auth.ts
    tenantId: nocoUser.tenant_id ? String(nocoUser.tenant_id) : undefined,
  };
};

export function NocoAdapter(): Adapter {
  // Verifica che le variabili d'ambiente necessarie siano definite
  if (!USERS_TABLE_KEY) {
    throw new Error('La variabile d\'ambiente NOCO_TABLE_USERS non è definita.');
  }

  return {
    async createUser(user) {
      const payload = {
        email: user.email,
        name: user.name,
        // Non salviamo la password qui, viene gestita dal provider Credentials
        // Aggiungi qui altri campi necessari per creare un utente in NocoDB, es. tenant_id se richiesto
      };
      const created = await createRecord(
        USERS_TABLE_KEY,
        payload,
        USERS_VIEW_ID ? { viewId: USERS_VIEW_ID } : {}
      );
      const record = extractSingleRecord<NocoDbUser>(created);
      return mapNocoToAuthUser(record) as AdapterUser; // Assicura il tipo corretto
    },

    async getUser(id) {
      const record = await getRecordById(
        USERS_TABLE_KEY,
        id,
        USERS_VIEW_ID ? { viewId: USERS_VIEW_ID } : {}
      );
      return mapNocoToAuthUser(record as NocoDbUser | null);
    },

    async getUserByEmail(email) {
      // Assicurati che il nome del campo email sia corretto
      const whereClause = `(email,eq,${email})`;
      const records = await listRecords(USERS_TABLE_KEY, {
        where: whereClause,
        limit: 1,
        viewId: USERS_VIEW_ID,
      });
    return mapNocoToAuthUser(records[0] as NocoDbUser | null);
    },

    async updateUser(user) {
      // Aggiorna solo i campi permessi (es. nome, email se verificata)
      // L'ID non deve essere incluso nel payload di aggiornamento
      const payload: Partial<NocoDbUser> = {};
      if (user.name) payload.name = user.name;
      if (user.email) payload.email = user.email; // Attenzione: aggiornare email può avere implicazioni

      if (Object.keys(payload).length === 0) {
        // Se non ci sono dati da aggiornare, restituisci l'utente originale mappato
        const existingRecord = await getRecordById(
          USERS_TABLE_KEY,
          user.id,
          USERS_VIEW_ID ? { viewId: USERS_VIEW_ID } : {}
        );
        return mapNocoToAuthUser(existingRecord as NocoDbUser | null) as AdapterUser;
      }

      const updated = await updateRecord(
        USERS_TABLE_KEY,
        user.id, // L'ID dell'utente da aggiornare
        payload,
        USERS_VIEW_ID ? { viewId: USERS_VIEW_ID } : {}
      );
      const record = extractSingleRecord<NocoDbUser>(updated);
      // Se l'aggiornamento non restituisce il record completo, recuperalo
      let finalUser = record ? mapNocoToAuthUser(record) : null;
      if (!finalUser) {
        const refreshedRecord = await getRecordById(
          USERS_TABLE_KEY,
          user.id,
          USERS_VIEW_ID ? { viewId: USERS_VIEW_ID } : {}
        );
        finalUser = mapNocoToAuthUser(refreshedRecord as NocoDbUser | null);
      }
      return finalUser as AdapterUser; // Assicura il tipo
    },

    // Le funzioni seguenti NON sono usate con la strategia JWT ('session: { strategy: 'jwt' }' in auth.ts)
    // ma devono essere definite per soddisfare l'interfaccia Adapter.
    // Restituiamo valori che non creano problemi.
    async getUserByAccount({ providerAccountId, provider }) {
      console.warn('NocoAdapter: getUserByAccount non implementato/supportato.');
      return null;
    },
    async linkAccount(account) {
      console.warn('NocoAdapter: linkAccount non implementato/supportato.');
      return undefined; // o Promise<void>
    },
    async getSessionAndUser(sessionToken) {
      console.warn('NocoAdapter: getSessionAndUser non implementato/supportato (uso JWT).');
      return null;
    },
    async createSession(session) {
      console.warn('NocoAdapter: createSession non implementato/supportato (uso JWT).');
      return session; // Restituisci la sessione ricevuta come richiesto dal tipo
    },
    async updateSession(session) {
      console.warn('NocoAdapter: updateSession non implementato/supportato (uso JWT).');
      // Il tipo richiede AdapterSession | null. Restituire null è sicuro.
      return null;
    },
    async deleteSession(sessionToken) {
      console.warn('NocoAdapter: deleteSession non implementato/supportato (uso JWT).');
      return undefined; // o Promise<void>
    },
    // Funzioni opzionali per la verifica email (non implementate)
    // async createVerificationToken(token) { return null },
    // async useVerificationToken(params) { return null },
  };
}
