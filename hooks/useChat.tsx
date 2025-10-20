'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat as useAiChat, type Message, type UseChatOptions as VercelUseChatOptions } from 'ai/react';
import {
  parseChatData,
  type ParsedChatData,
  type BookingClarification,
  type BookingSlotKey,
} from '@/lib/chat-parser';

type SavedLeadInfo = {
  customerId: string;
  conversationId: string;
};

type LeadsApiResponse = {
  message: string;
  customerId: string;
  conversationId: string;
};

type BookingsApiResponse = {
  message: string;
  bookingId: string;
};

type BookingStep = BookingSlotKey | 'riepilogo' | 'completato';

type SlotSource = 'parser' | 'manual';

type SlotState = {
  value: string | number | null;
  isFilled: boolean;
  source: SlotSource | null;
  updatedAt: number | null;
  needsClarification: boolean;
  clarificationReason: string | null;
  clarificationPhrase: string | null;
};

type BookingSlots = Record<BookingSlotKey, SlotState>;

type BookingData = {
  nome?: string;
  telefono?: string;
  email?: string;
  bookingDateTime?: string;
  orario?: string;
  partySize?: number;
  allergeni?: string;
};

const SLOT_KEYS: BookingSlotKey[] = ['nome', 'telefono', 'data', 'orario', 'persone', 'allergeni'];

const CONFIRMATION_PHRASES = [
  /\bconfermo\b/i,
  /\bva\s+ben(?:e|issimo)\b/i,
  /\bok\s*confermo\b/i,
  /\bok\s*va\s*ben(?:e|issimo)?\b/i,
  /\bperfetto\b/i,
  /\bproced(?:i(?:amo)?|iamo)\b/i,
  /\bpuoi\s+procedere\b/i,
  /\bconferma\s+pure\b/i,
  /\btutto\s+ok\b/i,
  /\btutto\s+perfetto\b/i,
  /\bandiamo\s+avanti\b/i,
];

const SIMPLE_CONFIRMATION_WORDS = ['si', 'sì', 'certo', 'assolutamente'];

const createInitialSlotState = (): BookingSlots =>
  SLOT_KEYS.reduce((acc, key) => {
    acc[key] = {
      value: null,
      isFilled: false,
      source: null,
      updatedAt: null,
      needsClarification: false,
      clarificationReason: null,
      clarificationPhrase: null,
    };
    return acc;
  }, {} as BookingSlots);

const normalizeSlotValue = (key: BookingSlotKey, value: unknown): string | number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (key === 'persone') {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }
    const numeric = Number(String(value).replace(/[^\d]/g, ''));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  switch (key) {
    case 'telefono': {
      const sanitized = raw.replace(/[^\d+]/g, '');
      if (!sanitized) return null;
      if (sanitized.startsWith('+')) {
        const normalized = `+${sanitized.slice(1).replace(/[+]/g, '')}`;
        return normalized === '+' ? null : normalized;
      }
      return sanitized;
    }
    case 'data': {
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString();
    }
    case 'orario': {
      const match = raw.match(/(\d{1,2})(?::(\d{2}))?/);
      if (!match) return null;
      const hours = match[1].padStart(2, '0');
      const minutes = match[2] ?? '00';
      return `${hours}:${minutes}`;
    }
    default:
      return raw;
  }
};

const areSlotValuesEqual = (
  key: BookingSlotKey,
  current: SlotState['value'],
  incoming: SlotState['value']
) => {
  if (current === incoming) return true;
  if (current === null || incoming === null) return false;

  if (key === 'persone') {
    return Number(current) === Number(incoming);
  }

  return String(current).trim().toLowerCase() === String(incoming).trim().toLowerCase();
};

const formatTimeFromISO = (iso: string | undefined) => {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
};

const sanitizeMessages = (messages: Message[]) =>
  messages.map(({ id, role, content }) => ({ id, role, content }));

export const useChat = (
  options?: Omit<VercelUseChatOptions, 'api' | 'onFinish' | 'onError'>
) => {
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedChatData | null>(null);
  const [slots, setSlots] = useState<BookingSlots>(() => createInitialSlotState());
  const [detectedEmail, setDetectedEmail] = useState<string | null>(null);
  const [clarifications, setClarifications] = useState<BookingClarification[]>([]);
  const [recentlyUpdatedSlots, setRecentlyUpdatedSlots] = useState<BookingSlotKey[]>([]);
  const [currentStep, setCurrentStep] = useState<BookingStep>('nome');
  const [savedLeadInfo, setSavedLeadInfo] = useState<SavedLeadInfo | null>(null);
  const [bookingSaved, setBookingSaved] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const confirmationMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoadingConfig(true);
        const response = await fetch('/api/assistente');
        if (!response.ok) {
          throw new Error('Errore nel caricamento della configurazione assistente');
        }
        await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  const { messages, append, reload, stop, isLoading, input, setInput } = useAiChat({
    api: '/api/assist',
    ...(options ?? {}),
    onError: (err) => {
      setError(err.message);
    },
  });

  useEffect(() => {
    let cancelled = false;

    if (!Array.isArray(messages) || messages.length === 0) {
      setParsedData(null);
      setSlots(createInitialSlotState());
      setDetectedEmail(null);
      setClarifications([]);
      setRecentlyUpdatedSlots([]);
      confirmationMessageIdsRef.current.clear();
      return () => {};
    }

    const runParse = async () => {
      try {
        const parsed = await parseChatData(messages);
        if (cancelled) return;

        setParsedData(parsed);
        setClarifications(parsed.clarifications ?? []);

        if (parsed.email && parsed.email.trim()) {
          const normalizedEmail = parsed.email.trim().toLowerCase();
          setDetectedEmail((prev) => (prev === normalizedEmail ? prev : normalizedEmail));
        }

        const clarificationsBySlot = (parsed.clarifications ?? []).reduce(
          (acc, clarification) => {
            acc[clarification.slot] = clarification;
            return acc;
          },
          {} as Partial<Record<BookingSlotKey, BookingClarification>>
        );
        const derivedTime =
          !parsed.orario && parsed.booking_date_time ? formatTimeFromISO(parsed.booking_date_time) : null;
        const changedSlots: BookingSlotKey[] = [];

        setSlots((prev) => {
          let hasChange = false;
          const next: BookingSlots = { ...prev };

          const applyClarificationMeta = (
            slot: SlotState,
            meta: BookingClarification | undefined
          ) => {
            const needsClarification = Boolean(meta);
            const clarificationReason = meta?.reason ?? null;
            const clarificationPhrase = meta?.phrase ?? null;

            if (
              slot.needsClarification !== needsClarification ||
              slot.clarificationReason !== clarificationReason ||
              slot.clarificationPhrase !== clarificationPhrase
            ) {
              hasChange = true;
              return {
                ...slot,
                needsClarification,
                clarificationReason,
                clarificationPhrase,
              };
            }

            return slot;
          };

          const updateSlot = (
            key: BookingSlotKey,
            incoming: unknown,
            source: SlotSource = 'parser'
          ) => {
            const normalized = normalizeSlotValue(key, incoming);
            const currentSlot = prev[key];
            const slotClarification = clarificationsBySlot[key];
            let updatedSlot = applyClarificationMeta(currentSlot, slotClarification);

            if (normalized === null) {
              next[key] = updatedSlot;
              return;
            }

            const isSameValue =
              updatedSlot.isFilled && areSlotValuesEqual(key, updatedSlot.value, normalized);

            if (isSameValue) {
              if (updatedSlot.source !== source) {
                hasChange = true;
                updatedSlot = { ...updatedSlot, source };
              }
              next[key] = updatedSlot;
              return;
            }

            hasChange = true;
            if (!changedSlots.includes(key)) {
              changedSlots.push(key);
            }
            next[key] = {
              ...updatedSlot,
              value: normalized,
              isFilled: true,
              source,
              updatedAt: Date.now(),
            };
          };

          updateSlot('nome', parsed.nome);
          updateSlot('telefono', parsed.telefono);
          updateSlot('persone', parsed.party_size ?? parsed.persone);
          updateSlot('allergeni', parsed.notes);
          updateSlot('orario', parsed.orario ?? derivedTime);
          updateSlot('data', parsed.booking_date_time);

          SLOT_KEYS.forEach((key) => {
            const slotClarification = clarificationsBySlot[key];
            const currentSlot = next[key];
            const updatedSlot = applyClarificationMeta(currentSlot, slotClarification);
            if (updatedSlot !== currentSlot) {
              next[key] = updatedSlot;
            }
          });

          if (!hasChange) {
            return prev;
          }

          return next;
        });

        setRecentlyUpdatedSlots(changedSlots);
      } catch (parseError) {
        console.error('Errore durante l\'analisi della chat:', parseError);
        setRecentlyUpdatedSlots([]);
      }
    };

    runParse();

    return () => {
      cancelled = true;
    };
  }, [messages]);

  const bookingData = useMemo<BookingData>(() => {
    const resolveSlotValue = (key: BookingSlotKey) => {
      const slot = slots[key];
      if (!slot.isFilled || slot.needsClarification) return null;
      return slot.value;
    };

    const resolvedNome = resolveSlotValue('nome');
    const resolvedTelefono = resolveSlotValue('telefono');
    const resolvedPartySize = resolveSlotValue('persone');
    const resolvedAllergeni = resolveSlotValue('allergeni');
    const resolvedDateIso = resolveSlotValue('data');
    const resolvedTimeValue = resolveSlotValue('orario');

    const isoDate = typeof resolvedDateIso === 'string' ? resolvedDateIso : null;
    const explicitTime = typeof resolvedTimeValue === 'string' ? resolvedTimeValue : null;

    const fallbackTime = isoDate ? formatTimeFromISO(isoDate) : undefined;

    return {
      nome: typeof resolvedNome === 'string' ? resolvedNome : undefined,
      telefono: typeof resolvedTelefono === 'string' ? resolvedTelefono : undefined,
      email: detectedEmail ?? undefined,
      bookingDateTime: isoDate ?? undefined,
      orario: explicitTime ?? fallbackTime ?? undefined,
      partySize: typeof resolvedPartySize === 'number' ? resolvedPartySize : undefined,
      allergeni: typeof resolvedAllergeni === 'string' ? resolvedAllergeni : undefined,
    };
  }, [slots, detectedEmail]);

  const missingSteps = useMemo<BookingSlotKey[]>(() => {
    return SLOT_KEYS.filter((key) => {
      const slot = slots[key];
      return !slot.isFilled || slot.needsClarification;
    });
  }, [slots]);

  const summaryReady = missingSteps.length === 0;

  const isAffirmativeConfirmation = useCallback((rawContent: string) => {
    if (!rawContent) return false;

    const normalized = rawContent
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim();

    if (!normalized) return false;
    if (normalized.includes('?')) return false;

    const negativeMarkers = ['non ', ' no', ' ma ', ' pero', ' perche', ' preferirei', ' cambi', ' cambiare', ' attende', ' aspetta', ' attesa'];
    if (negativeMarkers.some((marker) => normalized.includes(marker))) {
      return false;
    }

    if (CONFIRMATION_PHRASES.some((regex) => regex.test(rawContent))) {
      return true;
    }

    const cleaned = normalized.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) return false;

    if (cleaned.startsWith('conferma')) return true;
    if (cleaned.startsWith('procedi')) return true;
    if (cleaned.includes('puoi procedere')) return true;
    if (cleaned.includes('puoi confermare')) return true;

    const simpleTokens = cleaned.split(' ');
    if (simpleTokens.length <= 3 && SIMPLE_CONFIRMATION_WORDS.includes(simpleTokens[0])) {
      return true;
    }

    const affirmativeStarts = [
      'si confermo',
      'si va bene',
      'si perfetto',
      'si grazie',
      'si procedi',
      'si tutto ok',
      'si tutto perfetto',
      'ok procedi',
      'ok perfetto',
      'ok va bene',
      'tutto ok',
      'tutto perfetto',
    ];

    if (affirmativeStarts.some((phrase) => cleaned.startsWith(phrase))) {
      return true;
    }

    return false;
  }, []);

  useEffect(() => {
    if (bookingSaved) {
      setCurrentStep('completato');
      return;
    }

    if (!summaryReady) {
      setCurrentStep(missingSteps[0] ?? SLOT_KEYS[0]);
    } else {
      setCurrentStep('riepilogo');
    }
  }, [bookingSaved, missingSteps, summaryReady]);

  const summaryData = useMemo(() => {
    if (!summaryReady) return null;

    const date = bookingData.bookingDateTime ? new Date(bookingData.bookingDateTime) : null;
    const dateDisplay = date
      ? date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : undefined;
    const timeDisplay =
      bookingData.orario ??
      (date ? date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : undefined);

    return {
      nome: bookingData.nome || '',
      telefono: bookingData.telefono || '',
      partySize: bookingData.partySize || 0,
      allergeni: bookingData.allergeni || '',
      bookingDateTime: bookingData.bookingDateTime || '',
      dateDisplay,
      timeDisplay,
    };
  }, [bookingData, summaryReady]);

  const handleConfirmBooking = useCallback(async () => {
    setConfirmationError(null);

    if (!summaryReady) {
      setConfirmationError('Completa tutti i passaggi della checklist prima di confermare.');
      return;
    }

    if (
      !bookingData.nome ||
      !bookingData.telefono ||
      !bookingData.bookingDateTime ||
      !bookingData.partySize
    ) {
      setConfirmationError('Dati prenotazione incompleti. Controlla nome, telefono, data/orario e numero persone.');
      return;
    }

    setIsConfirming(true);
    try {
      let leadInfo = savedLeadInfo;

      if (!leadInfo) {
        const leadsResponse = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: sanitizeMessages(messages),
            nome: bookingData.nome,
            telefono: bookingData.telefono,
            email: bookingData.email ?? parsedData?.email ?? null,
            intent: 'prenotazione',
            booking_date_time: bookingData.bookingDateTime,
            party_size: bookingData.partySize,
            notes: bookingData.allergeni ?? parsedData?.notes ?? '',
          }),
        });

        if (!leadsResponse.ok) {
          const errBody = await leadsResponse.json().catch(() => ({}));
          throw new Error(errBody.error || 'Errore durante il salvataggio del cliente/conversazione.');
        }

        const leadResult: LeadsApiResponse = await leadsResponse.json();
        setSavedLeadInfo(leadResult);
        leadInfo = leadResult;
      }

      if (!leadInfo) {
        throw new Error('Lead non disponibile dopo la creazione.');
      }

      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: leadInfo.customerId,
          conversationId: leadInfo.conversationId,
          bookingDateTime: bookingData.bookingDateTime,
          partySize: bookingData.partySize,
          notes: bookingData.allergeni ?? parsedData?.notes ?? '',
        }),
      });

      if (!bookingResponse.ok) {
        const errBody = await bookingResponse.json().catch(() => ({}));
        throw new Error(errBody.error || 'Errore durante il salvataggio della prenotazione.');
      }

      const bookingResult: BookingsApiResponse = await bookingResponse.json();
      setBookingSaved(true);

      if (process.env.NODE_ENV !== 'production') {
        console.debug('[useChat] Prenotazione confermata:', bookingResult);
      }
    } catch (err) {
      console.error('Errore durante la conferma prenotazione:', err);
      setConfirmationError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsConfirming(false);
    }
  }, [
    summaryReady,
    bookingData.nome,
    bookingData.telefono,
    bookingData.bookingDateTime,
    bookingData.partySize,
    bookingData.email,
    bookingData.allergeni,
    savedLeadInfo,
    messages,
    parsedData?.email,
    parsedData?.notes,
  ]);

  useEffect(() => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return;
    }

    if (!summaryReady || bookingSaved || isConfirming) {
      return;
    }

    const lastUserMessage = [...messages].reverse().find((msg) => msg.role === 'user');
    if (!lastUserMessage) {
      return;
    }

    if (confirmationMessageIdsRef.current.has(lastUserMessage.id)) {
      return;
    }

    if (isAffirmativeConfirmation(lastUserMessage.content ?? '')) {
      confirmationMessageIdsRef.current.add(lastUserMessage.id);
      void handleConfirmBooking();
    }
  }, [
    messages,
    summaryReady,
    bookingSaved,
    isConfirming,
    handleConfirmBooking,
    isAffirmativeConfirmation,
  ]);

  const sendMessage = async (messageContent: string) => {
    if (isLoadingConfig) {
      setError('Configurazione assistente ancora in caricamento.');
      return;
    }
    setError(null);

    const userMessage: Message = {
      id: String(Date.now()),
      role: 'user',
      content: messageContent,
    };

    await append(userMessage);
  };

  return {
    messages,
    input,
    setInput,
    sendMessage,
    reload,
    stop,
    isLoading: isLoading || isLoadingConfig,
    error,
    parsedData,
    bookingData,
    currentStep,
    missingSteps,
    summaryReady,
    summaryData,
    bookingSaved,
    savedLeadInfo,
    slotState: slots,
    clarifications,
    recentlyUpdatedSlots,
    confirmBooking: handleConfirmBooking,
    isConfirming,
    confirmationError,
    resetConfirmationError: () => setConfirmationError(null),
  };
};
