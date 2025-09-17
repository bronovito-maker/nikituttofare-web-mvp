import type { AiResult } from './types';

export const chatCopy = {
  address: "Capito. Qual è l'indirizzo completo per l'intervento?",
  phone: "Perfetto. E qual è il tuo numero di telefono?",
  sent: (ticketId: string) => `✅ Richiesta inviata! Il tuo codice è **${ticketId}**. Ti contatteremo a breve.`,
  error: (message: string) => `Ops! Si è verificato un errore: ${message}`,
};

export function decorateEstimates(parts: AiResult): string {
  const items: string[] = [];
  if (parts.category) items.push(`Servizio: ${parts.category}`);
  if (parts.price_low && parts.price_high) items.push(`Stima: ~${parts.price_low}–${parts.price_high}€`);
  if (parts.est_minutes) items.push(`Tempo stimato: ~${parts.est_minutes} min`);
  return items.join('\n');
}