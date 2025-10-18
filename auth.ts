// auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
// --- MODIFICATO: Importa l'adapter ---
import { NocoAdapter } from '@/lib/noco-adapter';

export const { handlers, signIn, signOut, auth } = NextAuth({
  // --- MODIFICATO: Usa l'adapter ---
  adapter: NocoAdapter(),
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // --- MODIFICATO: La logica authorize è ora DENTRO l'adapter ---
      // L'adapter DEVE esporre una funzione authorize se si usa Credentials
      // Se NocoAdapter() non ha authorize, NextAuth userà getUserByEmail + confronto hash
      // Assicuriamoci che NocoAdapter abbia la funzione authorize come l'abbiamo scritta
      async authorize(credentials) {
        // NextAuth passa l'adapter qui se presente
        // @ts-ignore // NextAuth type qui può essere complesso
        const adapter = NocoAdapter();
        // @ts-ignore
        if (adapter.authorize) {
          // @ts-ignore
          return await adapter.authorize(credentials);
        }
        // Fallback se authorize non è definito (improbabile con il nostro codice)
        console.error('Funzione Authorize non trovata nell\'adapter!');
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Aggiungi tenantId al token JWT dopo il login
      if (user) {
        token.tenantId = (user as any).tenantId; // Assicurati che authorize ritorni tenantId
        token.name = user.name; // Includi il nome se disponibile
      }
      return token;
    },
    async session({ session, token }) {
      // Aggiungi tenantId alla sessione dall'oggetto token
      if (token && session.user) {
        (session.user as any).tenantId = token.tenantId;
        session.user.name = token.name as string | null | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
