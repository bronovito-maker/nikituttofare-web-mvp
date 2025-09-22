// File: app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { NocoAdapter } from "@/lib/noco-adapter";
import { getNocoClient } from "@/lib/noco";

const noco = getNocoClient();

// Definiamo un tipo per l'utente che ci aspettiamo da NocoDB
type NocoUser = {
  Id: string | number;
  name?: string | null;
  email: string;
  // La password può arrivare come stringa, null, o un oggetto sconosciuto
  password?: string | null | { [key: string]: any };
};

// Rimuoviamo "export" da questa costante
const authOptions: NextAuthConfig = {
  adapter: NocoAdapter(noco),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
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

        try {
          const users = await noco.db.dbViewRow.list('vw_users_details', 'Users', {
            where: `(email,eq,${credentials.email})`,
          });
          
          const user = users.list[0] as NocoUser | undefined;
          
          if (!user) {
            console.log(`[AUTH] Utente non trovato per l'email: ${credentials.email}`);
            return null;
          }
          
          let passwordHash: string | null = null;
          
          if (typeof user.password === 'string') {
            passwordHash = user.password;
          } else if (typeof user.password === 'object' && user.password !== null) {
            const potentialPassword = user.password.value || user.password.text || user.password.password;
            if (typeof potentialPassword === 'string') {
              passwordHash = potentialPassword;
            }
          }

          if (!passwordHash) {
            console.error(`[AUTH] ERRORE: Password hash non trovata o non è una stringa per l'utente ${user.email}`);
            return null;
          }
          
          const passwordToCheck = typeof credentials.password === "string" ? credentials.password : "";
          const isPasswordCorrect = await compare(passwordToCheck, passwordHash);
          
          if (isPasswordCorrect) {
            console.log(`[AUTH] Accesso riuscito per ${user.email}`);
            return {
              id: String(user.Id),
              name: user.name || user.email,
              email: user.email,
            };
          } else {
            console.log(`[AUTH] Password errata per ${user.email}`);
            return null;
          }

        } catch (error) {
          console.error("[AUTH] Eccezione nell'handler authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user?: { id?: string | number } }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };