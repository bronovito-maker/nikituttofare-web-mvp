// lib/chat-parser.ts
import { Message } from './types';

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
  nome: undefined,
  telefono: undefined,
  email: undefined,
  persone: undefined,
  orario: undefined,
  intent: 'altro',
  specialNotes: [],
  party_size: undefined,
  booking_date_time: undefined,
  notes: undefined,
};

const PERSONE_REGEX =
  /\b(?:siamo|saremmo|saranno|vorremmo|avremmo|per)\s*(?:circa\s*)?(?:in\s*)?(\d{1,2})\s*(?:persone|pers|pax|coperti)?\b/i;
const PERSONE_LABEL_REGEX = /\b(?:numero|n°|num\.?)\s*(?:di)?\s*(?:persone|ospiti|coperti)[\s:]*([0-9]{1,2})\b/i;
const ORARIO_REGEX = /(?:alle|per le|verso le|alle ore|alle h)\s*(\d{1,2})(?::(\d{2}))?/i;
const DATE_NUMERIC_REGEX = /(?:il\s*)?(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/i;
const DATE_TEXT_REGEX = /(?:il\s*)?(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/i;
const RELATIVE_DATE_REGEX = /\b(oggi|domani|dopodomani)\b/i;

const MONTH_MAP: Record<string, number> = {
  gennaio: 0,
  febbraio: 1,
  marzo: 2,
  aprile: 3,
  maggio: 4,
  giugno: 5,
  luglio: 6,
  agosto: 7,
  settembre: 8,
  ottobre: 9,
  novembre: 10,
  dicembre: 11,
};

const NLU_TIMEOUT_MS = 6000;

const AMBIGUOUS_TIME_PATTERNS: { regex: RegExp; reason: string }[] = [
  { regex: /\b(verso|intorno(?:\s+a)?|dopo|prima)(?:\s+le|\s+alle)?\s+\d{1,2}\b/i, reason: 'Orario espresso in modo approssimativo.' },
  { regex: /\b(stasera|questa\s+sera|in\s+serata|più\s+tardi|tardi|tarda\s+serata|in\s+tarda\s+serata)\b/i, reason: 'Orario generico senza ora precisa.' },
  { regex: /\b(a|per)\s+(pranzo|cena|aperitivo|apericena)\b/i, reason: 'Fascia oraria generica.' },
  { regex: /\b(dopo\s+cena|prima\s+di\s+cena|dopo\s+pranzo|prima\s+di\s+pranzo)\b/i, reason: 'Fascia oraria approssimativa.' },
  { regex: /\b(dopo|prima)\s+le\s+(otto|nove|dieci|undici|dodici)\b/i, reason: 'Orario espresso con riferimento relativo.' },
];

const AMBIGUOUS_DATE_PATTERNS: { regex: RegExp; reason: string }[] = [
  { regex: /\b(questo\s+weekend|nel\s+weekend|fine\s+settimana|i\s+prossimi\s+giorni|nei\s+prossimi\s+giorni|in\s+settimana)\b/i, reason: 'Data indicata in modo generico.' },
  { regex: /\b(prossima\s+settimana|la\s+settimana\s+prossima)\b/i, reason: 'Data generica senza giorno specifico.' },
];

const normalizePhone = (value: string | null | undefined) => {
  if (!value) return undefined;
  const cleaned = value.replace(/[^\d+]/g, '');
  if (!cleaned) return undefined;
  if (cleaned.startsWith('+')) {
    const normalized = `+${cleaned.slice(1).replace(/[+]/g, '')}`;
    return normalized === '+' ? undefined : normalized;
  }
  return cleaned;
};

const normalizeIsoDate = (value: string | null | undefined) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const normalizeTime = (value: string | null | undefined) => {
  if (!value) return undefined;
  const match = value.match(/(\d{1,2})(?::(\d{2}))?/);
  if (!match) return undefined;
  const hours = match[1].padStart(2, '0');
  const minutes = match[2] ?? '00';
  return `${hours}:${minutes}`;
};

const normalizeNotes = (value: string | null | undefined) => {
  if (!value) return undefined;
  return value.trim() || undefined;
};

function parseWithHeuristics(messages: Message[]): ParsedChatData {
  const fullText = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  const data: ParsedChatData = {};
  const now = new Date();
  const accumulatedNotes: string[] = [];
  const clarifications: BookingClarification[] = [];

  const nomeMatch = fullText.match(
    /(?:mi\s+chiamo|chiamarmi|mio\s+nome\s+è|sono)\s+([A-Za-zÀ-ÖØ-öø-ÿ\s'-]+?)(?:\.|\n|,|$)/i
  );
  if (nomeMatch?.[1]) {
    const rawNome = nomeMatch[1]
      .replace(/(?:il|la)\s+mio\s+numero.*/i, '')
      .replace(/(?:allergico|allergica|intollerante).*/i, '');
    const cleaned = rawNome
      .replace(/\b(?:allergico|allergica|intollerante)\b/gi, '')
      .replace(/\b(?:glutine|lattosio|nichel|frutta secca|noci|arachidi)\b/gi, '')
      .replace(/[:.,]+$/g, '')
      .trim();
    if (cleaned) {
      data.nome = cleaned;
    }
  }

  const telMatch = fullText.match(/(\+39[\s-]?)?([0-9]{3}[\s-]?[0-9]{6,7}|[0-9]{9,10})/);
  if (telMatch) {
    const prefix = telMatch[1] ? telMatch[1].replace(/[\s-]/g, '') : '';
    const number = telMatch[2].replace(/[\s-]/g, '');
    data.telefono = normalizePhone(`${prefix}${number}`);
  }

  const emailMatch = fullText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
  if (emailMatch) {
    data.email = emailMatch[0].toLowerCase();
  }

  if (/prenotare|riservare|tavolo|booking/i.test(fullText)) {
    data.intent = 'prenotazione';
  } else if (/ordina|asporto|delivery|consegn/i.test(fullText)) {
    data.intent = 'ordine';
  } else if (/orari|menu|dove siete|parcheggio|info/i.test(fullText)) {
    data.intent = 'info';
  } else {
    data.intent = 'altro';
  }

  const personeMatch = fullText.match(PERSONE_REGEX) || fullText.match(PERSONE_LABEL_REGEX);
  if (personeMatch?.[1]) {
    data.persone = personeMatch[1];
    const parsedNumber = Number(personeMatch[1]);
    if (!Number.isNaN(parsedNumber) && parsedNumber > 0) {
      data.party_size = parsedNumber;
    }
  }

  let bookingDate: Date | null = null;

  const numericDateMatch = fullText.match(DATE_NUMERIC_REGEX);
  if (numericDateMatch) {
    const day = Number(numericDateMatch[1]);
    const month = Number(numericDateMatch[2]) - 1;
    if (!Number.isNaN(day) && !Number.isNaN(month) && day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      let year = numericDateMatch[3] ? Number(numericDateMatch[3]) : now.getFullYear();
      if (year < 100) {
        year += 2000;
      }
      const candidate = new Date(year, month, day);
      if (!Number.isNaN(candidate.getTime())) {
        bookingDate = candidate;
      }
    }
  }

  if (!bookingDate) {
    const textDateMatch = fullText.match(DATE_TEXT_REGEX);
    if (textDateMatch) {
      const day = Number(textDateMatch[1]);
      const monthName = textDateMatch[2].toLowerCase();
      const monthIndex = MONTH_MAP[monthName];
      if (!Number.isNaN(day) && monthIndex !== undefined) {
        let year = now.getFullYear();
        const candidate = new Date(year, monthIndex, day);
        if (!Number.isNaN(candidate.getTime())) {
          if (candidate < now) {
            candidate.setFullYear(year + 1);
          }
          bookingDate = candidate;
        }
      }
    }
  }

  if (!bookingDate) {
    const relativeMatch = fullText.match(RELATIVE_DATE_REGEX);
    if (relativeMatch) {
      const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (relativeMatch[1].toLowerCase() === 'domani') {
        base.setDate(base.getDate() + 1);
      } else if (relativeMatch[1].toLowerCase() === 'dopodomani') {
        base.setDate(base.getDate() + 2);
      }
      bookingDate = base;
    }
  }

  const orarioMatch = fullText.match(ORARIO_REGEX);
  if (orarioMatch?.[1]) {
    const hours = orarioMatch[1].padStart(2, '0');
    const minutes = orarioMatch[2] ?? '00';
    data.orario = `${hours}:${minutes}`;
    if (bookingDate) {
      const dateTime = new Date(bookingDate);
      dateTime.setHours(Number(hours), Number(minutes), 0, 0);
      data.booking_date_time = dateTime.toISOString();
    }
  }

  if (/allerg/i.test(fullText) || /intolleranz/i.test(fullText)) {
    accumulatedNotes.push('Possibili allergie o intolleranze menzionate.');
  }

  const notesMatch = fullText.match(/(?:note:|con la nota|nota:)\s*(.+)/i);
  if (notesMatch?.[1]) {
    accumulatedNotes.push(notesMatch[1].trim());
  }

  if (!accumulatedNotes.length) {
    if (/\b(nessun[ao]?|no)\s+(?:allergia|allergie|intolleranza|intolleranze)\b/i.test(fullText)) {
      accumulatedNotes.push('Nessuna allergia dichiarata.');
    } else if (
      /\b(?:nessun[ao]?|no|nulla)\b.*(?:richiest[ae]|preferenze?|problemi|vincoli|allergie|intolleranze?)/i.test(
        fullText
      )
    ) {
      accumulatedNotes.push('Nessuna richiesta particolare segnalata.');
    }
  }

  if (accumulatedNotes.length) {
    data.notes = accumulatedNotes.join(' | ');
  }

  const addClarification = (
    slot: BookingSlotKey,
    reason: string,
    phrase?: string
  ) => {
    if (
      !clarifications.some(
        (entry) =>
          entry.slot === slot &&
          entry.reason === reason &&
          (entry.phrase ?? '') === (phrase ?? '')
      )
    ) {
      clarifications.push({ slot, reason, phrase });
    }
  };

  AMBIGUOUS_TIME_PATTERNS.forEach(({ regex, reason }) => {
    const match = fullText.match(regex);
    if (match) {
      addClarification('orario', reason, match[0]);
    }
  });

  AMBIGUOUS_DATE_PATTERNS.forEach(({ regex, reason }) => {
    const match = fullText.match(regex);
    if (match) {
      addClarification('data', reason, match[0]);
    }
  });

  if (data.party_size && data.booking_date_time) {
    data.intent = 'prenotazione';
  } else if (!data.intent) {
    data.intent = 'altro';
  }

  if (clarifications.length) {
    data.clarifications = clarifications;
  }

  return data;
}

async function callNluService(messages: Message[]): Promise<Partial<ParsedChatData>> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  if (controller) {
    timeoutId = setTimeout(() => controller.abort(), NLU_TIMEOUT_MS);
  }

  try {
    const endpoint =
      typeof window !== 'undefined'
        ? '/api/nlu'
        : (() => {
            const envBase =
              process.env.NEXT_PUBLIC_APP_URL ||
              (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
            const baseUrl = envBase ?? 'http://localhost:3000';
            return `${baseUrl.replace(/\/$/, '')}/api/nlu`;
          })();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: controller?.signal,
    });

    if (!response.ok) {
      throw new Error(`Errore NLU ${response.status}`);
    }

    const json = await response.json();
    const payload = json?.data ?? {};

    return {
      intent: payload.intent ?? undefined,
      nome: payload.nome ?? undefined,
      telefono: normalizePhone(payload.telefono ?? undefined),
      email: payload.email ?? undefined,
      booking_date_time: normalizeIsoDate(payload.booking_date_time ?? undefined),
      orario: normalizeTime(payload.orario ?? undefined),
      party_size: typeof payload.party_size === 'number' && payload.party_size > 0 ? payload.party_size : undefined,
      notes: normalizeNotes(payload.notes ?? undefined),
    };
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

const mergeParsedData = (heuristic: ParsedChatData, nlu?: Partial<ParsedChatData>): ParsedChatData => {
  if (!nlu) return heuristic;

  const merged: ParsedChatData = { ...heuristic };

  if (nlu.nome) merged.nome = nlu.nome;
  if (nlu.telefono) merged.telefono = nlu.telefono;
  if (nlu.email) merged.email = nlu.email;
  if (nlu.party_size) {
    merged.party_size = nlu.party_size;
    merged.persone = String(nlu.party_size);
  }
  if (nlu.orario) merged.orario = nlu.orario;
  if (nlu.booking_date_time) merged.booking_date_time = nlu.booking_date_time;
  if (nlu.notes) merged.notes = nlu.notes;
  if (nlu.intent) merged.intent = nlu.intent;

  if (!merged.persone && nlu.party_size) {
    merged.persone = String(nlu.party_size);
  }

  const clarifications = heuristic.clarifications ?? [];
  const filteredClarifications = clarifications.filter((clar) => {
    if (clar.slot === 'orario' && nlu.orario) return false;
    if (clar.slot === 'data' && nlu.booking_date_time) return false;
    return true;
  });
  if (filteredClarifications.length) {
    merged.clarifications = filteredClarifications;
  } else {
    delete merged.clarifications;
  }

  return merged;
};

export async function parseChatData(messages: Message[]): Promise<ParsedChatData> {
  const heuristic = parseWithHeuristics(messages);

  try {
    const nlu = await callNluService(messages);
    return mergeParsedData(heuristic, nlu);
  } catch (error) {
    console.warn('Fallback al parser heuristico:', error);
    return heuristic;
  }
}

export function parseLeadDraft(current: LeadDraft, message: string): LeadDraft {
  const parsed = parseWithHeuristics([{ id: `msg-${Date.now()}`, role: 'user', content: message }]);
  const next: LeadDraft = {
    ...current,
    specialNotes: [...current.specialNotes],
  };

  if (parsed.nome) next.nome = parsed.nome;
  if (parsed.telefono) next.telefono = parsed.telefono;
  if (parsed.email) next.email = parsed.email;
  if (parsed.persone) next.persone = parsed.persone;
  if (parsed.orario) next.orario = parsed.orario;
  if (parsed.intent) next.intent = parsed.intent;
  if (parsed.party_size) next.party_size = parsed.party_size;
  if (parsed.booking_date_time) next.booking_date_time = parsed.booking_date_time;
  if (parsed.notes) {
    next.notes = parsed.notes;
    parsed.notes
      .split('|')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((note) => {
        if (!next.specialNotes.includes(note)) {
          next.specialNotes.push(note);
        }
      });
  }

  return next;
}

export function draftToSnapshot(draft: LeadDraft): LeadSnapshot {
  return {
    ...draft,
    intent: draft.intent ?? 'altro',
    specialNotes: [...draft.specialNotes],
    party_size: draft.party_size,
    booking_date_time: draft.booking_date_time,
    notes: draft.notes,
  };
}
