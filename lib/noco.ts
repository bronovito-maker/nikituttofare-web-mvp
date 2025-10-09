// lib/noco.ts
let nocoClient: any = null;

export function getNocoClient() {
  // Inizializziamo il client solo la prima volta che questa funzione viene chiamata
  if (!nocoClient) {
    // Usiamo 'require' qui dentro per caricare il modulo al momento del bisogno
    const NocoSdk = require("nocodb-sdk");
    const Noco = NocoSdk.Api || NocoSdk.default || NocoSdk;

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
        // Assicurati che il nome della vista sia 'users'
        const user = await client.db.dbViewRow.findOne('users', { 
            where: `(Email,eq,${email})` 
        });
        return user || null;
    } catch (error) {
        console.error("Errore durante la ricerca dell'utente:", error);
        return null;
    }
};