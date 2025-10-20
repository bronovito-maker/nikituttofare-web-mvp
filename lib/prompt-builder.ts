// lib/prompt-builder.ts
import { Tenant } from './types';
// Importa i nostri NUOVI helper e ID
import { readTableRowById } from './noco-helpers';
import { NC_TABLE_TENANTS_ID } from './noco-ids';

/**
 * Recupera la configurazione del tenant (ristorante) specifica.
 * @param tenantId L'ID del tenant (dalla sessione utente)
 * @returns Un oggetto Tenant o null se non trovato.
 */
export async function getAssistantConfig(
  tenantId: string | number
): Promise<Tenant | null> {
  // Validazione input
  if (!tenantId) {
    console.error('getAssistantConfig: tenantId nullo o non definito.');
    return null;
  }

  // VALIDAZIONE ID STELLA POLARE
  if (!NC_TABLE_TENANTS_ID) {
    console.error('getAssistantConfig: ID Tabella Tenants non definito in noco-ids.ts');
    return null;
  }

  try {
    // Usa il NUOVO helper con gli ID centralizzati
    const config = await readTableRowById(
      NC_TABLE_TENANTS_ID,
      Number(tenantId) // Assicura che sia un numero
    );
    
    if (!config || !(config as Tenant).Id) {
        console.warn(`getAssistantConfig: Nessuna configurazione trovata per tenantId ${tenantId}`);
        return null;
    }

    return config as Tenant;

  } catch (error) {
    console.error(`Errore nel recupero della configurazione per il tenant ${tenantId}:`, error);
    return null;
  }
}

/**
 * Costruisce il System Prompt finale da inviare all'LLM.
 * @param tenantId L'ID del tenant (dalla sessione utente)
 * @returns Una stringa contenente il prompt di sistema completo.
 */
export async function buildSystemPrompt(
  tenantId: string | number
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
  let prompt = config.system_prompt || 'Sei un assistente per un ristorante. Il tuo obiettivo è aiutare i clienti a prenotare un tavolo e rispondere alle loro domande.';
  
  // --- Aggiungi Contesto Chiave ---
  prompt += `\n\n### Contesto Attuale e Regole Obbligatorie ###`;
  prompt += `\n- Data e ora correnti (Fuso Orario Roma): ${now}.`;
  prompt += `\n- Non accettare MAI prenotazioni per date o orari già passati rispetto a questo momento.`;
  prompt += `\n- Rispondi sempre e solo in Italiano.`;
  prompt += `\n- Sii sempre cortese e professionale.`;
  prompt += `\n- Non inventare informazioni non presenti in questo prompt. Se non sai qualcosa, dillo.`;

  // --- Flusso Prenotazione Guidato ---
  prompt += `\n\n### Flusso Prenotazione — Segui SEMPRE questi 7 passaggi nell'ordine indicato ###`;
  prompt += `\n1. Chiedi e conferma il NOME del cliente (richiedi anche eventuale cognome).`;
  prompt += `\n2. Chiedi e conferma il NUMERO DI TELEFONO (formato italiano preferito, senza spazi).`;
  prompt += `\n3. Chiedi e conferma la DATA della prenotazione (gg/mm/aaaa o riferimenti come oggi/domani).`;
  prompt += `\n4. Chiedi e conferma l'ORARIO (24h, es. 20:30).`;
  prompt += `\n5. Chiedi e conferma il NUMERO DI PERSONE (>=1).`;
  prompt += `\n6. Chiedi ALLERGENI o RICHIESTE PARTICOLARI (animali, seggiolone, eventi speciali). Se non ci sono, fai indicare “Nessuna richiesta”.`;
  prompt += `\n7. Fornisci un RIEPILOGO puntuale dei punti 1-6 e chiedi al cliente di premere il pulsante “Conferma prenotazione” nell'interfaccia.`;
  prompt += `\n- NON saltare o accorciare passaggi: se il cliente dà più informazioni in un messaggio, conferma quelle disponibili e chiedi esplicitamente ciò che manca.`;
  prompt += `\n- Se il cliente prova a confermare senza tutti i dati, ricorda gentilmente quali elementi mancano.`;
  prompt += `\n- Dopo il riepilogo attendi SEMPRE la conferma esplicita del cliente. Non inviare la prenotazione a sistema finché la conferma non arriva.`;
  prompt += `\n- Mantieni tono professionale, caloroso e conciso; evita risposte prolisse o fuori tema.`;
  prompt += `\n- Se l'utente chiede di modificare un dato già raccolto, torna al relativo punto, aggiorna il riepilogo e richiedi di nuovo conferma.`;

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
  
  // 5. (Fase Futura) Aggiungi il menu
  // Qui potremmo caricare le tabelle 'menus' e 'menu_items' e aggiungerle al prompt
  // prompt += `\n\n### Menu ###\n...`;

  // console.log(`Prompt costruito per tenant ${tenantId}:`, prompt); // Utile per debug
  return prompt;
}
