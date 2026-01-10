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

export type LeadSnapshot = LeadDraft;

export const INITIAL_LEAD_DRAFT: LeadDraft = {
  intent: 'altro',
  specialNotes: [],
};

// --- Regex & Constants ---
const PERSONE_REGEX = /\b(?:siamo|saremmo|saranno|vorremmo|avremmo|per)\s*(?:circa\s*)?(?:in\s*)?(\d{1,2})\s*(?:persone|pers|pax|coperti)?\b/i;
const PERSONE_LABEL_REGEX = /\b(?:numero|n°|num\.?)\s*(?:di)?\s*(?:persone|ospiti|coperti)[\s:]*([0-9]{1,2})\b/i;
const ORARIO_REGEX = /(?:alle|per le|verso le|alle ore|alle h)\s*(\d{1,2})(?::(\d{2}))?/i;
const DATE_NUMERIC_REGEX = /(?:il\s*)?(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/i;
const DATE_TEXT_REGEX = /(?:il\s*)?(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/i;
const MONTH_MAP: Record<string, number> = { gennaio: 0, febbraio: 1, marzo: 2, aprile: 3, maggio: 4, giugno: 5, luglio: 6, agosto: 7, settembre: 8, ottobre: 9, novembre: 10, dicembre: 11 };
const NLU_TIMEOUT_MS = 15000;

type ConfidenceLevel = 'low' | 'medium' | 'high';
type ConfidenceKey = 'nome' | 'telefono' | 'booking_date_time' | 'orario' | 'party_size';
type ConfidenceMap = Partial<Record<ConfidenceKey, ConfidenceLevel>>;
type NluAmbiguityMap = Partial<Record<ConfidenceKey, boolean>>;
type NluParsedData = Partial<ParsedChatData> & { ambiguities: NluAmbiguityMap };

// --- Normalization Functions ---
const normalizePhone = (v: string | null | undefined) => v ? v.replace(/[^\d+]/g, '') : undefined;
const normalizeIsoDate = (v: string | null | undefined) => (v && !Number.isNaN(new Date(v).getTime())) ? new Date(v).toISOString() : undefined;
const normalizeTime = (v: string | null | undefined) => v?.match(/(\d{1,2})(?::(\d{2}))?/) ? `${v.match(/(\d{1,2})/)?.[1].padStart(2, '0')}:${v.match(/:(\d{2})?/)?.[1] ?? '00'}`: undefined;
const normalizeNotes = (v: string | null | undefined) => v?.trim() || undefined;


// --- Heuristic Parsers ---

function extractName(text: string): { name?: string, confidence: ConfidenceLevel, clarification?: BookingClarification } {
  const nameMatch = text.match(/(?:mi\s+chiamo|chiamarmi|mio\s+nome\s+è|sono)\s+([A-Za-zÀ-ÖØ-öø-ÿ\s'-]+?)(?:\.|\n|,|$)/i)
    ?? text.match(/(?:a\s+nome|il\s+mio\s+nome\s+è)\s+([A-Za-zÀ-ÖØ-öø-ÿ\s'-]+?)(?:\.|\n|,|$)/i)
    ?? text.match(/(?:^|\n)(?:user:\s*)?([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'’-]+(?:\s+[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'’-]+)+)\b/);

  if (nameMatch?.[1]) {
    const cleaned = nameMatch[1]
      .replace(/(?:il|la)\s+mio\s+numero.*/i, '')
      .replace(/(?:allergico|allergica|intollerante).*/i, '')
      .replace(/[:.,]+$/g, '').trim();

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
  const match = text.match(/(\+39[\s-]?)?([0-9]{3}[\s-]?[0-9]{6,7}|[0-9]{9,10})/);
  if (match) {
    const phone = normalizePhone(`${match[1] ?? ''}${match[2]}`);
    if (phone) return { phone, confidence: phone.length >= 9 ? 'high' : 'medium' };
  }
  return { confidence: 'low' };
}

function extractPartySize(text: string): { partySize?: number, confidence: ConfidenceLevel } {
  const match = text.match(PERSONE_REGEX) || text.match(PERSONE_LABEL_REGEX);
  if (match?.[1]) {
    const size = parseInt(match[1], 10);
    if (!isNaN(size) && size > 0) return { partySize: size, confidence: 'medium' };
  }
  return { confidence: 'low' };
}

function extractBookingDate(text: string, now: Date): { date: Date, confidence: ConfidenceLevel } | null {
    const numericMatch = text.match(DATE_NUMERIC_REGEX);
    if (numericMatch) {
        const day = parseInt(numericMatch[1], 10), month = parseInt(numericMatch[2], 10) - 1;
        let year = numericMatch[3] ? parseInt(numericMatch[3], 10) : now.getFullYear();
        if (year < 100) year += 2000;
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) return { date, confidence: 'medium' };
    }

    const textMatch = text.match(DATE_TEXT_REGEX);
    if (textMatch) {
        const day = parseInt(textMatch[1], 10), monthName = textMatch[2].toLowerCase();
        let year = now.getFullYear();
        const date = new Date(year, MONTH_MAP[monthName], day);
        if (date < now) date.setFullYear(year + 1);
        if (!isNaN(date.getTime())) return { date, confidence: 'medium' };
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

function parseWithHeuristics(messages: Message[]): { data: ParsedChatData; confidence: ConfidenceMap } {
  const fullText = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  const data: ParsedChatData = {};
  const confidence: ConfidenceMap = {};
  const clarifications: BookingClarification[] = [];
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
  if(data.party_size) data.persone = String(data.party_size);

  const emailMatch = fullText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
  if (emailMatch) data.email = emailMatch[0].toLowerCase();

  const dateResult = extractBookingDate(fullText, now);
  let bookingDate = dateResult?.date;
  confidence.booking_date_time = dateResult?.confidence;
  
  const orarioMatch = fullText.match(ORARIO_REGEX);
  if (orarioMatch?.[1]) {
    const hours = orarioMatch[1].padStart(2, '0');
    const minutes = orarioMatch[2] ?? '00';
    data.orario = `${hours}:${minutes}`;
    confidence.orario = 'medium';
    if (bookingDate) {
      const dateTime = setSeconds(setMinutes(setHours(bookingDate, parseInt(hours, 10)), parseInt(minutes, 10)), 0);
      data.booking_date_time = dateTime.toISOString();
      confidence.booking_date_time = 'high';
      confidence.orario = 'high';
    }
  }

  // --- Intent & Notes ---
  if (/prenotare|riservare|tavolo/.test(fullText)) data.intent = 'prenotazione';
  else if (/ordina|asporto|delivery/.test(fullText)) data.intent = 'ordine';
  else if (/orari|menu|info/.test(fullText)) data.intent = 'info';
  else data.intent = 'altro';
  
  const notes = [];
  if (/allerg|intolleran/.test(fullText)) notes.push('Possibili allergie/intolleranze.');
  const notesMatch = fullText.match(/(?:note:|nota:)\s*(.+)/i);
  if (notesMatch?.[1]) notes.push(notesMatch[1].trim());
  if (notes.length) data.notes = notes.join(' | ');

  // --- Clarifications ---
  const AMBIGUOUS_PATTERNS: {slot: BookingSlotKey, patterns: {regex: RegExp, reason: string}[]}[] = [
      { slot: 'orario', patterns: [
          { regex: /\b(verso|intorno|dopo|prima)(?:\s+le)?\s+\d{1,2}\b/i, reason: 'Orario approssimativo.' },
          { regex: /\b(stasera|in\s+serata|più\s+tardi)\b/i, reason: 'Orario generico.' },
          { regex: /\b(a|per)\s+(pranzo|cena)\b/i, reason: 'Fascia oraria generica.' },
      ]},
      { slot: 'data', patterns: [
          { regex: /\b(questo\s+weekend|prossimi\s+giorni|in\s+settimana)\b/i, reason: 'Data generica.' },
      ]}
  ];
  
  AMBIGUOUS_PATTERNS.forEach(({slot, patterns}) => {
      patterns.forEach(({regex, reason}) => {
          const match = fullText.match(regex);
          if (match && !clarifications.some(c => c.slot === slot)) {
              clarifications.push({ slot, reason, phrase: match[0] });
          }
      });
  });

  if (clarifications.length) data.clarifications = clarifications;

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
  if(merged.party_size) merged.persone = String(merged.party_size);


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

export async function parseChatData(messages: Message[]): Promise<ParsedChatData> {
  const { data: heuristic, confidence } = parseWithHeuristics(messages);
  try {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) return heuristic;
    
    const nlu = await callNluService([lastUserMessage]);
    return mergeParsedData(heuristic, confidence, nlu);
  } catch (error) {
    console.warn('[parseChatData] NLU non disponibile, uso parser heuristico:', error);
    return heuristic;
  }
}

export function parseLeadDraft(current: LeadDraft, message: string): LeadDraft {
  const { data: parsed } = parseWithHeuristics([{ id: `msg-${Date.now()}`, role: 'user', content: message }]);
  const next = { ...current, specialNotes: [...current.specialNotes] };
  
  const fieldsToUpdate: (keyof ParsedChatData)[] = [ 'nome', 'telefono', 'email', 'persone', 'orario', 'intent', 'party_size', 'booking_date_time', 'notes' ];

  fieldsToUpdate.forEach(field => {
    if (parsed[field] !== undefined) (next as any)[field] = parsed[field];
  });
  
  if (parsed.notes) {
    parsed.notes.split('|').map(n => n.trim()).filter(Boolean).forEach(note => {
      if (!next.specialNotes.includes(note)) next.specialNotes.push(note);
    });
  }

  return next;
}

export function draftToSnapshot(draft: LeadDraft): LeadSnapshot {
  return { ...draft };
}