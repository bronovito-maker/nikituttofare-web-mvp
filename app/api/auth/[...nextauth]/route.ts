import NextAuth from "next-auth";
import { NocoAdapter } from "@/lib/noco-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email"; // <-- CORREZIONE 1: Importa EmailProvider
import { getNocoClient } from "@/lib/noco";
import { compare } from 'bcryptjs';

const noco = getNocoClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: NocoAdapter(noco),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    // <-- CORREZIONE 2: Usa EmailProvider qui
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
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
          const user = await noco.db.dbViewRow.read('vw_users_details', 'Users', {
            where: `(email,eq,${credentials.email})`
          });

          if (user && await compare(credentials.password, user.password as string)) {
            return {
              id: user.Id as string,
              name: user.name as string,
              email: user.email as string,
            };
          } else {
            return null;
          }
        } catch (error) {
          console.error("Errore durante l'autorizzazione:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token }) {
      return token;
    },
  },
});