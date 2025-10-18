// types/next-auth.d.ts
import 'next-auth';
import { DefaultSession } from 'next-auth';
import 'next-auth/jwt'; // Importa anche questo per estendere JWT

declare module 'next-auth' {
  /**
   * Estende il tipo User restituito dalla funzione `authorize`
   * e usato nel callback `jwt` al primo accesso.
   */
  interface User {
    id: string;
    tenantId?: string; // Deve corrispondere a quello aggiunto in auth.ts -> authorize
  }

  /**
   * Estende il tipo Session per includere il tenantId nell'oggetto user,
   * rendendolo accessibile tramite `useSession` o `auth()`.
   */
  interface Session {
    user: {
      id: string; // Aggiungi l'ID utente se non già presente
      tenantId?: string; // Deve corrispondere a quello aggiunto in auth.ts -> session callback
    } & DefaultSession['user']; // Mantiene i campi di default come name, email, image
  }
}

// Estende anche il token JWT per includere tenantId
declare module 'next-auth/jwt' {
  /**
   * Estende il token JWT per trasportare il tenantId tra le richieste.
   */
  interface JWT {
    id?: string; // Aggiungi anche l'ID utente al JWT
    tenantId?: string; // Deve corrispondere a quello aggiunto in auth.ts -> jwt callback
  }
}
