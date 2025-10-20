// lib/chat-parser.ts
import { Message } from './types';

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

export function parseChatData(messages: Message[]): ParsedChatData {
  const fullText = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  const data: ParsedChatData = {};
  const now = new Date();
  const accumulatedNotes: string[] = [];

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
    data.telefono = `${prefix}${number}`;
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

  if (data.party_size && data.booking_date_time) {
    data.intent = 'prenotazione';
  } else if (!data.intent) {
    data.intent = 'altro';
  }

  console.log('Dati Parsati (Fase 5):', data);
  return data;
}

export function parseLeadDraft(current: LeadDraft, message: string): LeadDraft {
  const parsed = parseChatData([{ id: `msg-${Date.now()}`, role: 'user', content: message }]);
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
