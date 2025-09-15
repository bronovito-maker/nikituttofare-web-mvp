// lib/chat-copy.ts
import type { AiResult } from './types';

export const chatCopy = {
  // Messaggi di stato
  typing: "Sto scrivendo...",
  error: (message: string) => `Ops! Qualcosa è andato storto: ${message}`,
  
  // Flusso principale
  preQuoteTitle: "Ecco una stima iniziale basata su quello che mi hai detto:",
  thankYouForDetails: "Perfetto, grazie per i dettagli. In base a queste informazioni:",
  proceed: 'Se la stima ti sembra corretta, procedi scrivendo "sì". Altrimenti, puoi aggiungere altri dettagli per affinarla.',
  askName: "Perfetto! Per procedere, avrei bisogno di qualche dato. Come ti chiami?",
  askPhone: (name: string) => `Ciao ${name}! Qual è il tuo numero di telefono? Mi serve per poterti contattare.`,
  askAddress: "Grazie. Mi serve l'indirizzo completo per l'intervento (Via, numero civico e città).",
  askTimeslot: 'Ottimo, quasi fatto! Hai preferenze di orario? (es. "domani mattina", "oggi pomeriggio dopo le 17", "nessuna")',
  
  // Gestione del "no" e dei dettagli aggiuntivi
  reprompt: "Nessun problema. Per poterti aiutare meglio, prova a darmi qualche dettaglio in più sul lavoro da fare.",

  // Conferma e invio
  recapTitle: "Fantastico! Ecco il riepilogo della tua richiesta:",
  sent: (ticketId: string) => `✅ Richiesta inviata con successo! Il tuo codice di riferimento è **${ticketId}**. Un nostro tecnico ti contatterà al più presto per confermare l'appuntamento.`,
  errorSend: 'Ops, qualcosa è andato storto nell’invio finale. Riprova a confermare.',
  
  // Specialista
  specialistIntro: (category: string = "questo tipo di lavoro") => `Capito. Per ${category}, è necessario un sopralluogo e un preventivo su misura da parte di un nostro specialista. È gratuito e senza impegno. Se vuoi procedere e farti contattare, scrivi 'sì'.`,

  // Validazione
  validationError: (step: string) => {
    const messages: Record<string, string> = {
        name: "Per favore, inserisci un nome valido.",
        phone: "Sembra che il numero di telefono non sia corretto. Potresti ricontrollare?",
        address: "Per favore, inserisci un indirizzo più completo."
    };
    return messages[step] || "L'informazione non sembra corretta, potresti riprovare?";
  },

  // Fallback (quando non capisce)
  fallbackResponses: [
    "Non sono sicuro di aver capito, potresti descrivere meglio il problema? Ad esempio: \"c'è una perdita sotto il lavandino della cucina\".",
    "Mi dispiace, non sono programmato per questo. Posso aiutarti con problemi pratici come perdite d'acqua, problemi elettrici o montaggio mobili.",
    "Mmmh, questo esula dalle mie competenze. Prova a descrivere un problema domestico e vedrai che saprò come aiutarti!",
  ],
};

// Funzione per ottenere una risposta di fallback a rotazione
let fallbackIndex = 0;
export const getFallbackResponse = (): string => {
    const response = chatCopy.fallbackResponses[fallbackIndex];
    fallbackIndex = (fallbackIndex + 1) % chatCopy.fallbackResponses.length;
    return response;
};

// Funzione per formattare la stima
export function decorateEstimates(parts: AiResult): string {
  const items: string[] = [];
  if (parts.category) items.push(`Servizio: ${parts.category}`);
  if (parts.urgency)  items.push(`Urgenza: ${parts.urgency}`);
  if (typeof parts.price_low === 'number' && typeof parts.price_high === 'number') {
    items.push(`Stima: ~${parts.price_low}–${parts.price_high}€`);
  }
  if (typeof parts.est_minutes === 'number') items.push(`Tempo stimato: ~${parts.est_minutes} min`);
  
  const core = items.join('\n');
  return `${core}\n\n(La stima include uscita e manodopera. Il prezzo finale verrà confermato dal tecnico prima dell'intervento).`;
}