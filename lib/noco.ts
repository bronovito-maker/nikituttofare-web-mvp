// File: lib/noco.ts

// Usiamo l'importazione con '*' per catturare tutte le esportazioni del modulo
import * as NocoSDK from 'nocodb-sdk';

// La classe di cui abbiamo bisogno è una proprietà dell'oggetto importato
const NocoClient = (NocoSDK as any).default;

let nocoClient: any = null;

export const getNocoClient = () => {
  if (!nocoClient) {
    nocoClient = new NocoClient({
      // Configurazioni del client...
    });
  }
  return nocoClient;
};