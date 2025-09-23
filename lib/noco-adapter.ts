// File: lib/noco-adapter.ts

import { Adapter, AdapterUser } from 'next-auth/adapters';
// MODIFICA: Non importiamo più da 'nocodb-sdk', ma dalla nostra funzione client
import { getNocoClient } from './noco'; 

// MODIFICA: Usiamo ReturnType per derivare il tipo corretto
export function NocoAdapter(noco: ReturnType<typeof getNocoClient>): Adapter {
  return {
    async createUser(user) {
      const newUser = await noco.db.dbViewRow.create('v_users', 'Users', {
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
      });
      return newUser as AdapterUser;
    },
    async getUser(id) {
      const user = await noco.db.dbViewRow.read('v_users', 'Users', id);
      return user ? (user as AdapterUser) : null;
    },
    async getUserByEmail(email) {
        const userList = await noco.db.dbViewRow.list('v_users', 'Users', { where: `(email,eq,${email})` });
        const user = userList.list[0];
        return user ? (user as AdapterUser) : null;
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const accountList = await noco.db.dbViewRow.list('v_accounts', 'Accounts', {
        where: `(providerAccountId,eq,${providerAccountId})and(provider,eq,${provider})`,
      });
      const account = accountList.list[0];
      if (!account) return null;

      const user = await noco.db.dbViewRow.read('v_users', 'Users', account.userId);
      return user ? (user as AdapterUser) : null;
    },
    async updateUser(user) {
      const updatedUser = await noco.db.dbViewRow.update('v_users', 'Users', user.id, {
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
      });
      return updatedUser as AdapterUser;
    },
    async linkAccount(account) {
      await noco.db.dbViewRow.create('v_accounts', 'Accounts', account);
      return account;
    },
    async deleteUser(userId) {
      return;
    },
    async unlinkAccount({ providerAccountId, provider }) {
      return;
    },
    async createSession({ sessionToken, userId, expires }) {
        return {} as any;
    },
    async getSessionAndUser(sessionToken) {
        return null;
    },
    async updateSession({ sessionToken }) {
        return {} as any;
    },
    async deleteSession(sessionToken) {
        return;
    },
  };
}