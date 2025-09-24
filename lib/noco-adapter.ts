// File: lib/noco-adapter.ts

import { getNocoClient } from './noco';
import type { Adapter, AdapterUser, AdapterSession } from '@auth/core/adapters';

// Funzione per mappare i dati di NocoDB all'utente atteso da Auth.js (AdapterUser)
const mapNocoToAuthUser = (nocoUser: any): AdapterUser | null => {
    if (!nocoUser) return null;
    return {
        id: nocoUser.Id,
        email: nocoUser.Email,
        name: nocoUser.Name,
        // Aggiungiamo la proprietà richiesta da AdapterUser
        emailVerified: null, 
    };
};

export function NocoAdapter(): Adapter {
  return {
    async createUser(user) {
      const nocoClient = getNocoClient();
      const newUser = await nocoClient.db.dbViewRow.create('v_users', 'Users', {
        Name: user.name,
        Email: user.email,
      });
      return mapNocoToAuthUser(newUser) as AdapterUser;
    },
    async getUser(id) {
      const nocoClient = getNocoClient();
      const user = await nocoClient.db.dbViewRow.read('v_users', 'Users', id);
      return mapNocoToAuthUser(user);
    },
    async getUserByEmail(email) {
      const nocoClient = getNocoClient();
      const userList = await nocoClient.db.dbViewRow.list('v_users', 'Users', {
        where: `(Email,eq,${email})`,
      });
      return mapNocoToAuthUser(userList.list[0]);
    },
    async updateUser(user) {
      const nocoClient = getNocoClient();
      const updatedUser = await nocoClient.db.dbViewRow.update('v_users', 'Users', user.id, {
        Name: user.name,
        Email: user.email,
      });
      return mapNocoToAuthUser(updatedUser) as AdapterUser;
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