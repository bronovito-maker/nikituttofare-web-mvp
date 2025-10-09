// lib/noco.ts
import NocoSdk from "nocodb-sdk";

// Questa riga gestisce la compatibilità dei moduli.
// La modifica chiave è usare 'require' per forzare il caricamento
// del modulo in un modo che Next.js 14+ comprende meglio lato server.
const Noco = (NocoSdk as any).default || require("nocodb-sdk");

let nocoClient: any = null;

export function getNocoClient() {
  if (!nocoClient) {
    const apiToken = process.env.NOCO_API_TOKEN;
    const apiUrl = process.env.NEXT_PUBLIC_NOCO_API_URL;

    if (!apiToken || !apiUrl) {
      throw new Error("Le variabili d'ambiente di NocoDB non sono configurate.");
    }
    
    nocoClient = new Noco({
      url: apiUrl,
      auth: {
        token: apiToken
      },
    });
  }
  return nocoClient;
}

export const getUserByEmail = async (email: string) => {
    const client = getNocoClient();
    try {
        // Assicurati che il nome della vista sia 'users'.
        // Controlla anche che le colonne si chiamino 'email', 'Id', 'Name', 'Password'
        const user = await client.db.dbViewRow.findOne('users', { 
            where: `(email,eq,${email})` 
        });
        return user || null;
    } catch (error) {
        console.error("Errore durante la ricerca dell'utente:", error);
        return null;
    }
};