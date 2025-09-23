// File: lib/noco.ts

const Noco = require("nocodb-sdk"); // MODIFICA: Usa 'require' invece di 'import'

let nocoClient: any = null; // Usiamo 'any' per semplicità, dato che il tipo era problematico

export const getNocoClient = () => {
  if (!nocoClient) {
    const apiToken = process.env.NOCO_AUTH_TOKEN;
    const baseUrl = process.env.NOCO_BASE_URL;

    if (!apiToken || !baseUrl) {
      throw new Error("Le variabili d'ambiente di NocoDB non sono configurate.");
    }
    
    // Questa riga ora dovrebbe funzionare correttamente
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