// lib/chat-copy.ts
import type { AiResult } from './types';

export const chatCopy = {
  // Domande per la raccolta di informazioni tecniche
  clarification_1: "Capito. Per darti una stima più precisa, potresti descrivere meglio cosa vedi? (es. 'gocciola da sotto il lavandino', 'la presa fa scintille', ecc.)",
  clarification_2: "Grazie. Da quanto tempo si verifica questo problema?",
  clarification_3: "Ok. C'è qualche altra informazione che pensi possa essere utile per il tecnico?",

  // Domande per la raccolta dei dati personali
  ask_name: "Perfetto, ho abbastanza dettagli tecnici. Adesso passiamo ai dati per l'intervento. Come ti chiami?",
  ask_address: "Grazie. In quale via e numero civico ti trovi? **Serviamo principalmente Livorno e provincia.**",
  ask_city: "A quale città corrisponde l'indirizzo?",
  ask_phone: "Ottimo. Qual è il tuo numero di telefono?",
  ask_email: "Perfetto. Se vuoi, lasciami anche un'email (opzionale).",
  ask_timeslot: "Hai una fascia oraria preferita per l'intervento? (es. 'domani mattina', 'oggi pomeriggio', 'flessibile')",
  
  // Messaggi di stato
  confirm_summary: "Riepilogo della tua richiesta:",
  confirm_action: "Invio la richiesta al tecnico? (sì/no)",
  out_of_area: "Al momento non copriamo direttamente la tua zona. Possiamo comunque inviare la richiesta ai nostri tecnici: se accettata, potrebbe essere applicata una maggiorazione per la trasferta. Vuoi procedere comunque?",
  
  // Messaggi finali
  sent: (ticketId: string) => `✅ Richiesta inviata! Il tuo codice è **${ticketId}**. Ti contatteremo a breve per confermare l'intervento.`,
  error: (message: string) => `Ops! Si è verificato un errore: ${message}`,
  cancel: "Ok, annullato. Se hai bisogno di altro, sono qui!",
};

export function decorateEstimates(parts: AiResult): string {
  const items: string[] = [];
  if (parts.category) items.push(`Servizio: ${parts.category}`);
  if (parts.price_low && parts.price_high) items.push(`Stima: ~${parts.price_low}–${parts.price_high}€`);
  if (parts.est_minutes) items.push(`Tempo stimato: ~${parts.est_minutes} min`);
  return items.join(' • ');
}