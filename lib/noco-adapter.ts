// File: lib/noco-adapter.ts

import { createRecord, extractSingleRecord, getRecordById, listRecords, updateRecord } from './noco';
import type { Adapter, AdapterUser, AdapterSession } from '@auth/core/adapters';

// Funzione per mappare i dati di NocoDB all'utente atteso da Auth.js (AdapterUser)
const mapNocoToAuthUser = (nocoUser: any): AdapterUser | null => {
    if (!nocoUser) return null;
    return {
        id: String(nocoUser.Id ?? nocoUser.id ?? ''),
        email: nocoUser.Email ?? nocoUser.email ?? '',
        name: nocoUser.Name ?? nocoUser.name ?? '',
        // Aggiungiamo la proprietà richiesta da AdapterUser
        emailVerified: null, 
    };
};

const USERS_TABLE_KEY =
  process.env.NOCO_TABLE_ID ||
  process.env.NOCO_TABLE_USERS ||
  'users';
const USERS_VIEW_ID = process.env.NOCO_USERS_VIEW_ID || undefined;
const USER_NAME_FIELD = process.env.NOCO_USERS_NAME_FIELD || 'Name';
const USER_EMAIL_FIELD = process.env.NOCO_USERS_EMAIL_FIELD || 'Email';

export function NocoAdapter(): Adapter {
  return {
    async createUser(user) {
      const payload = {
        [USER_NAME_FIELD]: user.name,
        [USER_EMAIL_FIELD]: user.email,
      };
      const created = await createRecord(
        USERS_TABLE_KEY,
        payload,
        USERS_VIEW_ID ? { viewId: USERS_VIEW_ID } : {}
      );
      return mapNocoToAuthUser(extractSingleRecord(created)) as AdapterUser;
    },
    async getUser(id) {
      const user = await getRecordById(
        USERS_TABLE_KEY,
        id,
        USERS_VIEW_ID ? { viewId: USERS_VIEW_ID } : {}
      );
      return mapNocoToAuthUser(user);
    },
    async getUserByEmail(email) {
      const users = await listRecords(USERS_TABLE_KEY, {
        where: `(${USER_EMAIL_FIELD},eq,${email})`,
        limit: 1,
        viewId: USERS_VIEW_ID,
      });
      return mapNocoToAuthUser(users[0]);
    },
    async updateUser(user) {
      const payload = {
        [USER_NAME_FIELD]: user.name,
        [USER_EMAIL_FIELD]: user.email,
      };
      const updated = await updateRecord(
        USERS_TABLE_KEY,
        user.id,
        payload,
        USERS_VIEW_ID ? { viewId: USERS_VIEW_ID } : {}
      );
      return mapNocoToAuthUser(extractSingleRecord(updated)) as AdapterUser;
    },
    
    // Le funzioni seguenti non sono usate con la strategia JWT ma sono richieste dall'interfaccia dell'Adapter.
    async getUserByAccount({ providerAccountId, provider }) {
      return null;
    },
    async linkAccount(account) {
      return;
    },
    async getSessionAndUser(sessionToken) {
        return null;
    },
    async createSession(session) {
        return session;
    },
    async updateSession(session) {
        // La funzione precedente causava un errore di tipo.
        // Restituendo null, soddisfiamo il contratto dell'Adapter senza problemi.
        return null;
    },
    async deleteSession(sessionToken) {
        return;
    },
  };
}
