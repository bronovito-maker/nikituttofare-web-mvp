// File: auth.ts

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { NocoAdapter } from './lib/noco-adapter';
import { getUserByEmail } from './lib/noco';
import { verifyPassword } from './lib/crypto';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: NocoAdapter(),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        
        const user = await getUserByEmail(email);

        if (!user) {
          console.log('Nessun utente trovato con questa email:', email);
          return null;
        }

        const isPasswordValid = await verifyPassword(password, user.Password);

        if (!isPasswordValid) {
          console.log('Password non valida per l\'utente:', email);
          return null;
        }

        // Restituiamo anche il tenant_id se esiste
        return { 
          id: user.Id, 
          name: user.Name, 
          email: user.Email,
          tenantId: user.tenant_id, // <-- MODIFICA CHIAVE
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // Aggiungiamo i callbacks per gestire il token e la sessione
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-ignore // Aggiungiamo il tenantId al token
        token.tenantId = user.tenantId; // <-- MODIFICA CHIAVE
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // @ts-ignore
        session.user.tenantId = token.tenantId as string; // <-- MODIFICA CHIAVE
      }
      return session;
    },
  },
});