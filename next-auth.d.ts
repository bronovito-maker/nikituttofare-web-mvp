// next-auth.d.ts
import { DefaultSession, User } from "next-auth";
import { JWT } from "@auth/core/jwt";

declare module "next-auth" {
  /**
   * Estende l'oggetto User di base per includere il nostro tenantId
   */
  interface User {
    tenantId?: string;
  }
  
  /**
   * Estende l'oggetto Session per includere le nostre proprietà custom
   */
  interface Session {
    user: {
      id: string;
      tenantId?: string; // Ora TypeScript sa che questa proprietà esiste!
    } & DefaultSession["user"];
  }
}

/**
 * Estende anche il token JWT per trasportare il tenantId
 */
declare module "@auth/core/jwt" {
  interface JWT {
    tenantId?: string;
  }
}