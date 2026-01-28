// lib/chat-parser.ts
import { Message } from './types';
import { addDays, setHours, setMinutes, setSeconds, startOfDay } from 'date-fns';

export type BookingSlotKey = 'nome' | 'telefono' | 'data' | 'orario' | 'persone' | 'allergeni';

export type BookingClarification = {
  slot: BookingSlotKey;
  reason: string;
  phrase?: string;
};

export interface ParsedChatData {
  nome?: string;
  telefono?: string;
  email?: string;
  booking_date_time?: string;
  party_size?: number;
  notes?: string;
  intent?: 'prenotazione' | 'info' | 'ordine' | 'altro';
  persone?: string;
  orario?: string;
  clarifications?: BookingClarification[];
}

export type LeadDraft = {
  nome?: string;
  telefono?: string;
  email?: string;
  persone?: string;
  orario?: string;
  intent?: 'prenotazione' | 'info' | 'ordine' | 'altro';
  specialNotes: string[];
  party_size?: number;
  booking_date_time?: string;
  notes?: string;
};


export const INITIAL_LEAD_DRAFT: LeadDraft = {
  intent: 'altro',
  specialNotes: [],
};

// --- Regex & Constants ---
const PERSONE_REGEX = /\b(?:siamo|saremmo|saranno|vorremmo|avremmo|per)\s+(?:circa\s+)?(?:in\s+)?(\d{1,2})\s+(?:persone|pers|pax|coperti)?\b/i;
const PERSONE_LABEL_REGEX = /\b(?:numero|n°|num\.?)\s*(?:di\s*)?(?:persone|ospiti|coperti)[\s:]*(\d{1,2})\b/i;
const ORARIO_REGEX = /(?:alle|per le|verso le|alle ore|alle h)\s*(\d{1,2})(?::(\d{2}))?/i;
const DATE_NUMERIC_REGEX = /(?:il\s*)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/i;
const DATE_TEXT_REGEX = /(?:il\s*)?(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/i;
const MONTH_MAP: Record<string, number> = { gennaio: 0, febbraio: 1, marzo: 2, aprile: 3, maggio: 4, giugno: 5, luglio: 6, agosto: 7, settembre: 8, ottobre: 9, novembre: 10, dicembre: 11 };
const NLU_TIMEOUT_MS = 15000;

type ConfidenceLevel = 'low' | 'medium' | 'high';
type ConfidenceKey = 'nome' | 'telefono' | 'booking_date_time' | 'orario' | 'party_size';
type ConfidenceMap = Partial<Record<ConfidenceKey, ConfidenceLevel>>;
type NluAmbiguityMap = Partial<Record<ConfidenceKey, boolean>>;
type NluParsedData = Partial<ParsedChatData> & { ambiguities: NluAmbiguityMap };

// --- Normalization Functions ---
const normalizePhone = (v: string | null | undefined) => v ? v.replaceAll(/[^\d+]/g, '') : undefined;
const normalizeIsoDate = (v: string | null | undefined) => (v && !Number.isNaN(new Date(v).getTime())) ? new Date(v).toISOString() : undefined;
const normalizeTime = (v: string | null | undefined) => {
  const m = v ? /(\d{1,2})(?::(\d{2}))?/.exec(v) : null;
  return m ? `${m[1].padStart(2, '0')}:${m[2] ?? '00'}` : undefined;
}
const normalizeNotes = (v: string | null | undefined) => v?.trim() || undefined;


// --- Heuristic Parsers ---

function extractName(text: string): { name?: string, confidence: ConfidenceLevel, clarification?: BookingClarification } {
  // Simplified regexes to avoid complexity warnings - removed nested quantifiers

  // 1. Direct introduction: "mi chiamo X", "sono X" -> captures up to 60 chars of name-like string
  // Fixed ReDoS ambiguity: Ensure capture group starts with non-whitespace ([a-z...'-])
  const introMatch = /(?:mi\s+chiamo|chiamarmi|mio\s+nome\s+è|sono)\s+([a-zà-öø-ÿ'-][a-zà-öø-ÿ\s'-]{0,59})(?:[.,\n]|$)/i.exec(text);

  // 2. "name is" / "under name": "a nome X", "il mio nome è X"
  const labelMatch = /(?:a\s+nome|il\s+mio\s+nome\s+è)\s+([a-zà-öø-ÿ'-][a-zà-öø-ÿ\s'-]{0,59})(?:[.,\n]|$)/i.exec(text);

  // 3. Capitalized name at start/newline: "Mario Rossi" -> captures capitalized sequences
  // Refactored to avoid ReDoS (S5852) by matching "Word" then up to 3 "(space) Word" groups specifically.
  const capitalizedMatch = /(?:^|\n)(?:user:\s*)?([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'’-]+(?:\s+[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'’-]+){0,3})\b/.exec(text);

  const nameMatch = introMatch ?? labelMatch ?? capitalizedMatch;

  if (nameMatch?.[1]) {
    let cleaned = nameMatch[1];

    // safe truncation without using .*
    const truncationPatterns = [
      /(?:il|la)\s+mio\s+numero/i,
      /(?:allergico|allergica|intollerante)/i
    ];

    for (const pattern of truncationPatterns) {
      const match = pattern.exec(cleaned);
      if (match?.index !== undefined) {
        cleaned = cleaned.substring(0, match.index);
        break;
      }
    }

    cleaned = cleaned.replaceAll(/[:.,]+$/g, '').trim();

    if (cleaned) {
      if (cleaned.split(/\s+/).length <= 1) {
        return { name: cleaned, confidence: 'low', clarification: { slot: 'nome', reason: 'È stato indicato solo il nome, chiedi anche il cognome.', phrase: cleaned } };
      }
      return { name: cleaned, confidence: 'medium' };
    }
  }
  return { confidence: 'low' };
}

function extractPhone(text: string): { phone?: string, confidence: ConfidenceLevel } {
  const match = /(\+39[\s-]?)?(\d{3}[\s-]?\d{6,7}|\d{9,10})/.exec(text);
  if (match) {
    const phone = normalizePhone(`${match[1] ?? ''}${match[2]}`);
    if (phone) return { phone, confidence: phone.length >= 9 ? 'high' : 'medium' };
  }
  return { confidence: 'low' };
}

function extractPartySize(text: string): { partySize?: number, confidence: ConfidenceLevel } {
  const match = PERSONE_REGEX.exec(text) || PERSONE_LABEL_REGEX.exec(text);
  if (match?.[1]) {
    const size = Number.parseInt(match[1], 10);
    if (!Number.isNaN(size) && size > 0) return { partySize: size, confidence: 'medium' };
  }
  return { confidence: 'low' };
}

function extractBookingDate(text: string, now: Date): { date: Date, confidence: ConfidenceLevel } | null {
  const numericMatch = DATE_NUMERIC_REGEX.exec(text);
  if (numericMatch) {
    const day = Number.parseInt(numericMatch[1], 10), month = Number.parseInt(numericMatch[2], 10) - 1;
    let year = numericMatch[3] ? Number.parseInt(numericMatch[3], 10) : now.getFullYear();
    if (year < 100) year += 2000;
    const date = new Date(year, month, day);
    if (!Number.isNaN(date.getTime())) return { date, confidence: 'medium' };
  }

  const textMatch = DATE_TEXT_REGEX.exec(text);
  if (textMatch) {
    const day = Number.parseInt(textMatch[1], 10), monthName = textMatch[2].toLowerCase();
    let year = now.getFullYear();
    const date = new Date(year, MONTH_MAP[monthName], day);
    if (date < now) date.setFullYear(year + 1);
    if (!Number.isNaN(date.getTime())) return { date, confidence: 'medium' };
  }

  const RELATIVE_DATE_RULES = [
    { regex: /\bdopodomani\b/i, offset: 2, confidence: 'low' },
    { regex: /\bdomani\b/i, offset: 1, confidence: 'medium' },
    { regex: /\b(oggi|stasera)\b/i, offset: 0, confidence: 'low' },
  ] as const;

  for (const rule of RELATIVE_DATE_RULES) {
    if (rule.regex.test(text)) {
      return { date: addDays(startOfDay(now), rule.offset), confidence: rule.confidence };
    }
  }

  return null;
}

function extractIntent(fullText: string): ParsedChatData['intent'] {
  if (/prenotare|riservare|tavolo/.test(fullText)) return 'prenotazione';
  if (/ordina|asporto|delivery/.test(fullText)) return 'ordine';
  if (/info|orari|menu/.test(fullText)) return 'info';
  return 'altro';
}

function extractNotes(fullText: string): string | undefined {
  const notes = [];
  if (/allerg|intolleran/.test(fullText)) notes.push('Possibili allergie/intolleranze.');
  const notesMatch = /(?:note:|nota:)\s*(.+)/i.exec(fullText);
  if (notesMatch?.[1]) notes.push(notesMatch[1].trim());
  return notes.length ? notes.join(' | ') : undefined;
}

function findClarifications(fullText: string): BookingClarification[] {
  const clarifications: BookingClarification[] = [];
  const AMBIGUOUS_PATTERNS: { slot: BookingSlotKey, patterns: { regex: RegExp, reason: string }[] }[] = [
    {
      slot: 'orario', patterns: [
        { regex: /\b(verso|intorno|dopo|prima)(?:\s+le)?\s+\d{1,2}\b/i, reason: 'Orario approssimativo.' },
        { regex: /\b(stasera|in\s+serata|più\s+tardi)\b/i, reason: 'Orario generico.' },
        { regex: /\b(a|per)\s+(pranzo|cena)\b/i, reason: 'Fascia oraria generica.' },
      ]
    },
    {
      slot: 'data', patterns: [
        { regex: /\b(questo\s+weekend|prossimi\s+giorni|in\s+settimana)\b/i, reason: 'Data generica.' },
      ]
    }
  ];

  AMBIGUOUS_PATTERNS.forEach(({ slot, patterns }) => {
    patterns.forEach(({ regex, reason }) => {
      const match = regex.exec(fullText);
      if (match && !clarifications.some(c => c.slot === slot)) {
        clarifications.push({ slot, reason, phrase: match[0] });
      }
    });
  });
  return clarifications;
}


function parseWithHeuristics(messages: Message[]): { data: ParsedChatData; confidence: ConfidenceMap } {
  const fullText = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  const data: ParsedChatData = {};
  const confidence: ConfidenceMap = {};
  let clarifications: BookingClarification[] = [];
  const now = new Date();

  // --- Extraction ---
  const nameResult = extractName(fullText);
  data.nome = nameResult.name;
  confidence.nome = nameResult.confidence;
  if (nameResult.clarification) clarifications.push(nameResult.clarification);

  const phoneResult = extractPhone(fullText);
  data.telefono = phoneResult.phone;
  confidence.telefono = phoneResult.confidence;

  const partySizeResult = extractPartySize(fullText);
  data.party_size = partySizeResult.partySize;
  confidence.party_size = partySizeResult.confidence;
  if (data.party_size) data.persone = String(data.party_size);

  // ReDoS safe email regex (simplified linear pattern)
  const emailMatch = /\b[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/.exec(fullText);
  if (emailMatch) data.email = emailMatch[0].toLowerCase();

  const dateResult = extractBookingDate(fullText, now);
  let bookingDate = dateResult?.date;
  confidence.booking_date_time = dateResult?.confidence;

  const orarioMatch = ORARIO_REGEX.exec(fullText);
  if (orarioMatch?.[1]) {
    const hours = orarioMatch[1].padStart(2, '0');
    const minutes = orarioMatch[2] ?? '00';
    data.orario = `${hours}:${minutes}`;
    confidence.orario = 'medium';
    if (bookingDate) {
      const dateTime = setSeconds(setMinutes(setHours(bookingDate, Number.parseInt(hours, 10)), Number.parseInt(minutes, 10)), 0);
      data.booking_date_time = dateTime.toISOString();
      confidence.booking_date_time = 'high';
      confidence.orario = 'high';
    }
  }

  // --- Intent, Notes, Clarifications ---
  data.intent = extractIntent(fullText);
  data.notes = extractNotes(fullText);
  clarifications = [...clarifications, ...findClarifications(fullText)];

  if (clarifications.length) {
    data.clarifications = clarifications.filter((c, i, self) => i === self.findIndex(s => s.slot === c.slot));
  }

  return { data, confidence };
}


// --- NLU & Merging Logic ---

async function callNluService(messages: Message[]): Promise<NluParsedData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NLU_TIMEOUT_MS);

  try {
    const endpoint = '/api/nlu';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`NLU Error ${response.status}`);
    const json = await response.json();
    const payload = json?.data ?? {};

    return {
      intent: payload.intent,
      nome: payload.nome,
      telefono: normalizePhone(payload.telefono),
      email: payload.email,
      booking_date_time: normalizeIsoDate(payload.booking_date_time),
      orario: normalizeTime(payload.orario),
      party_size: payload.party_size > 0 ? payload.party_size : undefined,
      notes: normalizeNotes(payload.notes),
      ambiguities: {
        nome: !!payload.nome_is_ambiguous,
        telefono: !!payload.telefono_is_ambiguous,
        booking_date_time: !!payload.booking_date_time_is_ambiguous,
        orario: !!payload.orario_is_ambiguous,
        party_size: !!payload.party_size_is_ambiguous,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

const mergeParsedData = (heuristic: ParsedChatData, heuristicConfidence: ConfidenceMap, nlu?: NluParsedData): ParsedChatData => {
  if (!nlu) return heuristic;
  const merged: ParsedChatData = { ...heuristic };

  const fields: ConfidenceKey[] = ['nome', 'telefono', 'booking_date_time', 'orario', 'party_size'];
  fields.forEach(key => {
    const hVal = heuristic[key as keyof ParsedChatData];
    const nluVal = nlu[key as keyof ParsedChatData];
    if (nluVal !== undefined && (heuristicConfidence[key] !== 'high' || hVal === undefined)) {
      (merged as any)[key] = nluVal;
    }
  });

  if (nlu.email) merged.email = nlu.email;
  if (nlu.notes) merged.notes = nlu.notes;
  if (nlu.intent) merged.intent = nlu.intent;
  if (merged.party_size) merged.persone = String(merged.party_size);


  const AMBIGUITY_REASON_MAP: Record<ConfidenceKey, { slot: BookingSlotKey; reason: string }> = {
    nome: { slot: 'nome', reason: 'Il nome sembra incompleto; chiedi conferma.' },
    telefono: { slot: 'telefono', reason: 'Il numero non è completo; chiedi conferma.' },
    booking_date_time: { slot: 'data', reason: 'Data generica; chiedi giorno preciso.' },
    orario: { slot: 'orario', reason: "Orario generico; chiedi orario esatto." },
    party_size: { slot: 'persone', reason: 'Numero approssimativo; chiedi conferma.' },
  };

  const nluClarifications = Object.entries(nlu.ambiguities)
    .filter(([, isAmbiguous]) => isAmbiguous)
    .map(([key]) => AMBIGUITY_REASON_MAP[key as ConfidenceKey])
    .filter(Boolean);

  merged.clarifications = (nluClarifications.length ? nluClarifications : heuristic.clarifications) ?? [];
  if (merged.clarifications.length === 0) delete merged.clarifications;

  return merged;
};

// --- Main Exported Functions ---

async function getNluData(messages: Message[]): Promise<NluParsedData | null> {
  try {
    const lastUserMessage = messages.findLast(m => m.role === 'user');
    if (!lastUserMessage) return null;
    return await callNluService([lastUserMessage]);
  } catch (error) {
    console.error('NLU Error:', error);
    return null;
  }
}

export async function parseChatData(messages: Message[]): Promise<ParsedChatData> {
  const { data: heuristic, confidence } = parseWithHeuristics(messages);
  const nlu = await getNluData(messages);
  if (!nlu) return heuristic;
  return mergeParsedData(heuristic, confidence, nlu);
}

function updateLeadFields(next: LeadDraft, parsed: ParsedChatData) {
  const fieldsToUpdate: (keyof ParsedChatData)[] = ['nome', 'telefono', 'email', 'persone', 'orario', 'intent', 'party_size', 'booking_date_time', 'notes'];

  fieldsToUpdate.forEach(field => {
    if (parsed[field] !== undefined) {
      (next as any)[field] = parsed[field];
    }
  });
}

function updateSpecialNotes(next: LeadDraft, parsedNotes: string | undefined) {
  if (!parsedNotes) return;

  const notesToAdd = parsedNotes.split('|').map(n => n.trim()).filter(Boolean);
  notesToAdd.forEach(note => {
    if (!next.specialNotes.includes(note)) {
      next.specialNotes.push(note);
    }
  });
}

export function parseLeadDraft(current: LeadDraft, message: string): LeadDraft {
  const { data: parsed } = parseWithHeuristics([{ id: `msg-${Date.now()}`, role: 'user', content: message }]);
  const next = { ...current, specialNotes: [...current.specialNotes] };

  updateLeadFields(next, parsed);
  updateSpecialNotes(next, parsed.notes);

  return next;
}

export function draftToSnapshot(draft: LeadDraft): LeadDraft {
  return { ...draft };
}