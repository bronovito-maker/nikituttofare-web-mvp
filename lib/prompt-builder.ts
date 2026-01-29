// lib/prompt-builder.ts
import { Tenant } from './types';
import type { CustomerPersonalization } from './customer-personalization';

export async function getAssistantConfig(tenantId: string | number): Promise<Tenant | null> {
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

export type BuildPromptOptions = {
  customerProfile?: CustomerPersonalization | null;
};

// --- Prompt Section Builders --- 

const buildBasePrompt = (config: Tenant): string => {
  let prompt = config.system_prompt || 'Sei un assistente per un ristorante. Il tuo obiettivo è aiutare i clienti a prenotare un tavolo e rispondere alle loro domande.';
  const tone = config.ai_tone?.trim().toLowerCase();
  if (tone === 'amichevole') prompt += '\nParla con un tono amichevole e informale.';
  else if (tone === 'formale') prompt += '\nParla con un tono formale e professionale.';
  else if (tone === 'professionale') prompt += '\nMantieni un tono professionale, rassicurante e preciso.';
  return prompt;
};

const buildCoreRules = (now: string): string => `
### Contesto Attuale e Regole Obbligatorie ###
- Data e ora correnti (Fuso Orario Roma): ${now}.
- Non accettare MAI prenotazioni per date o orari già passati.
- Rispondi sempre e solo in Italiano.
- Sii sempre cortese e professionale.
- Non inventare informazioni non presenti in questo prompt. Se non sai qualcosa, dillo.`;

const buildBookingRules = (): string => `
### Prenotazioni — Slot Flessibili ###
- Slot obbligatori: (1) Nome e cognome, (2) Numero di telefono, (3) Data, (4) Orario, (5) Numero di persone, (6) Note/allergie.
- Se le info sono vaghe (es. “stasera”), chiedi di specificare con giorno e orario esatto.
- Quando hai tutti i dati, genera un riepilogo e attendi la conferma esplicita del cliente.
- Se il cliente chiede di modificare, aggiorna lo slot, comunica la variazione e ricapitola.`;

function formatLastBooking(lastBooking: CustomerPersonalization['lastBooking']): string {
  if (!lastBooking?.bookingDateTime) return '';

  const lastDate = new Date(lastBooking.bookingDateTime);
  if (Number.isNaN(lastDate.getTime())) return '';

  return `- Ultima prenotazione: ${lastDate.toLocaleDateString('it-IT')} alle ${lastDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} per ${lastBooking.partySize ?? '?'} persone.`;
}

function buildProfileHints(profile: CustomerPersonalization): string {
  const hints: string[] = [];
  if (profile.favoritePartySize) hints.push(`Numero persone più frequente: ${profile.favoritePartySize}.`);
  if (profile.preferredTimes?.length) hints.push(`Orari preferiti: ${profile.preferredTimes.join(', ')}.`);
  if (profile.lastBooking?.notes) hints.push(`Ultime note: ${profile.lastBooking.notes}.`);

  return hints.length ? `- Insight: ${hints.join(' ')}` : '';
}

const buildCustomerProfileSection = (profile?: CustomerPersonalization | null): string => {
  if (!profile) return '';

  const { fullName, phoneNumber, totalBookings, lastBooking } = profile;
  const parts: string[] = ['\n\n### Dati Cliente Autenticato ###'];

  if (fullName) parts.push(`- Nome riconosciuto: ${fullName}.`);
  if (phoneNumber) parts.push(`- Telefono in archivio: ${phoneNumber}.`);

  const lastBookingInfo = formatLastBooking(lastBooking);
  if (lastBookingInfo) parts.push(lastBookingInfo);

  parts.push(`- Prenotazioni totali: ${totalBookings}.`);

  const hints = buildProfileHints(profile);
  if (hints) parts.push(hints);

  parts.push(`- Usa questi dati per accogliere il cliente in modo proattivo, ma chiedi SEMPRE conferma esplicita.`);

  return parts.join('\n');
};

const buildRestaurantInfo = (config: Tenant): string => {
  const parts = ['\n\n### Informazioni Chiave sul Ristorante ###', `- Nome Attività: ${config.name}`];
  if (config.phone_number) parts.push(`- Telefono per contatti: ${config.phone_number}`);
  if (config.address) parts.push(`- Indirizzo: ${config.address}`);
  if (config.notification_email) parts.push(`- Email per notifiche: ${config.notification_email}`);
  return parts.join('\n');
};

const buildOpeningHours = (config: Tenant): string => {
  if (!config.opening_hours_json) return '';
  try {
    const orari = JSON.parse(config.opening_hours_json);
    const orariFormattati = Object.entries(orari).map(([giorno, orario]) => `- ${giorno}: ${orario}`).join('\n');
    return `\n\n### Orari di Apertura ###\n${orariFormattati}`;
  } catch {
    return `\n\n### Orari di Apertura ###\n${config.opening_hours_json}`;
  }
};

const buildMenuInfo = (config: Tenant): string => {
  const parts: string[] = [];
  if (config.menu_text) {
    parts.push(`\n\n### MENU DEL RISTORANTE ###\n${config.menu_text}\n### FINE MENU ###`);
    parts.push(
      `Istruzioni sul menu:`,
      `1. Usa *solo* il menu qui sopra per rispondere.`,
      `2. Sii proattivo: se un utente chiede consigli, suggerisci 1-2 piatti basandoti sulla tua analisi.`
    );
  }
  if (config.menu_pdf_url) {
    parts.push(`\n\nSe il cliente desidera il menu completo, fornisci questo link: ${config.menu_pdf_url}`);
  }
  return parts.join('\n');
};

/**
 * Costruisce il System Prompt finale da inviare all'LLM.
 */
export async function buildSystemPrompt(
  tenantId: string | number,
  options: BuildPromptOptions = {}
): Promise<string> {
  const config = await getAssistantConfig(tenantId);
  const now = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'full', timeStyle: 'short' });

  if (!config) {
    console.warn(`Configurazione non trovata per tenant ${tenantId}, uso prompt di default.`);
    return `Sei un assistente virtuale. Sii gentile e disponibile.\n\n### Contesto Attuale ###\n- Data e ora correnti (Fuso Orario Roma): ${now}.\n- Non accettare MAI prenotazioni per date o orari già passati.`;
  }

  const promptParts = [
    buildBasePrompt(config),
    buildCoreRules(now),
    buildBookingRules(),
    buildCustomerProfileSection(options.customerProfile),
    buildRestaurantInfo(config),
    buildOpeningHours(config),
    config.extra_info ? `\n\n### Informazioni Aggiuntive e Policy ###\n${config.extra_info}` : '',
    buildMenuInfo(config),
  ];

  return promptParts.filter(Boolean).join('');
}