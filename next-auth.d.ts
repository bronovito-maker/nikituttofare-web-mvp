// auth.ts
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
        if (!credentials?.email || !credentials.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;
        const user = await getUserByEmail(email);

        if (!user) return null;

        const isPasswordValid = await verifyPassword(password, user.Password);
        if (!isPasswordValid) return null;
        
        // DEBUG: Controlliamo l'oggetto user recuperato dal DB
        console.log("✅ DEBUG [auth.ts - authorize]: Utente trovato nel DB:", {
          id: user.Id,
          email: user.Email,
          tenantId: user.tenant_id, 
        });

        return { 
          id: user.Id, 
          name: user.Name, 
          email: user.Email,
          tenantId: user.tenant_id,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
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
        session.user.tenantId = token.tenantId as string;
        
        // DEBUG: Controlliamo la sessione finale che verrà usata
        console.log("✅ DEBUG [auth.ts - session]: Sessione creata:", session);
      }
      return session;
    },
  },
});