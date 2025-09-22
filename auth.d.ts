import { DefaultSession } from "next-auth";

// Dichiariamo un'estensione del modulo 'next-auth'
declare module "next-auth" {
  /**
   * La sessione restituita da `auth`, `useSession`, ecc.
   */
  interface Session {
    // Aggiungiamo l'ID dell'utente direttamente alla sessione se vuoi
    userId?: string;
    user: {
      /** L'ID dell'utente nel database. */
      id: string;
    } & DefaultSession["user"];
  }
}