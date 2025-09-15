// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserByEmail } from "@/lib/noco";
import { verifyPassword } from "@/lib/crypto";

const authConfig = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").toLowerCase().trim();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const base = process.env.NOCO_BASE_URL || process.env.NOCODB_BASE_URL || "";
        const token = process.env.NOCO_API_TOKEN || process.env.NOCODB_TOKEN || "";
        const usersTable = process.env.NOCO_USERS_TABLE_ID || process.env.NOCODB_TABLE_ID_USERS || "";
        if (!base || !token || !usersTable) throw new Error("Missing NocoDB env for users");
        
        // --- MODIFICA CHIAVE: Aggiunto blocco try...catch ---
        try {
          const u = await getUserByEmail(base, token, usersTable, email);
          if (!u || !u.password_hash) return null;

          const ok = await verifyPassword(password, String(u.password_hash));
          if (!ok) return null;

          return { id: String(u.id || email), email, name: u.name || email.split("@")[0] };
        } catch (error) {
            console.error("[AUTH_ERROR] Impossibile contattare il database:", error);
            // Lancia un errore specifico che può essere gestito nel frontend
            throw new Error("Servizio di autenticazione temporaneamente non disponibile. Riprova più tardi.");
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = (user as any).id;
      return token;
    },
    async session({ session, token }) {
      (session as any).userId = token.userId as string;
      return session;
    },
  },

  pages: { signIn: "/login" },
});

export const { handlers: { GET, POST }, auth, signIn, signOut } = authConfig;