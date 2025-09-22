// File: lib/noco.ts

// Usiamo require per compatibilità con il tipo di modulo di nocodb-sdk
const NocoClient = require('nocodb-sdk').default;

// Creiamo una singola istanza del client per riutilizzarla
let nocoClient: any = null;

// Funzione per ottenere il client NocoDB
export const getNocoClient = () => {
  if (!nocoClient) {
    // IMPORTANTE: Assicurati che le variabili d'ambiente siano impostate!
    if (!process.env.NOCO_BASE_URL || !process.env.NOCO_AUTH_TOKEN) {
      throw new Error("Le variabili d'ambiente di NocoDB non sono configurate.");
    }
    
    nocoClient = new NocoClient({
      baseURL: process.env.NOCO_BASE_URL,
      auth: {
        "auth-token": process.env.NOCO_AUTH_TOKEN,
      },
    });
  }
  return nocoClient;
};

// --- FUNZIONE MANCANTE AGGIUNTA ---
// Funzione per ottenere un utente tramite la sua email
export const getUserByEmail = async (email: string) => {
  const noco = getNocoClient();
  try {
    const response = await noco.db.dbViewRow.list('vw_users_details', 'Users', {
      where: `(email,eq,${email})`,
    });
    // Restituisce il primo utente trovato o null se non ce ne sono
    return response.list[0] || null;
  } catch (error) {
    console.error("Errore durante la ricerca dell'utente:", error);
    return null;
  }
};

// --- FUNZIONE MANCANTE AGGIUNTA ---
// Funzione per creare un nuovo utente nel database
export const createUser = async (userData: { name: string; email: string; passwordHash: string }) => {
  const noco = getNocoClient();
  try {
    const newUser = await noco.db.dbTableRow.create('Users', {
      name: userData.name,
      email: userData.email,
      password: userData.passwordHash,
    });
    return newUser;
  } catch (error) {
    console.error("Errore durante la creazione dell'utente:", error);
    return null;
  }
};