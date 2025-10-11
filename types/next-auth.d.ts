// next-auth.d.ts
import 'next-auth';
import { DefaultSession } from 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Estende il tipo User per includere il nostro tenantId.
   */
  interface User {
    tenantId?: string;
  }

  /**
   * Estende il tipo Session per includere il tenantId nell'oggetto user.
   */
  interface Session {
    user: {
      id: string;
      tenantId?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  /**
   * Estende il token JWT per trasportare il tenantId.
   */
  interface JWT {
    tenantId?: string;
  }
}