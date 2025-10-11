'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Message } from '@/lib/types';

type LeadIntent = 'booking' | 'info' | 'unknown';

type LeadDraft = {
  nome?: string;
  telefono?: string;
  persone?: number;
  orario?: string;
  intent: LeadIntent;
  specialNotes: string[];
};

const INITIAL_LEAD_DRAFT: LeadDraft = { intent: 'unknown', specialNotes: [] };

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
  if (current === 'unknown' && /preventiv|informaz|info|orari|tariff/i.test(text)) {
    return 'info';
  }
  return current;
};

const collectSpecialNotes = (text: string): string[] => {
  const notes: string[] = [];
  if (/cane|animali|gatto|pet/i.test(text)) {
    notes.push(`Animali: ${text}`);
  }
  if (/allerg|intoller|celiac|veg/i.test(text)) {
    notes.push(`Alimentazione/allergie: ${text}`);
  }
  if (/compleann|anniversari|festa|event/i.test(text)) {
    notes.push(`Occasione speciale: ${text}`);
  }
  return notes;
};

export const useChat = ({ tenantId }: { tenantId: string | null }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isHydratedRef = useRef(false);
  const [conversationLog, setConversationLog] = useState<string[]>([]);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadDraft, setLeadDraft] = useState<LeadDraft>(() => ({ ...INITIAL_LEAD_DRAFT }));

  const storageKey = useMemo(
    () => (tenantId ? `chat-history-${tenantId}` : 'chat-history-default'),
    [tenantId]
  );

  useEffect(() => {
    // Carica eventuale cronologia salvata in localStorage
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          isHydratedRef.current = true;
          return;
        }
      }
    } catch (error) {
      console.warn('Impossibile ripristinare la cronologia chat:', error);
    }

    // Fallback: messaggio di benvenuto iniziale
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: 'Ciao! Sono il tuo assistente virtuale. Come posso aiutarti oggi?',
    };
    setMessages([
      {
        ...welcomeMessage,
      },
    ]);
    setConversationLog([]);
    setLeadSubmitted(false);
    setLeadDraft({ ...INITIAL_LEAD_DRAFT });
    isHydratedRef.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isHydratedRef.current) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
      console.warn('Impossibile salvare la cronologia chat:', error);
    }
  }, [messages, storageKey]);

  const detectLeadInfo = (text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;

    setConversationLog((prev) => [...prev, cleaned]);

    setLeadDraft((prev) => {
      const next: LeadDraft = { ...prev };

      next.intent = detectIntentFromMessage(cleaned, prev.intent);

      if (!prev.nome) {
        const name = extractName(cleaned);
        if (name) next.nome = name;
      }

      const phone = extractPhone(cleaned);
      if (phone) {
        next.telefono = phone;
      }

      const people = extractPeople(cleaned);
      if (people) {
        next.persone = people;
      }

      const time = extractTime(cleaned);
      if (time) {
        next.orario = time;
      }

      const notes = collectSpecialNotes(cleaned);
      if (notes.length) {
        const merged = new Set([...prev.specialNotes, ...notes]);
        next.specialNotes = Array.from(merged);
      }

      return next;
    });
  };

  const maybeCreateLead = async () => {
    if (leadSubmitted) return;
    if (!tenantId) return;
    if (!conversationLog.length) return;

    const hasMinimumInfo = leadDraft.telefono || conversationLog.length >= 2;
    if (!hasMinimumInfo) return;

    const richiesta = conversationLog.join('\n');
    if (!richiesta.trim() || richiesta.trim().length < 5) return;

    const payload: Record<string, unknown> = {
      nome: leadDraft.nome ?? 'Contatto chat',
      richiesta,
      tenant_id: tenantId,
    };
    if (leadDraft.telefono) {
      payload.telefono = leadDraft.telefono;
    }
    if (leadDraft.persone) {
      payload.persone = leadDraft.persone;
    }
    if (leadDraft.orario) {
      payload.orario = leadDraft.orario;
    }

    const noteParts: string[] = [];
    if (leadDraft.intent === 'booking') {
      noteParts.push('Richiesta di prenotazione rilevata.');
    }
    if (leadDraft.specialNotes.length) {
      noteParts.push(...leadDraft.specialNotes);
    }
    if (leadDraft.persone) {
      noteParts.push(`Persone richieste: ${leadDraft.persone}`);
    }
    if (leadDraft.orario) {
      noteParts.push(`Orario desiderato: ${leadDraft.orario}`);
    }
    if (!leadDraft.telefono) {
      noteParts.push('Telefono non fornito in chat.');
    }
    if (!leadDraft.persone) {
      noteParts.push('Numero di persone non specificato.');
    }
    if (!leadDraft.orario) {
      noteParts.push('Orario non specificato.');
    }
    if (noteParts.length) {
      payload.note_interne = noteParts.join(' | ');
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.warn('Impossibile salvare il lead, risposta non OK:', res.status);
        return;
      }
      setLeadSubmitted(true);
    } catch (error) {
      console.warn('Impossibile salvare il lead:', error);
    }
  };

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;
    if (!tenantId) {
      console.error("Tenant ID non fornito, impossibile inviare il messaggio.");
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Errore di configurazione: ID assistente non trovato.' }]);
      return;
    }

    const messageId = Date.now().toString();
    const assistantMessageId = `${messageId}-assistant`;

    const newUserMessage: Message = { id: messageId, role: 'user', content: prompt };
    const placeholderAssistant: Message = { id: assistantMessageId, role: 'assistant', content: '' };
    setMessages(prevMessages => [...prevMessages, newUserMessage, placeholderAssistant]);
    detectLeadInfo(prompt);
    setIsLoading(true);

    try {
      const response = await fetch('/api/assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          tenant_id: tenantId,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        if (contentType.includes('application/json')) {
          const errorBody = await response.json();
          throw new Error(errorBody.error || 'Errore sconosciuto');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Risposta vuota dal server');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        accumulated += chunk;

        setMessages(prev =>
          prev.map(message =>
            message.id === assistantMessageId
              ? { ...message, content: (message.content || '') + chunk }
              : message
          )
        );
      }

      const tail = decoder.decode();
      if (tail) {
        accumulated += tail;
        setMessages(prev =>
          prev.map(message =>
            message.id === assistantMessageId
              ? { ...message, content: (message.content || '') + tail }
              : message
          )
        );
      }

      if (!accumulated.trim()) {
        throw new Error('Risposta vuota dal modello');
      }

      await maybeCreateLead();

    } catch (error) {
      console.error('Errore durante la chiamata API:', error);
      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: 'Spiacente, si è verificato un errore. Riprova più tardi.',
      };
      setMessages(prevMessages => {
        const filtered = prevMessages.filter(message => message.id !== assistantMessageId);
        return [...filtered, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
  };
};
