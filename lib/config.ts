// lib/config.ts

/**
 * Mappa dei prezzi e tempi stimati per categoria di servizio.
 * Centralizzare questa configurazione la rende più facile da aggiornare
 * senza dover modificare la logica dell'API.
 */
export const priceMap: Record<string, { priceRange: [number, number]; est_minutes: number }> = {
  idraulico: { priceRange: [70, 120], est_minutes: 60 },
  elettricista: { priceRange: [70, 110], est_minutes: 60 },
  fabbro: { priceRange: [90, 180], est_minutes: 60 },
  muratore: { priceRange: [70, 130], est_minutes: 60 },
  serramenti: { priceRange: [80, 150], est_minutes: 60 },
  clima: { priceRange: [80, 140], est_minutes: 75 },
  trasloco: { priceRange: [150, 400], est_minutes: 120 },
  tuttofare: { priceRange: [60, 100], est_minutes: 60 },
  // Aggiungi qui altre categorie future...
};

/**
 * Costanti di sicurezza per l'hashing delle password.
 * Aumentare il 'salt rounds' (costo) rende l'hashing più sicuro
 * contro attacchi di tipo brute-force. 12 è un valore moderno e robusto.
 */
export const BCRYPT_SALT_ROUNDS = 12;