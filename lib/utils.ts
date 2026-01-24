// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera un ID di ticket formattato. Esempio: "NTF-123456".
 */
export function generateTicketId(): string {
  const min = 100000;
  const max = 999999;
  const range = max - min + 1;

  const crypto = globalThis.crypto;
  if (crypto) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const num = (array[0] % range) + min;
    return `NTF-${num}`;
  }

  const num = Math.floor(Math.random() * range) + min;
  return `NTF-${num}`;
}
