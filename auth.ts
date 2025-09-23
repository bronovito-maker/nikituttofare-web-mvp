// File: auth.ts

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { verifyPassword } from "@/lib/crypto";
import { getUserByEmail, getNocoClient } from "@/lib/noco";
import { NocoAdapter } from "@/lib/noco-adapter";
import { User } from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth((req) => {
  // Invece di un oggetto, passiamo una funzione.
  // Questo codice viene eseguito a ogni richiesta, non durante la build.

  const nocoClient = getNocoClient(); // <-- Il client viene inizializzato qui!

  return {
    adapter: NocoAdapter(nocoClient),
    providers: [
      Credentials({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials): Promise<User | null> {
          const parsedCredentials = z
            .object({
              email: z.string().email(),
              password: z.string().min(6),
            })
            .safeParse(credentials);

          if (parsedCredentials.success) {
            const { email, password } = parsedCredentials.data;
            const user = await getUserByEmail(email);
            
            if (!user || !user.passwordHash) return null;

            const passwordsMatch = await verifyPassword(password, user.passwordHash);

            if (passwordsMatch) {
              // Rimuovi la password prima di restituire l'oggetto utente
              const { passwordHash, ...userWithoutPassword } = user;
              return userWithoutPassword as User;
            }
          }
          return null;
        },
      }),
    ],
    session: {
      strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
          if (user) {
            token.id = user.id;
            // Aggiungi altri campi se necessario, es. token.role = user.role;
          }
          return token;
        },
        async session({ session, token }) {
          if (session.user) {
            session.user.id = token.id as string;
          }
          return session;
        },
      },
      pages: {
        signIn: '/login',
      }
  };
});