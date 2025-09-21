// lib/chat-copy.ts
import type { AiResult } from './types';

export const chatCopy = {
  clarification_2_task: "Perfetto, grazie. C'è qualche dettaglio importante o difficoltà che dovrei sapere? Ad esempio, il tipo di muro, se servono attrezzi particolari, ecc.",
  clarification_2_problem: "Capito. Per darmi un quadro completo, la situazione è stabile o sta peggiorando?",
  clarification_3: "Ok, ci siamo quasi. C'è qualche altra informazione che pensi possa essere utile per il tecnico?",
  ask_name: "Ottimo, grazie per i dettagli! Ho tutte le informazioni tecniche. Ora mi servono solo alcuni dati per organizzare l'intervento. Come ti chiami?",
  ask_address_and_city: "Grazie! Mi puoi dare l'indirizzo completo per l'intervento, includendo la città?",
  ask_phone: "Perfetto. Qual è il numero di telefono su cui possiamo contattarti per aggiornamenti?",
  ask_email: "Se preferisci, puoi lasciarmi anche un'email (è facoltativo, puoi scrivere 'no').",
  ask_timeslot: "Hai una disponibilità preferita per l'intervento? (es. 'domani mattina', 'oggi pomeriggio', 'sono flessibile')",
  confirm_summary: "Fantastico, abbiamo finito! Ecco il riepilogo completo della tua richiesta. Dai un'occhiata per assicurarti che sia tutto corretto:",
  confirm_action: "È tutto giusto? Se mi dici 'sì', invio subito la richiesta ai nostri tecnici. Se vuoi cambiare qualcosa, scrivi 'modifica'.",
  // --- NUOVI TESTI PER LA MODIFICA ---
  ask_modification: "Certo. Cosa vuoi modificare? Puoi scrivere 'nome', 'indirizzo', 'telefono', 'email' o 'disponibilità'.",
  modification_acknowledged: "Ok, ho aggiornato. Controlla di nuovo il riepilogo qui sopra. È tutto corretto ora?",
  // --- FINE NUOVI TESTI ---
  out_of_area: "Al momento la tua zona non è coperta direttamente dal nostro servizio standard. Possiamo comunque inoltrare la richiesta: se un tecnico accetta, potrebbe essere applicato un costo extra per la trasferta. Vuoi che proviamo lo stesso?",
  sent: (ticketId: string) => `✅ Fatto! Richiesta inviata. Il tuo codice di riferimento è **${ticketId}**. Ti aggiorneremo non appena un tecnico prenderà in carico il lavoro.`,
  error: (message: string) => `Ops! Qualcosa è andato storto nell'invio: ${message}`,
  cancel: "Nessun problema, ho annullato la richiesta. Se vuoi iniziare una nuova richiesta, descrivi il tuo nuovo problema.",
  off_topic: "Sono un assistente virtuale per le richieste di intervento. Se hai bisogno di aiuto per un problema in casa, descrivimelo e sarò felice di aiutarti."
};

export function decorateEstimates(parts: AiResult): string {
  const items: string[] = [];
  if (parts.category) items.push(`Servizio: ${parts.category}`);
  if (parts.price_low && parts.price_high) items.push(`Stima: ~${parts.price_low}–${parts.price_high}€`);
  if (parts.est_minutes) items.push(`Tempo stimato: ~${parts.est_minutes} min`);
  return items.join(' • ');
}