// lib/crypto.ts
import bcrypt from "bcryptjs";
import { BCRYPT_SALT_ROUNDS } from "./config";

/**
 * Genera l'hash di una password in chiaro.
 * Utilizza un numero di "salt rounds" definito centralmente per una maggiore sicurezza.
 * @param plain La password in chiaro.
 * @returns L'hash della password.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(plain, salt);
}

/**
 * Verifica se una password in chiaro corrisponde a un hash.
 * @param plain La password in chiaro da verificare.
 * @param hash L'hash con cui confrontare.
 * @returns true se la password corrisponde, false altrimenti.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}