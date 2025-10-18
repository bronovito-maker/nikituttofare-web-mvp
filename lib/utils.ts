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
  const min = 100000
  const max = 999999
  const num = Math.floor(Math.random() * (max - min + 1)) + min
  return `NTF-${num}`
}
