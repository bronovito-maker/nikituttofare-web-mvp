// auth.ts
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
// Importa getUserByEmail dalla libreria noco originale, non dall'adapter
import { getUserByEmail } from '@/lib/noco'; 
import { verifyPassword } from '@/lib/crypto';
import { NocoAdapter } from './lib/noco-adapter';
import type { User as NocoDbUser } from './lib/types'; // Importa il tipo User da types.ts

const authConfig: NextAuthConfig = {
  // Usa l'adapter NocoDB configurato
  adapter: NocoAdapter(),
  // Usa JWT per la gestione della sessione (non salva sessioni nel DB)
  session: { strategy: 'jwt' }, 
  providers: [
    Credentials({
      name: 'Credentials',
      // 'credentials' definisce i campi mostrati nel form di login (opzionale)
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) {
          console.error('Authorize: Email o password mancanti.');
          return null; // Credenziali non fornite
        }

        console.log(`Authorize: Tentativo di login per: ${email}`);
        
        // Cerca l'utente nel database NocoDB tramite email
        const user = await getUserByEmail(email) as NocoDbUser | null; // Usa il tipo corretto

        if (!user) {
          console.error(`Authorize: Login fallito - utente non trovato (${email})`);
          return null; // Utente non trovato
        }

        // Recupera l'hash della password (adatta i nomi dei campi se diversi in NocoDB)
        const hashedPassword = user.password; // Assumendo che il campo si chiami 'password'

        if (!hashedPassword) {
          console.error(`Authorize: Login fallito - hash password mancante per ${email}`);
          return null; // Password non impostata nel DB
        }

        // Verifica la password
        const isPasswordValid = await verifyPassword(password, hashedPassword);

        if (!isPasswordValid) {
          console.error(`Authorize: Login fallito - password non valida per ${email}`);
          return null; // Password errata
        }

        console.log(`Authorize: Login riuscito per ${email}, Tenant ID: ${user.tenant_id}`);
        
        // Se la password è valida, restituisci l'oggetto utente
        // Questo oggetto verrà passato al callback 'jwt'
        return {
          id: String(user.Id),
          name: user.name ?? undefined, // Usa 'name'
          email: user.email, // Usa 'email'
          // *** Aggiunta Chiave: Includi tenantId ***
          tenantId: user.tenant_id ? String(user.tenant_id) : undefined, 
        };
      },
    }),
  ],
  callbacks: {
    // Il callback 'jwt' viene eseguito quando un token JWT viene creato o aggiornato.
    // L'oggetto 'user' è disponibile solo al primo accesso dopo il login.
    async jwt({ token, user, account, profile, isNewUser }) {
      // Se l'oggetto 'user' esiste (solo al login), aggiungi le sue proprietà al token
      if (user) {
        token.id = user.id;
        // *** Aggiunta Chiave: Aggiungi tenantId al token JWT ***
        // L'oggetto 'user' qui è quello restituito da 'authorize' o dall'adapter
        token.tenantId = user.tenantId; 
        console.log(`JWT Callback (on login): Token aggiornato con id=${token.id}, tenantId=${token.tenantId}`);
      }
      // Il token aggiornato viene salvato e usato per le richieste successive
      return token;
    },

    // Il callback 'session' viene eseguito quando si accede alla sessione (es. con useSession o auth()).
    // Prende il token JWT e lo usa per costruire l'oggetto session.
    async session({ session, token, user }) {
      // Aggiungi le proprietà dal token JWT all'oggetto session.user
      // 'token' qui è il JWT decodificato
      if (token && session.user) {
        session.user.id = token.id as string;
        // *** Aggiunta Chiave: Aggiungi tenantId alla sessione ***
        session.user.tenantId = token.tenantId as string | undefined; 
      }
      // console.log("Session Callback: Sessione restituita:", session); // Log verboso, utile per debug
      return session;
    },
  },
  // Pagina di login personalizzata
  pages: { 
    signIn: '/login',
    // Puoi aggiungere altre pagine se necessario (es. error: '/auth/error')
  },
  // Aggiungi qui altre configurazioni di NextAuth se necessario (es. secret, debug)
  // secret: process.env.AUTH_SECRET, // Assicurati che AUTH_SECRET sia definito!
  // debug: process.env.NODE_ENV === 'development', // Abilita log dettagliati in sviluppo
};

// Esporta gli handler, la funzione auth(), signIn e signOut
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
