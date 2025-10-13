import { LeadSnapshot } from './chat-parser';

const DEFAULT_TONE = 'professionale, cordiale e chiaro';

const SECTOR_RULES: Record<string, { required: string[]; guidance: string[] }> = {
  restaurant: {
    required: ['nome', 'telefono', 'persone', 'orario'],
    guidance: [
      'Chiedi eventuali allergie/intolleranze o richieste speciali.',
      'Ricorda le politiche sugli animali se vengono menzionati.',
    ],
  },
  shop: {
    required: ['nome', 'telefono'],
    guidance: [
      'Raccogli dettagli sul prodotto o servizio richiesto.',
      'Chiedi se desiderano ritiro in negozio o consegna.',
    ],
  },
  mechanic: {
    required: ['nome', 'telefono', 'orario'],
    guidance: [
      'Chiedi modello/targa del veicolo e descrizione del problema.',
      'Se l’intervento è urgente, proponi il primo slot disponibile.',
    ],
  },
  medical: {
    required: ['nome', 'telefono', 'orario'],
    guidance: [
      'Chiedi il motivo della visita e se c’è un medico preferito.',
      'Indica chiaramente che le urgenze gravi richiedono il 118.',
    ],
  },
};

const formatCollectedData = (snapshot?: LeadSnapshot): string => {
  if (!snapshot) return 'Nessun dato raccolto finora.';
  const lines: string[] = [];
  if (snapshot.nome) lines.push(`- Nome fornito: ${snapshot.nome}`);
  if (snapshot.telefono) lines.push(`- Telefono fornito: ${snapshot.telefono}`);
  if (snapshot.persone) lines.push(`- Numero di persone: ${snapshot.persone}`);
  if (snapshot.orario) lines.push(`- Orario desiderato: ${snapshot.orario}`);
  if (snapshot.specialNotes?.length) {
    snapshot.specialNotes.forEach((note) => lines.push(`- Nota: ${note}`));
  }
  if (!lines.length) return 'Nessun dato raccolto finora.';
  return lines.join('\n');
};

const listMissingFields = (required: string[], snapshot?: LeadSnapshot): string[] => {
  const missing: string[] = [];
  for (const field of required) {
    if (field === 'nome' && snapshot?.nome) continue;
    if (field === 'telefono' && snapshot?.telefono) continue;
    if (field === 'persone' && snapshot?.persone) continue;
    if (field === 'orario' && snapshot?.orario) continue;
    missing.push(field);
  }
  return missing;
};

export type BuildSystemPromptOptions = {
  assistant: Record<string, any>;
  leadSnapshot?: LeadSnapshot;
};

export function buildSystemPrompt({ assistant, leadSnapshot }: BuildSystemPromptOptions) {
  const basePrompt = String(assistant?.prompt_sistema || '').trim();
  const infoExtra = String(assistant?.info_extra || '').trim();
  const secondaryPrompt = String(assistant?.prompt_secondary || '').trim();
  const tone = String(assistant?.tone || DEFAULT_TONE);
  const sectorKey = String(assistant?.sector || 'generic').toLowerCase();
  const menuText = String(assistant?.menu_text || '').trim();
  const menuUrl = String(assistant?.menu_url || '').trim();
  const hasMenuText = Boolean(menuText);
  const hasMenuUrl = Boolean(menuUrl);

  let requiredFields: string[] = [];
  let additionalGuidance: string[] = [];

  try {
    if (assistant?.prompt_config) {
      const parsed = JSON.parse(assistant.prompt_config);
      if (Array.isArray(parsed?.required_fields)) {
        requiredFields = parsed.required_fields.map((field: string) => field.toLowerCase());
      }
      if (Array.isArray(parsed?.guidance)) {
        additionalGuidance = parsed.guidance;
      }
    }
  } catch (error) {
    console.warn('prompt_config non valido, uso fallback di settore:', error);
  }

  if (!requiredFields.length && SECTOR_RULES[sectorKey]) {
    requiredFields = SECTOR_RULES[sectorKey].required;
    additionalGuidance = additionalGuidance.concat(SECTOR_RULES[sectorKey].guidance);
  }

  const collectedSummary = formatCollectedData(leadSnapshot);
  const missingFields = listMissingFields(requiredFields, leadSnapshot);

  const instructions: string[] = [
    `Mantieni un tono ${tone}.`,
    'Non richiedere nuovamente dati già forniti: confermali e aggiornali se cambiano.',
    'Fai domande una alla volta e attendi la risposta prima di passare al punto successivo.',
    'Se non ricevi il telefono, chiedilo cortesemente spiegando che serve per la conferma.',
    'Quando disponi di tutte le informazioni richieste, fornisci un riepilogo puntuale e conferma che verranno inoltrate allo staff umano.',
  ];

  if (missingFields.length) {
    instructions.push(
      `Dati ancora da raccogliere: ${missingFields.map((f) => `"${f}"`).join(', ')}.`,
      'Chiedili in modo naturale, senza elencare bullet point, e adatta le domande al contesto già condiviso.'
    );
  } else {
    instructions.push('Hai già tutte le informazioni essenziali: passa subito al riepilogo e chiedi se è tutto corretto.');
  }

  if (additionalGuidance.length) {
    instructions.push(...additionalGuidance);
  }

  if (hasMenuText) {
    instructions.push(
      'Ogni volta che ti chiedono piatti o consigli, usa esclusivamente il menu testuale fornito qui sotto come fonte. Ricava 3-5 proposte pertinenti e cita le categorie originali quando possibile.'
    );
    instructions.push(
      'Se il piatto richiesto non è presente nel menu testuale, spiega che non lo trovi e proponi alternative realmente presenti.'
    );
  } else if (hasMenuUrl) {
    instructions.push(
      'Non hai un menu testuale da analizzare. Quando chiedono piatti specifici, spiega che i dettagli completi sono nel PDF linkato e invita l’utente ad aprire il pulsante "Apri menu" per consultarli. Non inventare pietanze.'
    );
  }

  if (hasMenuUrl) {
    instructions.push(
      'Ricorda che il menu completo è consultabile tramite il pulsante "Apri menu" disponibile in chat.'
    );
  }

  const systemSections = [
    basePrompt,
    instructions.join('\n'),
    `Informazioni sull’attività (dal cliente):\n${infoExtra || 'Nessuna informazione aggiuntiva fornita.'}`,
    `Dati già raccolti in questa conversazione:\n${collectedSummary}`,
  ];

  if (hasMenuText) {
    systemSections.push(`Menu / listino fornito dal cliente:\n${menuText}`);
  }

  if (hasMenuUrl) {
    systemSections.push(`Link al menu/listino (fornisci al cliente se richiesto): ${menuUrl}`);
  }

  if (secondaryPrompt) {
    systemSections.push(secondaryPrompt);
  }

  return systemSections.filter(Boolean).join('\n\n');
}
