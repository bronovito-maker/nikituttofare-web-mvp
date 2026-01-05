// lib/prompt-builder.ts
import { Tenant } from './types';
// Importa i nostri NUOVI helper e ID
// import { readTableRowById } from './noco-helpers';
// import { NC_TABLE_TENANTS_ID } from './noco-ids';
import type { CustomerPersonalization } from './customer-personalization';

/**
 * Recupera la configurazione del tenant (ristorante) specifica.
 * @param tenantId L'ID del tenant (dalla sessione utente)
 * @returns Un oggetto Tenant o null se non trovato.
 */
export async function getAssistantConfig(
  tenantId: string | number
): Promise<Tenant | null> {
  // TODO: Replace this with Supabase logic
  if (!tenantId) {
    console.error('getAssistantConfig: tenantId nullo o non definito.');
    return null;
  }
  
  const mockTenant: Tenant = {
    Id: 1,
    name: 'Niki Restaurant (Mock)',
    phone_number: '1234567890',
    address: 'Via Codice, 1, 00100 Roma',
    opening_hours_json: '{"lun": "10-14, 18-22", "mar": "10-14, 18-22", "mer": "10-14, 18-22", "gio": "10-14, 18-22", "ven": "10-14, 18-24", "sab": "18-24", "dom": "chiuso"}',
    system_prompt: 'Sei un assistente per un ristorante. Il tuo obiettivo è aiutare i clienti a prenotare un tavolo e rispondere alle loro domande.',
    extra_info: 'Il parcheggio è disponibile in strada.',
    notification_email: 'test@example.com',
    menu_pdf_url: 'https://example.com/menu.pdf',
    menu_text: 'Carbonara, Amatriciana, Gricia',
    ai_tone: 'amichevole',
    widget_color: '#ff0000',
  };

  return mockTenant;
}

/**
 * Costruisce il System Prompt finale da inviare all'LLM.
 * @param tenantId L'ID del tenant (dalla sessione utente)
 * @returns Una stringa contenente il prompt di sistema completo.
 */
export type BuildPromptOptions = {
  customerProfile?: CustomerPersonalization | null;
};

export async function buildSystemPrompt(
  tenantId: string | number,
  options: BuildPromptOptions = {}
): Promise<string> {
  const config = await getAssistantConfig(tenantId);

  // --- GESTIONE FUSO ORARIO ROMA ---
  const now = new Date().toLocaleString('it-IT', {
    timeZone: 'Europe/Rome',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  // Fallback di sicurezza: se la configurazione non esiste, usa un prompt generico
  if (!config) {
    console.warn(`Configurazione non trovata per il tenant ${tenantId}, uso prompt di default.`);
    let fallbackPrompt = 'Sei un assistente virtuale. Sii gentile e disponibile.';
    fallbackPrompt += `\n\n### Contesto Attuale ###`;
    fallbackPrompt += `\n- Data e ora correnti (Fuso Orario Roma): ${now}.`;
    fallbackPrompt += `\n- Non accettare MAI prenotazioni per date o orari già passati.`;
    return fallbackPrompt;
  }

  // Costruisci il prompt usando i campi della tabella 'tenants'
  
  // 1. Inizia con il prompt di sistema base (le istruzioni principali)
  let prompt =
    config.system_prompt ||
    'Sei un assistente per un ristorante. Il tuo obiettivo è aiutare i clienti a prenotare un tavolo e rispondere alle loro domande.';

  const tone = config.ai_tone?.trim().toLowerCase();
  if (tone === 'amichevole') {
    prompt += '\nParla con un tono amichevole e informale.';
  } else if (tone === 'formale') {
    prompt += '\nParla con un tono formale e professionale.';
  } else if (tone === 'professionale') {
    prompt += '\nMantieni un tono professionale, rassicurante e preciso.';
  }
  
  // --- Aggiungi Contesto Chiave ---
  prompt += `\n\n### Contesto Attuale e Regole Obbligatorie ###`;
  prompt += `\n- Data e ora correnti (Fuso Orario Roma): ${now}.`;
  prompt += `\n- Non accettare MAI prenotazioni per date o orari già passati rispetto a questo momento.`;
  prompt += `\n- Rispondi sempre e solo in Italiano.`;
  prompt += `\n- Sii sempre cortese e professionale.`;
  prompt += `\n- Non inventare informazioni non presenti in questo prompt. Se non sai qualcosa, dillo.`;

  // --- Gestione Prenotazioni con Slot Flessibili ---
  prompt += `\n\n### Prenotazioni — Slot Flessibili ###`;
  prompt += `\n- Slot obbligatori da raccogliere: (1) Nome e cognome, (2) Numero di telefono, (3) Data della prenotazione, (4) Orario richiesto, (5) Numero di persone, (6) Note su allergie o richieste particolari (includi “Nessuna richiesta” se dichiarato).`;
  prompt += `\n- Analizza ogni messaggio dell'utente per estrarre nuovi dati e aggiorna gli slot già compilati quando ricevi correzioni.`;
  prompt += `\n- Se il cliente fornisce più informazioni insieme, conferma quelle comprese e chiedi soltanto ciò che manca.`;
  prompt += `\n- Quando le informazioni sono vaghe (es. “stasera”, “verso le 21”, “dopo cena”), chiedi subito di specificare con giorno e orario esatto prima di segnare lo slot come completo.`;
  prompt += `\n- Se l'utente conferma un dato che hai già registrato in modo preciso e non ambiguo, rispondi con un breve riscontro (es. “Perfetto!”, “Ricevuto.”) senza ripetere l'intero riepilogo; se tutti gli slot sono completi ricorda di premere “Conferma prenotazione”.`;
  prompt += `\n- Quando mancano ancora dati, formula domande mirate solo sugli slot incompleti e ricorda sinteticamente quali elementi sono ancora necessari.`;
  prompt += `\n- Se il cliente prova a confermare la prenotazione senza tutti i dati obbligatori, spiega con gentilezza quali slot sono ancora vuoti.`;
  prompt += `\n- Una volta che tutti gli slot sono completi genera un riepilogo puntuale (nome, telefono, data, ora, persone, note) e invita l'utente a premere il pulsante “Conferma prenotazione” nell'interfaccia.`;
  prompt += `\n- Dopo il riepilogo attendi SEMPRE la conferma esplicita del cliente prima di considerare la prenotazione inviata a sistema.`;
  prompt += `\n- Se l'utente chiede di modificare un'informazione già raccolta, aggiorna lo slot corrispondente, comunica la variazione, conferma il dato aggiornato e ricapitola brevemente gli altri valori rilevanti.`;
  prompt += `\n- Mantieni tono professionale, caloroso e conciso; evita risposte prolisse o fuori tema.`;

  const profile = options.customerProfile;
  if (profile) {
    const customerName = profile.fullName?.trim();
    const phone = profile.phoneNumber?.trim();

    const lastBookingDate = profile.lastBooking?.bookingDateTime
      ? new Date(profile.lastBooking.bookingDateTime)
      : null;
    const lastBookingDateDisplay =
      lastBookingDate && !Number.isNaN(lastBookingDate.getTime())
        ? lastBookingDate.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : null;
    const lastBookingTimeDisplay =
      lastBookingDate && !Number.isNaN(lastBookingDate.getTime())
        ? lastBookingDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        : null;

    const hints: string[] = [];
    if (profile.favoritePartySize && profile.favoritePartySize > 0) {
      hints.push(`Numero di persone più frequente: ${profile.favoritePartySize} ospiti.`);
    }
    if (profile.preferredTimes && profile.preferredTimes.length > 0) {
      hints.push(`Orari preferiti rilevati: ${profile.preferredTimes.join(', ')}.`);
    }
    if (profile.lastBooking?.notes) {
      hints.push(`Ultime note/allergie annotate: ${profile.lastBooking.notes}.`);
    }

    prompt += `\n\n### Dati Cliente Autenticato ###`;
    if (customerName) {
      prompt += `\n- Nome riconosciuto: ${customerName}.`;
    }
    if (phone) {
      prompt += `\n- Telefono in archivio: ${phone}.`;
    }
    if (profile.lastBooking) {
      prompt += `\n- Ultima prenotazione registrata: ${
        lastBookingDateDisplay ?? 'data sconosciuta'
      } alle ${lastBookingTimeDisplay ?? 'orario non indicato'} per ${
        profile.lastBooking.partySize ?? 'numero persone non indicato'
      } persone.`;
    }
    prompt += `\n- Prenotazioni totali registrate: ${profile.totalBookings}.`;
    if (hints.length > 0) {
      prompt += `\n- Insight storici: ${hints.join(' ')}`;
    }
    prompt += `\n- Usa questi dati per accogliere il cliente in modo proattivo (es. “Ciao ${
      customerName ?? 'di nuovo'
    }! Vuoi confermare per ${
      profile.favoritePartySize ?? profile.lastBooking?.partySize ?? 'lo stesso numero di persone'
    } alle ${profile.preferredTimes?.[0] ?? lastBookingTimeDisplay ?? 'un orario simile'}?”), ma chiedi SEMPRE conferma esplicita prima di procedere e aggiorna gli slot se il cliente desidera variazioni.`;
  }

  // 2. Aggiungi sezioni strutturate per le informazioni chiave
  prompt += `\n\n### Informazioni Chiave sul Ristorante ###`;
  prompt += `\n- Nome Attività: ${config.name}`;
  
  if (config.phone_number) {
    prompt += `\n- Telefono per contatti: ${config.phone_number}`;
  }
  if (config.address) {
    prompt += `\n- Indirizzo: ${config.address}`;
  }
  if (config.notification_email) {
    prompt += `\n- Email per notifiche: ${config.notification_email}`;
  }

  // 3. Aggiungi gli orari di apertura, formattandoli se sono in JSON
  if (config.opening_hours_json) {
    prompt += `\n\n### Orari di Apertura ###`;
    try {
      // Prova a parsare il JSON per una formattazione pulita
      const orari = JSON.parse(config.opening_hours_json);
      // Trasforma l'oggetto JSON in una stringa leggibile (es. "lun: 10-14, 18-22")
      const orariFormattati = Object.entries(orari)
        .map(([giorno, orario]) => `- ${giorno}: ${orario}`)
        .join('\n');
      prompt += `\n${orariFormattati}`;
    } catch (e) {
      // Se non è JSON valido, inseriscilo come stringa semplice
      prompt += `\n${config.opening_hours_json}`;
    }
  }
  
  // 4. Aggiungi le informazioni extra (es. policy, info su parcheggio, ecc.)
  if (config.extra_info) {
    prompt += `\n\n### Informazioni Aggiuntive e Policy ###\n${config.extra_info}`;
  }

  if (config.menu_text) {
    prompt += `\n\n### MENU DEL RISTORANTE ###\n${config.menu_text}\n### FINE MENU ###`;
    prompt += `\nIstruzioni sul menu:`;
    prompt += `\n1. Usa *solo* il menu qui sopra per rispondere alle domande sui piatti.`;
    prompt += `\n2. Analizza il menu: se noti sezioni speciali (es. "Specialità dello Chef", "I nostri classici") o piatti che sembrano particolarmente interessanti, memorizzali.`;
    prompt += `\n3. Sii proattivo: se un utente chiede "cosa consigliate?" o "avete dei piatti forti?", suggerisci 1-2 piatti basandoti sulla tua analisi (es. "Il nostro Chef consiglia la Carbonara, è una specialità della casa!").`;
  }

  if (config.menu_pdf_url) {
    prompt += `\n\nSe il cliente desidera consultare il menu completo, fornisci gentilmente questo link al PDF ufficiale: ${config.menu_pdf_url}`;
  }
  
  // 5. (Fase Futura) Aggiungi il menu
  // Qui potremmo caricare le tabelle 'menus' e 'menu_items' e aggiungerle al prompt
  // prompt += `\n\n### Menu ###\n...`;

  // console.log(`Prompt costruito per tenant ${tenantId}:`, prompt); // Utile per debug
  return prompt;
}
