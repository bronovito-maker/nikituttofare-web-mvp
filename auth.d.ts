import 'next-auth';
import '@auth/core/jwt';

declare module 'next-auth' {
  /**
   * Estende l'interfaccia Session per includere la nostra proprietà personalizzata `userId`.
   */
  interface Session {
    userId?: string;
  }
}

declare module '@auth/core/jwt' {
  /**
   * Estende l'interfaccia JWT per includere la nostra proprietà personalizzata `userId`.
   */
  interface JWT {
    userId?: string;
  }
}