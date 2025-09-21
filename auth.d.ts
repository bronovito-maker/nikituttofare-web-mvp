// auth.d.ts
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Estende l'interfaccia Session per aggiungere l'ID utente
   * direttamente all'oggetto `user`. Questo è un approccio più standard.
   */
  interface Session {
    user: {
      id: string; // L'ID utente che arriva dal database
    } & DefaultSession['user']; // Mantiene le proprietà originali (name, email, image)
  }
}

// Estendiamo anche il JWT per coerenza
declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
  }
}