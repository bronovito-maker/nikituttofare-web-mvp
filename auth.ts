// auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Login semplificato per sviluppo: accetta qualsiasi email
    Credentials({
      name: "Ospite",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      authorize: async (credentials) => {
        // Simuliamo un utente valido
        return { 
          id: "user-1", 
          name: "Ospite", 
          email: credentials.email as string 
        }
      },
    }),
  ],
  session: { strategy: "jwt" }, // Nessun database richiesto
  pages: {
    signIn: "/login", // La tua pagina di login custom
  },
  callbacks: {
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