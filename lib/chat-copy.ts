// lib/chat-copy.ts

export const chatCopy = {
  // Messaggi di stato
  typing: "Sto scrivendo...",
  error: (message: string) => `Ops! Qualcosa è andato storto: ${message}`,
  requestCancelled: "Richiesta annullata. Se hai bisogno di altro, sono qui!",
  
  // Flusso principale
  clarification: (category: string, question: string) => `Ok, ho capito, sembra un problema da ${category}. ${question}`,
  estimateIntro: "Se la stima ti sembra corretta, procedi scrivendo \"sì\". Altrimenti, puoi aggiungere altri dettagli.",
  askForName: "Perfetto! Per procedere, avrei bisogno di qualche dato. Come ti chiami?",
  askForPhone: "Grazie. Qual è il tuo numero di telefono? Mi serve per poterti contattare.",
  askForEmail: 'Perfetto. E la tua email? (opzionale, scrivi "no" per saltare)',
  askForCity: "In che città ti trovi?",
  askForAddress: "Ottimo. Mi serve l'indirizzo completo per l'intervento.",
  askForTimeslot: 'Hai preferenze di orario? (es. "domani mattina", "oggi pomeriggio dopo le 17", "nessuna")',
  
  // Gestione del "no" e dei dettagli aggiuntivi
  reconfirmAfterDetails: "Ok, ho aggiunto i dettagli. La stima rimane la stessa per ora. Confermi di voler procedere?",
  askForFeedbackOnNo: "Capito. C'è qualcosa che vorresti modificare o chiarire nella stima? Puoi descrivere meglio il lavoro o farmi altre domande.",

  // Conferma e invio
  updateForOutOfZone: (fee: number) => `Ho aggiornato la stima includendo il supplemento di ${fee}€ per la trasferta fuori Livorno. Ora inserisci l'indirizzo completo per l'intervento.`,
  requestSent: (ticketId: string) => `Richiesta inviata con successo! (ID: <b>${ticketId}</b>)<br/>Un nostro specialista ti contatterà a breve per definire i dettagli e fornirti un preventivo preciso.`,
  
  // Fallback (quando non capisce)
  fallbackResponses: [
    "Non sono sicuro di aver capito, potresti descrivere meglio il problema? Ad esempio: \"c'è una perdita sotto il lavandino della cucina\".",
    "Mi dispiace, non sono programmato per questo. Posso aiutarti con problemi pratici come perdite d'acqua, problemi elettrici o montaggio mobili.",
    "Mmmh, questo esula dalle mie competenze. Prova a descrivere un problema domestico e vedrai che saprò come aiutarti!",
  ],

  // --- RIGHE MANCANTI AGGIUNTE QUI ---
  specialistIntro: "Grazie per le informazioni. Per questo tipo di intervento è necessario un preventivo dettagliato e gratuito da parte di un nostro specialista.",
  specialistProceed: "Se vuoi procedere e farti contattare, lasciami i tuoi dati. Scrivi 'sì' per continuare."
};

// Funzione per ottenere una risposta di fallback a rotazione
let fallbackIndex = 0;
export const getFallbackResponse = () => {
    const response = chatCopy.fallbackResponses[fallbackIndex];
    fallbackIndex = (fallbackIndex + 1) % chatCopy.fallbackResponses.length;
    return response;
};