// lib/ticket.ts

/**
 * Genera un numero casuale di 6 cifre come stringa, con zero iniziali se necessario.
 * @returns {string} Un numero casuale di 6 cifre.
 */
function getRandomSixDigitNumber(): string {
  const min = 100000; // Il più piccolo numero a 6 cifre
  const max = 999999; // Il più grande numero a 6 cifre
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num.toString();
}

/**
 * Genera un ID di ticket formattato.
 * Esempio: "NTF-123456"
 * @returns {string} Il nuovo ID del ticket.
 */
export function generateTicketId(): string {
  const prefix = "NTF";
  const uniquePart = getRandomSixDigitNumber();
  return `${prefix}-${uniquePart}`;
}