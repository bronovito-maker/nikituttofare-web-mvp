// auth.ts
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getUserByEmail } from '@/lib/noco';
import { verifyPassword } from '@/lib/crypto';
import { NocoAdapter } from './lib/noco-adapter';

const authConfig: NextAuthConfig = {
  adapter: NocoAdapter(),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        console.log(`Tentativo di login per: ${email}`);
        const user = await getUserByEmail(email);
        
        if (!user) {
          console.error(`Login fallito: utente non trovato (${email})`);
          return null;
        }

        const hashedPassword =
          (user.Password ??
            user.password ??
            user.password_hash ??
            user.PasswordHash ??
            user.passhash) as string | undefined;

        if (!hashedPassword) {
          console.error(`Login fallito: hash password mancante per ${email}`);
          return null;
        }

        const isPasswordValid = await verifyPassword(password, hashedPassword);
        if (!isPasswordValid) {
          console.error(`Login fallito: password non valida per ${email}`);
          return null;
        }

        console.log(`Login riuscito per: ${email}`);
        return {
          id: String(user.Id),
          name: String(user.Name ?? user.name ?? ''),
          email: String(user.Email ?? user.email ?? email),
          tenantId: user.tenant_id ? String(user.tenant_id) : undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenantId = user.tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.tenantId = token.tenantId;
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
