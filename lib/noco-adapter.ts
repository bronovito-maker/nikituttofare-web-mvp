// File: lib/noco-adapter.ts

import { Adapter, AdapterUser } from 'next-auth/adapters';
import { NocoClient } from 'nocodb-sdk';

export function NocoAdapter(noco: NocoClient): Adapter {
  return {
    async createUser(user) {
      const newUser = await noco.db.dbViewRow.create('vw_users_details', 'Users', {
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
      });
      return newUser as AdapterUser;
    },
    async getUser(id) {
      const user = await noco.db.dbViewRow.read('vw_users_details', 'Users', id);
      if (!user) return null;
      return user as AdapterUser;
    },
    async getUserByEmail(email) {
      const users = await noco.db.dbViewRow.list('vw_users_details', 'Users', { where: `(email,eq,${email})` });
      if (!users.list || users.list.length === 0) return null;
      return users.list[0] as AdapterUser;
    },
    async getUserByAccount(providerAccountId) {
      return null;
    },
    async updateUser(user) {
      if (!user.id) throw new Error("User ID is missing for update");
      const updatedUser = await noco.db.dbViewRow.update('vw_users_details', 'Users', user.id, {
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
      });
      return updatedUser as AdapterUser;
    },
    async deleteUser(userId) {
      await noco.db.dbViewRow.delete('vw_users_details', 'Users', userId);
    },
    async linkAccount(account) {
      // Non necessario
    },
    async unlinkAccount(providerAccountId) {
        // Non necessario
    },
    async createSession(session) {
      return null as any;
    },
    async getSessionAndUser(sessionToken) {
      return null as any;
    },
    async updateSession(session) {
      return null as any;
    },
    async deleteSession(sessionToken) {
        // Non necessario
    },
  };
}