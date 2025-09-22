// File: lib/noco.ts

// --- MODIFICA CHIAVE QUI ---
// Importiamo l'intero modulo e poi accediamo alla proprietà 'default'.
// Questa è la soluzione più robusta per i diversi tipi di moduli JavaScript.
import * as NocoSDK from 'nocodb-sdk';
const NocoClient = (NocoSDK as any).default;

import { hash } from 'bcryptjs';

// Funzione per ottenere un client NocoDB configurato
export const getNocoClient = () => {
  // Ora 'new NocoClient' funzionerà correttamente
  const noco = new NocoClient({
    baseURL: process.env.NOCO_BASE_URL,
    apiToken: process.env.NOCO_API_TOKEN,
  });
  return noco;
};

// Funzione per ottenere un utente tramite email (invariata)
export async function getUserByEmail(email: string) {
  const noco = getNocoClient();
  try {
    const user = await noco.db.dbViewRow.list('vw_users_details', 'Users', { where: `(email,eq,${email})` });
    return user.list[0];
  } catch (error) {
    console.error('Errore nel recuperare l’utente tramite email:', error);
    return null;
  }
}

// Funzione per creare un nuovo utente (invariata)
export async function createUser(data: any) {
  const noco = getNocoClient();
  const hashedPassword = await hash(data.password, 10);
  try {
    const newUser = await noco.db.dbViewRow.create('vw_users_details', 'Users', {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });
    return newUser;
  } catch (error) {
    console.error('Errore nella creazione dell’utente:', error);
    return null;
  }
}