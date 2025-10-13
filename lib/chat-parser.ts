export type LeadIntent = 'booking' | 'info' | 'unknown';

export type LeadDraft = {
  nome?: string;
  telefono?: string;
  persone?: number;
  orario?: string;
  intent: LeadIntent;
  specialNotes: string[];
};

export type LeadSnapshot = {
  nome?: string;
  telefono?: string;
  persone?: number;
  orario?: string;
  intent?: LeadIntent;
  specialNotes?: string[];
};

export const INITIAL_LEAD_DRAFT: LeadDraft = {
  intent: 'unknown',
  specialNotes: [],
};

const STOP_WORDS = new Set([
  'ciao',
  'salve',
  'buongiorno',
  'buonasera',
  'grazie',
  'si',
  'sì',
  'ok',
  'qual',
  'qualcosa',
  'help',
  'grazie!',
]);

const WORD_TO_NUMBER: Record<string, number> = {
  uno: 1,
  un: 1,
  una: 1,
  due: 2,
  tre: 3,
  quattro: 4,
  cinque: 5,
  sei: 6,
  sette: 7,
  otto: 8,
  nove: 9,
  dieci: 10,
  undici: 11,
  dodici: 12,
};

const formatName = (input: string) =>
  input
    .trim()
    .split(/\s+/)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join(' ');

const extractName = (text: string): string | undefined => {
  const directMatch = text.match(/(?:mi chiamo|sono|il mio nome(?: è| e')|questa è|qui è)\s+([A-Za-zÀ-ÿ' ]{2,})/i);
  if (directMatch) {
    const candidate = directMatch[1].split(/[,\.!\d]/)[0]?.trim();
    if (candidate && candidate.length >= 2 && !STOP_WORDS.has(candidate.toLowerCase())) {
      return formatName(candidate);
    }
  }

  const inlineMatch = text.match(/^(?:ciao[,!\s]*)?([A-Za-zÀ-ÿ']{2,})\s+\d/i);
  if (inlineMatch) {
    const candidate = inlineMatch[1];
    if (!STOP_WORDS.has(candidate.toLowerCase())) {
      return formatName(candidate);
    }
  }

  const labelMatch = text.match(/nome[:\-]\s*([A-Za-zÀ-ÿ' ]{2,})/i);
  if (labelMatch) {
    const candidate = labelMatch[1].split(/[,\.!]/)[0]?.trim();
    if (candidate && candidate.length >= 2) {
      return formatName(candidate);
    }
  }

  return undefined;
};

const extractPhone = (text: string): string | undefined => {
  const match = text.match(/(\+?\d[\d\s\-\/]{6,})/);
  if (!match) return undefined;
  const normalized = match[0].replace(/[^\d\+]/g, '');
  if (normalized.replace(/\D/g, '').length < 7) return undefined;
  return normalized;
};

const extractPeople = (text: string): number | undefined => {
  const numberMatch = text.match(/(?:\b(?:per|siamo|saremmo|prenotazione|tavolo)\s*(?:in)?)\s*(\d{1,2})\b/i);
  if (numberMatch) {
    const value = parseInt(numberMatch[1], 10);
    if (!Number.isNaN(value) && value > 0 && value <= 50) return value;
  }

  const wordMatch = text.match(/(?:\b(?:per|siamo|saremmo|prenotazione|tavolo)\s*(?:in)?)\s*(una?|un|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|undici|dodici)\b/i);
  if (wordMatch) {
    const word = wordMatch[1].toLowerCase();
    const mapped = WORD_TO_NUMBER[word];
    if (mapped) return mapped;
  }

  return undefined;
};

const normalizeTime = (hour: string, minute?: string) => {
  const h = Math.min(parseInt(hour, 10), 23);
  const m = minute ? parseInt(minute, 10) : 0;
  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  return `${hh}:${mm}`;
};

const extractTime = (text: string): string | undefined => {
  const keywordMatch = text.match(/(?:alle?|all'|per le|per|dalle|ore)\s*(\d{1,2})(?:[:\.](\d{2}))?/i);
  if (keywordMatch) {
    return normalizeTime(keywordMatch[1], keywordMatch[2]);
  }

  const standaloneMatch = text.match(/\b(\d{1,2})[:\.](\d{2})\b/);
  if (standaloneMatch) {
    return normalizeTime(standaloneMatch[1], standaloneMatch[2]);
  }

  if (/\bmezzogiorno\b/i.test(text)) {
    return '12:00';
  }
  if (/\bmezzanotte\b/i.test(text)) {
    return '00:00';
  }

  return undefined;
};

const detectIntentFromMessage = (text: string, current: LeadIntent): LeadIntent => {
  if (/prenot|tavol|appunt|riserv|booking/i.test(text)) {
    return 'booking';
  }
  if (current === 'unknown' && /preventiv|informaz|info|orari|tariff|disponibil/i.test(text)) {
    return 'info';
  }
  return current;
};

const collectSpecialNotes = (text: string): string[] => {
  const notes: string[] = [];
  if (/cane|animali|gatto|pet/i.test(text)) {
    notes.push(`Animali: ${text}`);
  }
  if (/allerg|intoller|celiac|veg|gluten/i.test(text)) {
    notes.push(`Alimentazione/allergie: ${text}`);
  }
  if (/compleann|anniversari|festa|event|cerimoni/i.test(text)) {
    notes.push(`Occasione speciale: ${text}`);
  }
  if (/aggressivo|problematico|senza museruola/i.test(text)) {
    notes.push(`Avvertenze sicurezza: ${text}`);
  }
  return notes;
};

export const parseLeadDraft = (previous: LeadDraft, message: string): LeadDraft => {
  const text = message.trim();
  if (!text) return previous;

  const next: LeadDraft = { ...previous };

  next.intent = detectIntentFromMessage(text, previous.intent);

  const name = extractName(text);
  if (name) {
    next.nome = name;
  }

  const phone = extractPhone(text);
  if (phone) {
    next.telefono = phone;
  }

  const people = extractPeople(text);
  if (people) {
    next.persone = people;
  }

  const time = extractTime(text);
  if (time) {
    next.orario = time;
  }

  const notes = collectSpecialNotes(text);
  if (notes.length) {
    const merged = new Set([...(previous.specialNotes || []), ...notes]);
    next.specialNotes = Array.from(merged);
  }

  return next;
};

export const draftToSnapshot = (draft: LeadDraft): LeadSnapshot => ({
  nome: draft.nome,
  telefono: draft.telefono,
  persone: draft.persone,
  orario: draft.orario,
  intent: draft.intent,
  specialNotes: draft.specialNotes.length ? draft.specialNotes : undefined,
});
