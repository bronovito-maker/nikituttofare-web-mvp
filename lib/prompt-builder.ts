// lib/prompt-builder.ts
import { noco } from './noco';
import { Tenant } from './types'; // Importa il nostro nuovo tipo 'Tenant'
import { lib as nocoLib } from 'nocodb-sdk';

// Recupera le variabili d'ambiente per la tabella TENANTS
const NC_TABLE_TENANTS = process.env.NOCO_TABLE_TENANTS!;
const NC_VIEW_TENANTS = process.env.NOCO_VIEW_TENANTS!;

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
  if (!NC_TABLE_TENANTS || !NC_VIEW_TENANTS) {
    console.error('getAssistantConfig: Variabili d\'ambiente tabelle Tenants non definite.');
    return null;
  }

  try {
    // NocoDB usa l'ID della riga per 'read'. Il tenantId della sessione
    // corrisponde esattamente all'ID della riga nella tabella 'tenants'.
    const config = await noco.dbViewRow.read(
      NC_TABLE_TENANTS,
      NC_VIEW_TENANTS,
      Number(tenantId) // Assicura che sia un numero
    );
    
    // Controlla se abbiamo ricevuto una risposta valida
    if (!config || !config.Id) {
        console.warn(`getAssistantConfig: Nessuna configurazione trovata per tenantId ${tenantId}`);
        return null;
    }

    // Esegui il cast al nostro tipo Tenant per sicurezza e autocompletamento
    // I nomi dei campi (es. 'system_prompt') dovrebbero già corrispondere
    // a quelli definiti nel tipo Tenant e nella tabella NocoDB.
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

  // Fallback di sicurezza: se la configurazione non esiste, usa un prompt generico
  if (!config) {
    console.warn(`Configurazione non trovata per il tenant ${tenantId}, uso prompt di default.`);
    return 'Sei un assistente virtuale. Sii gentile e disponibile.';
  }

  // Costruisci il prompt usando i campi della tabella 'tenants'
  
  // 1. Inizia con il prompt di sistema base (le istruzioni principali)
  let prompt = config.system_prompt || 'Sei un assistente per un ristorante. Il tuo obiettivo è aiutare i clienti a prenotare un tavolo e rispondere alle loro domande.';
  
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

  prompt += `\n\n### Regole Finali ###\n- Rispondi sempre e solo in Italiano.`;
  prompt += `\n- Sii sempre cortese e professionale.`;
  prompt += `\n- Non inventare informazioni non presenti in questo prompt. Se non sai qualcosa, dillo.`;

  // console.log(`Prompt costruito per tenant ${tenantId}:`, prompt); // Utile per debug
  return prompt;
}
