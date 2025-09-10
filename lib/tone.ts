export type Tone = 'standard' | 'premium' | 'friendly';

export function getTone(): Tone {
  const t = (process.env.NTF_TONE || 'premium').toLowerCase(); // default premium
  if (t === 'premium' || t === 'friendly' || t === 'standard') return t as Tone;
  return 'premium';
}

export function useEmoji(): boolean {
  return (process.env.NTF_EMOJI_HINTS || 'true').toLowerCase() === 'true';
}

export function copy(tone: Tone) {
  const base = {
    // Entrata + fiducia
    greet:
      'Ciao! Sono Niki Tuttofare. Raccontami in una frase cosa succede e dove: ti preparo una stima chiara e ti mando il tecnico giusto.',
    trustBadges: ['Tecnici verificati', 'Prezzi chiari', 'Nessun costo nascosto', 'Garanzia soddisfatti'],
    coverageChips: ['Livorno', 'Provincia', 'Fino a 30 km'],

    // Flow
    askMore: 'Mi dai un paio di dettagli in più? Così preparo una stima precisa e trasparente.',
    preQuoteTitle: 'Ecco una stima iniziale basata su quello che mi hai detto:',
    pricePolicy: 'Il prezzo definitivo viene confermato prima dell’intervento. Stima include uscita + 60 min di lavoro.',
    proceed: 'Se ti va bene, procediamo con i dati per ricontattarti e bloccare il tecnico (scrivi "sì" oppure aggiungi dettagli).',

    // Dati
    askName: 'Ottimo! Come ti chiami?',
    askPhone: 'Grazie. Qual è il numero su cui possiamo aggiornarti?',
    askEmail: 'Se vuoi, lasciami anche un’email (opzionale). Scrivi "no" per saltare.',
    askCity: 'In che città ci troviamo?',
    askAddress: 'Perfetto. Mi lasci l’indirizzo completo?',
    askTimeslot: 'Hai una fascia oraria preferita per l’intervento? (es. oggi 18–20, oppure "no")',
    recapTitle: 'Riepilogo (puoi ancora modificare):',

    // CTA & copy premium
    confirmCTA: 'Conferma e avvisa i tecnici',
    responseSLA: 'Tempo medio di risposta: 12–20 min',
    confirm: 'Confermi l’invio per avvisare subito i tecnici disponibili? (sì/no)',
    sent: 'Richiesta inviata. Ti aggiorniamo a breve con il primo tecnico disponibile.',
    errorSend: 'Ops, qualcosa non ha funzionato nell’invio. Riprova tra poco.',

    // Messaggi cortesia
    greetRich: '👋 Ciao! Siamo qui per prenderti per mano e risolvere il tuo problema senza pensieri. Scrivimi cosa succede e dove.',

    // Quick replies
    quickProblem: ['Perdita lavandino', 'Scintille presa', 'Serratura bloccata', 'Montaggio mensola'],
    quickUrgency: ['Oggi', 'Domani mattina', 'Fascia 18–20'],

    // Volgarità / redirez
    nudgePolite: 'Capisco, vediamo di risolvere subito 😊 È in cucina o in bagno?'
  };

  if (tone === 'premium') {
    return {
      ...base,
      greet:
        'Benvenuto da Niki Tuttofare. Raccontami in una frase cosa succede e dove: preparo una stima chiara e coordino il tecnico più adatto con priorità.',
    };
  }

  if (tone === 'friendly') {
    return {
      ...base,
      greet:
        'Ciao! 👋 Sono Niki. Dimmi cosa succede e dove (tipo: “perde il lavandino in bagno”) e ti preparo una stima al volo.',
      proceed:
        'Ti torna? Allora lasciami i dati così blocchiamo subito il tecnico 👍',
      sent:
        'Grande! ✅ Avvisati i tecnici: ti scrivo appena uno accetta.'
    };
  }

  return base;
}

export function decorateEstimates(
  tone: Tone,
  withEmoji: boolean,
  parts: { category?:string; urgency?:string; feasible?:boolean; price?:number; price_low?:number; price_high?:number; est_minutes?:number; },
  addPolicy = true
) {
  const items: string[] = [];
  const E = (e:string) => withEmoji ? e+' ' : '';

  if (parts.category) items.push(`${E('🏷️')}Servizio: ${parts.category}`);
  if (parts.urgency)  items.push(`${E('⚡')}Urgenza: ${parts.urgency}`);
  if (typeof parts.feasible === 'boolean') items.push(`Fattibilità: ${parts.feasible ? 'Sì' : 'Da valutare'}`);

  if (typeof parts.price_low === 'number' && typeof parts.price_high === 'number') {
    items.push(`${E('💶')}Stima: ~${parts.price_low}–${parts.price_high}€`);
  } else if (typeof parts.price === 'number') {
    items.push(`${E('💶')}Stima: ~${parts.price}€`);
  }

  if (typeof parts.est_minutes === 'number') items.push(`${E('⏱️')}Tempo stimato: ${parts.est_minutes} min`);

  const core = items.join(' • ');
  return addPolicy ? `${core}\nStima iniziale — ti confermiamo il totale prima dell’intervento.` : core;
}