'use client';

import { useEffect, useMemo, useState } from 'react';
import { useChat as useAiChat, type Message, type UseChatOptions as VercelUseChatOptions } from 'ai/react';
import { parseChatData, type ParsedChatData } from '@/lib/chat-parser';

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

type BookingStep = 'nome' | 'telefono' | 'data' | 'orario' | 'persone' | 'allergeni' | 'riepilogo' | 'completato';

type BookingData = {
  nome?: string;
  telefono?: string;
  email?: string;
  bookingDateTime?: string;
  orario?: string;
  partySize?: number;
  allergeni?: string;
};

const STEP_ORDER: BookingStep[] = ['nome', 'telefono', 'data', 'orario', 'persone', 'allergeni'];

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
  const [bookingData, setBookingData] = useState<BookingData>({});
  const [currentStep, setCurrentStep] = useState<BookingStep>('nome');
  const [savedLeadInfo, setSavedLeadInfo] = useState<SavedLeadInfo | null>(null);
  const [bookingSaved, setBookingSaved] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

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
    if (!Array.isArray(messages) || messages.length === 0) {
      setParsedData(null);
      return;
    }

    const parsed = parseChatData(messages);
    setParsedData(parsed);

    setBookingData((prev) => {
      const next: BookingData = { ...prev };
      let changed = false;

      if (parsed.nome && parsed.nome.trim() && parsed.nome.trim() !== prev.nome) {
        next.nome = parsed.nome.trim();
        changed = true;
      }

      if (parsed.telefono && parsed.telefono.trim() && parsed.telefono.trim() !== prev.telefono) {
        next.telefono = parsed.telefono.trim();
        changed = true;
      }

      if (parsed.email && parsed.email.trim() && parsed.email.trim() !== prev.email) {
        next.email = parsed.email.trim();
        changed = true;
      }

      if (parsed.party_size && parsed.party_size !== prev.partySize) {
        next.partySize = parsed.party_size;
        changed = true;
      }

      if (parsed.booking_date_time && parsed.booking_date_time !== prev.bookingDateTime) {
        next.bookingDateTime = parsed.booking_date_time;
        next.orario = formatTimeFromISO(parsed.booking_date_time);
        changed = true;
      } else if (parsed.orario && parsed.orario !== prev.orario) {
        next.orario = parsed.orario;
        changed = true;
      }

      if (parsed.notes && parsed.notes !== prev.allergeni) {
        next.allergeni = parsed.notes;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [messages]);

  const missingSteps = useMemo(() => {
    const pending: BookingStep[] = [];

    if (!bookingData.nome) pending.push('nome');
    if (!bookingData.telefono) pending.push('telefono');
    if (!bookingData.bookingDateTime) pending.push('data');
    if (!bookingData.orario) pending.push('orario');
    if (!bookingData.partySize || bookingData.partySize <= 0) pending.push('persone');
    if (!bookingData.allergeni || !bookingData.allergeni.trim()) pending.push('allergeni');

    return pending;
  }, [bookingData]);

  const summaryReady = missingSteps.length === 0;

  useEffect(() => {
    if (bookingSaved) {
      setCurrentStep('completato');
      return;
    }

    if (!summaryReady) {
      setCurrentStep(missingSteps[0] ?? STEP_ORDER[0]);
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

  const handleConfirmBooking = async () => {
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
  };

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
    confirmBooking: handleConfirmBooking,
    isConfirming,
    confirmationError,
    resetConfirmationError: () => setConfirmationError(null),
  };
};
