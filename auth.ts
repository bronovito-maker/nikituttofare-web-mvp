// auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    // Login semplificato per sviluppo: accetta qualsiasi email
    Credentials({
      name: "Ospite",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      authorize: async (credentials) => {
        // Simuliamo un utente valido
        // TODO: Quando Supabase sarà configurato, recuperare tenantId dal database
        return { 
          id: "user-1", 
          name: "Ospite", 
          email: credentials.email as string,
          tenantId: "1", // Default tenantId per sviluppo
        }
      },
    }),
  ],
  session: { strategy: "jwt" }, // Nessun database richiesto
  pages: {
    signIn: "/login", // La tua pagina di login custom
  },
  callbacks: {
    // Aggiunge tenantId al JWT token
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tenantId = user.tenantId;
      }
      return token;
    },
    // Aggiunge tenantId alla sessione
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.tenantId = token.tenantId as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnChat = nextUrl.pathname.startsWith('/chat');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Reindirizza al login
      }
      return true;
    },
  },
})