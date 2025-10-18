'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat as useAiChat, type Message, type UseChatOptions as VercelUseChatOptions } from 'ai/react';
import { parseChatData, ChatData } from '@/lib/chat-parser'; // Assicurati che ChatData sia esportato

// Definisci un tipo per gli ID salvati
type SavedLeadInfo = {
  customerId: string;
  conversationId: string;
};

// Definisci un tipo per la risposta dell'API leads
type LeadsApiResponse = {
  message: string;
  customerId: string;
  conversationId: string;
};

// Definisci un tipo per la risposta dell'API bookings
type BookingsApiResponse = {
  message: string;
  bookingId: string;
};

export const useChat = (
  options?: Omit<VercelUseChatOptions, 'api' | 'onFinish' | 'onError'>
) => {
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ChatData | null>(null);

  // --- MODIFICA 1: Stato per tracciare il salvataggio del Lead ---
  // Questo stato memorizza gli ID dopo che il lead è stato creato con successo
  const [savedLeadInfo, setSavedLeadInfo] = useState<SavedLeadInfo | null>(null);
  // Stato per tracciare il salvataggio della Prenotazione
  const [bookingSaved, setBookingSaved] = useState<boolean>(false);

  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // 1. Carica la configurazione iniziale (prompt di sistema)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoadingConfig(true);
        const response = await fetch('/api/assistente'); // Endpoint che ottiene la config
        if (!response.ok) {
          throw new Error('Errore nel caricamento della configurazione assistente');
        }
        const config = await response.json();
        // Costruiamo un prompt iniziale se la configurazione lo prevede
        // (In alternativa, questo può essere gestito in /api/assist)
        // Per ora, ci assicuriamo solo che il backend sia pronto.
        // Se /api/assist carica il prompt dinamicamente, non serve setInitialPrompt
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  const {
    messages,
    append,
    reload,
    stop,
    isLoading,
    input,
    setInput,
  } = useAiChat({
    api: '/api/assist',
    ...(options ?? {}),
    onError: (err) => {
      setError(err.message);
    },
  });

  const processedAssistantIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') {
      return;
    }

    if (processedAssistantIds.current.has(lastMessage.id)) {
      return;
    }

    processedAssistantIds.current.add(lastMessage.id);

    const allMessages = [...messages];
    const parsed = parseChatData(allMessages);
    setParsedData(parsed);

    (async () => {
      setError(null);

      try {
        // --- MODIFICA 2: Logica di Orchestrazione "Intelligente" ---

        // FASE A: Salvare il Lead (Cliente + Conversazione)
        // Esegui solo se:
        // 1. NON abbiamo ancora salvato un lead (savedLeadInfo è nullo)
        // 2. ABBIAMO un nome parsato (parsed.nome esiste)

        let currentLeadInfo = savedLeadInfo;

        if (!currentLeadInfo && parsed.nome) {
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[useChat] Rilevato nome, tento salvataggio lead...');
          }

          const leadsResponse = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: allMessages,
              ...parsed,
            }),
          });

          if (!leadsResponse.ok) {
            const errBody = await leadsResponse.json().catch(() => ({}));
            throw new Error(errBody.error || 'Errore salvataggio conversazione');
          }

          const result: LeadsApiResponse = await leadsResponse.json();
          setSavedLeadInfo(result); // <-- SALVA GLI ID NELLO STATO
          currentLeadInfo = result; // Aggiorna la variabile locale per la Fase B

          if (process.env.NODE_ENV !== 'production') {
            console.debug('[useChat] Lead salvato con successo:', result);
          }
        }

        // FASE B: Salvare la Prenotazione
        // Esegui solo se:
        // 1. ABBIAMO un lead salvato (currentLeadInfo esiste)
        // 2. L'intento è 'prenotazione'
        // 3. Abbiamo i dati minimi (party_size, booking_date)
        // 4. NON abbiamo ancora salvato la prenotazione (bookingSaved è false)

        const bookingDate = (parsed as any).booking_date ?? parsed.booking_date_time;
        const hasBookingData = Boolean(parsed.party_size && bookingDate);

        if (
          currentLeadInfo &&
          parsed.intent === 'prenotazione' &&
          hasBookingData &&
          !bookingSaved
        ) {
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[useChat] Dati prenotazione rilevati, tento salvataggio...');
          }

          const bookingResponse = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...parsed, // Invia tutti i dati parsati
              customer_id: currentLeadInfo.customerId,
              conversation_id: currentLeadInfo.conversationId,
            }),
          });

          if (!bookingResponse.ok) {
            const errBody = await bookingResponse.json().catch(() => ({}));
            throw new Error(errBody.error || 'Errore salvataggio prenotazione');
          }

          const bookingResult: BookingsApiResponse = await bookingResponse.json();
          setBookingSaved(true); // <-- IMPOSTA IL FLAG

          if (process.env.NODE_ENV !== 'production') {
            console.debug('[useChat] Prenotazione salvata con successo:', bookingResult);
          }
        }
      } catch (err) {
        console.error('Errore durante la gestione dei messaggi:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [messages, savedLeadInfo, bookingSaved]);

  // Funzione wrapper per inviare messaggi (usata dall'UI)
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

    // Aggiungi il messaggio dell'utente all'UI e invia all'AI
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
    savedLeadInfo,
    bookingSaved,
  };
};
