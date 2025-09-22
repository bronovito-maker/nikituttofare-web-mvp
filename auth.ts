// File: auth.ts

import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { NocoAdapter } from "@/lib/noco-adapter";
import { getNocoClient } from "@/lib/noco";

// Definiamo qui tutta la configurazione di NextAuth
// Questo oggetto non viene esportato, ma usato internamente.
const authConfig: NextAuthConfig = {
  adapter: NocoAdapter(getNocoClient()),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const noco = getNocoClient();
        try {
          const users = await noco.db.dbViewRow.list('vw_users_details', 'Users', {
            where: `(email,eq,${credentials.email})`,
          });
          
          const user = users.list[0];
          if (!user) {
            console.log("[AUTH] Utente non trovato.");
            return null;
          }

          let passwordHash = '';
          if (typeof user.password === 'string') {
            passwordHash = user.password;
          } else if (typeof user.password === 'object' && user.password !== null) {
            passwordHash = user.password.value || user.password.password || '';
          }

          if (!passwordHash) {
            console.log("[AUTH] Hash della password non trovato.");
            return null;
          }

          const isPasswordCorrect = await compare(String(credentials.password), passwordHash);

          if (isPasswordCorrect) {
            return { id: String(user.Id), name: user.name, email: user.email };
          }
          
          console.log("[AUTH] Password errata.");
          return null;

        } catch (error) {
          console.error("[AUTH] Errore durante l'autorizzazione:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
};

// Esportiamo tutto il necessario da questo file centralizzato
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);