// auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    // Login semplificato - accetta qualsiasi email per sviluppo
    // In produzione: usare Supabase Auth direttamente con Magic Link
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string;

        if (!email?.includes('@')) {
          return null;
        }

        // In sviluppo: crea un utente mock
        // In produzione: verificare il Magic Link token con Supabase
        const userId = `user-${email.split('@')[0]}`;

        return {
          id: userId,
          name: email.split('@')[0],
          email: email,
          role: email.includes('admin') ? 'admin' : 'user',
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 giorni
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || 'user';
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.role === 'admin';

      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');

      // Admin routes require admin role
      if (isOnAdmin) {
        return isLoggedIn && isAdmin;
      }

      // Dashboard requires login
      if (isOnDashboard) {
        return isLoggedIn;
      }

      return true;
    },
  },
})
