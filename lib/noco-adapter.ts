// lib/noco-adapter.ts
import { noco } from '@/lib/noco'; // Importa la NUOVA istanza client
import { NC_TABLE_USERS_ID } from '@/lib/noco-ids'; // Importa l'ID della tabella Users
import type { Adapter, AdapterUser } from 'next-auth/adapters';
import { compare } from 'bcryptjs';

// Definiamo un tipo locale per l'utente NocoDB
type NocoUser = {
  Id: number;
  email: string;
  password_hash: string;
  tenant_id: number;
  full_name: string;
};

// Definiamo un tipo per l'utente "interno" dell'adapter
type AppUser = AdapterUser & {
  passwordHash: string;
  tenantId: number;
};

export function NocoAdapter(): Adapter {
  const getUserByEmail = async (email: string): Promise<AppUser | null> => {
    if (!email) return null;

    const params = {
      where: `(email,eq,${email})`,
      limit: 1,
    };

    try {
      // MAPPATO: Usa il nostro nuovo client v2
      // N.B. L'auth interroga la TABELLA (NC_TABLE_USERS_ID), non una vista
      const data = await noco.findUserBy(NC_TABLE_USERS_ID, params);

      // La v2 API restituisce un oggetto { list: [], pageInfo: {} }
      if (!data || !data.list || data.list.length === 0) {
        console.warn(`[NocoAdapter] Utente non trovato: ${email}`);
        return null;
      }

      const user = data.list[0] as NocoUser;

      // Mappiamo i campi NocoDB -> AdapterUser
      return {
        id: user.Id.toString(),
        email: user.email,
        emailVerified: null, // NocoDB non gestisce questo di default
        passwordHash: user.password_hash,
        tenantId: user.tenant_id,
        name: user.full_name,
      };
    } catch (error) {
      console.error('[NocoAdapter] Errore getUserByEmail:', error);
      return null;
    }
  };

  return {
    // Funzioni richieste da NextAuth che non usiamo (ma devono esistere)
    createUser: async (user) => (null as any),
    getUser: async (id) => (null as any),
    getUserByAccount: async (provider) => (null as any),
    updateUser: async (user) => (null as any),
    linkAccount: async (account) => (null as any),
    // ... e altre ...

    // Funzioni che USIAMO
    getUserByEmail: async (email) => {
      return await getUserByEmail(email);
    },

    // Funzione "authorize" (non standard dell'adapter, ma usata da noi in [auth].ts)
    async authorize(credentials: any) {
      const user = await getUserByEmail(credentials.email as string);

      if (!user) {
        console.log('[Authorize] Login fallito: utente non trovato');
        return null;
      }

      const isPasswordValid = await compare(
        credentials.password as string,
        user.passwordHash
      );

      if (!isPasswordValid) {
        console.log('[Authorize] Login fallito: password errata');
        return null;
      }

      // Ritorna l'oggetto che NextAuth userà per la sessione
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId, // Campo custom
      };
    },
  };
}
