// lib/noco-adapter.ts
import { noco } from './noco';
import type { Adapter, AdapterUser } from '@auth/core/adapters';
import type { User as NocoDbUser } from './types';
import { lib as nocoLib } from 'nocodb-sdk';

const PROJECT_ID = process.env.NOCO_PROJECT_ID!;
const DB_ALIAS = process.env.NOCO_DB_ALIAS!;
const TBL_USERS_ID = process.env.NOCO_TABLE_USERS_ID!;
const VW_USERS_ID = process.env.NOCO_VIEW_USERS_ID!;

// @ts-ignore: nocodb-sdk non esporta direttamente Filterv1
type Filter = nocoLib.Filterv1;

const mapNocoToAuthUser = (nocoUser: NocoDbUser | null): AdapterUser | null => {
  if (!nocoUser) return null;
  return {
    id: String(nocoUser.Id),
    email: nocoUser.email,
    name: nocoUser.name ?? undefined,
    emailVerified: null,
    tenantId: nocoUser.tenant_id ? String(nocoUser.tenant_id) : undefined,
  } as AdapterUser & { tenantId?: string };
};

const listUserRows = async (params: Filter) => {
  const viewRow = noco.dbViewRow as any;
  if (!viewRow || typeof viewRow.list !== 'function') {
    throw new Error('NocoDB client non configurato correttamente (dbViewRow.list mancante).');
  }

  return await viewRow.list(DB_ALIAS, PROJECT_ID, TBL_USERS_ID, VW_USERS_ID, params);
};

export function NocoAdapter(): Adapter {
  if (!TBL_USERS_ID || !VW_USERS_ID || !PROJECT_ID || !DB_ALIAS) {
    throw new Error(
      'Variabili d\'ambiente NocoDB per l\'Adapter non configurate (ID, Project, Alias).'
    );
  }

  return {
    async createUser(user) {
      console.warn('NocoAdapter: createUser non implementato con la classe Api.');
      return user as AdapterUser;
    },

    async getUser(id) {
      const records = await listUserRows({
        where: `(Id,eq,${id})`,
        limit: 1,
      });
      const list = Array.isArray(records.list) ? records.list : [];
      return mapNocoToAuthUser((list[0] as NocoDbUser) ?? null);
    },

    async getUserByEmail(email) {
      const records = await listUserRows({
        where: `(email,eq,${email})`,
        limit: 1,
      });
      const list = Array.isArray(records.list) ? records.list : [];
      return mapNocoToAuthUser((list[0] as NocoDbUser) ?? null);
    },

    async updateUser(user) {
      console.warn('NocoAdapter: updateUser non implementato con la classe Api.');
      const records = await listUserRows({
        where: `(Id,eq,${user.id})`,
        limit: 1,
      });
      const list = Array.isArray(records.list) ? records.list : [];
      return mapNocoToAuthUser((list[0] as NocoDbUser) ?? null) as AdapterUser;
    },

    async getUserByAccount({ providerAccountId, provider }) {
      console.warn('NocoAdapter: getUserByAccount non implementato/supportato.');
      return null;
    },
    async linkAccount(account) {
      console.warn('NocoAdapter: linkAccount non implementato/supportato.');
      return undefined;
    },
    async getSessionAndUser(sessionToken) {
      console.warn('NocoAdapter: getSessionAndUser non implementato/supportato (uso JWT).');
      return null;
    },
    async createSession(session) {
      console.warn('NocoAdapter: createSession non implementato/supportato (uso JWT).');
      return session;
    },
    async updateSession(session) {
      console.warn('NocoAdapter: updateSession non implementato/supportato (uso JWT).');
      return null;
    },
    async deleteSession(sessionToken) {
      console.warn('NocoAdapter: deleteSession non implementato/supportato (uso JWT).');
      return undefined;
    },
  };
}
