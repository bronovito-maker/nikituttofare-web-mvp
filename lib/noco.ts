// File: lib/noco.ts

// NOTA: Usiamo "import type" perché ci serve solo per i tipi in questa dichiarazione.
// L'importazione vera e propria la faremo dentro la funzione.
import type NocoSdk from "nocodb-sdk";

let nocoClient: any = null;

export const getNocoClient = () => {
  if (!nocoClient) {
    const apiToken = process.env.NOCO_AUTH_TOKEN;
    const baseUrl = process.env.NOCO_BASE_URL;

    if (!apiToken || !baseUrl) {
      throw new Error("Le variabili d'ambiente di NocoDB non sono configurate.");
    }
    
    // MODIFICA CHIAVE: Importiamo il pacchetto qui dentro.
    // Questo è più robusto e gestisce meglio le differenze tra moduli.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Noco = require("nocodb-sdk");
    
    nocoClient = new Noco({
      apiToken,
      baseUrl,
    });
  }
  return nocoClient;
};

// Le altre funzioni non necessitano di modifiche
export const getUserByEmail = async (email: string) => {
    const client = getNocoClient();
    const userList = await client.db.dbViewRow.list('v_users', 'Users', { where: `(email,eq,${email})` });
    return userList.list[0] || null;
};

export const createUser = async (userData: { name: string; email: string; passwordHash: string }) => {
    const client = getNocoClient();
    const newUser = await client.db.dbViewRow.create('v_users', 'Users', {
        Name: userData.name,
        Email: userData.email,
        Password: userData.passwordHash,
    });
    return newUser;
};