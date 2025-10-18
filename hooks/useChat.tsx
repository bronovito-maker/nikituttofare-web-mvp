'use client';

import { useState, useEffect } from 'react';
import { useCompletion } from 'ai/react';
import { Message, UseChatOptions } from 'ai';
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
  options?: Omit<UseChatOptions, 'body' | 'onFinish' | 'onError'>
) => {
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ChatData | null>(null);

  // --- MODIFICA 1: Stato per tracciare il salvataggio del Lead ---
  // Questo stato memorizza gli ID dopo che il lead è stato creato con successo
  const [savedLeadInfo, setSavedLeadInfo] = useState<SavedLeadInfo | null>(null);
  // Stato per tracciare il salvataggio della Prenotazione
  const [bookingSaved, setBookingSaved] = useState<boolean>(false);

  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
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
    setMessages,
  } = useCompletion({
    api: '/api/assist', // L'endpoint che parla con l'AI
    ...options,
    // onFinish gestisce l'orchestrazione DOPO che l'AI ha risposto
    onFinish: async (prompt, completion) => {
      setError(null); // Resetta errori precedenti

      // Ricostruisci tutti i messaggi (inclusa la risposta AI appena ricevuta)
      const currentMessages = [...messages];
      const assistantMessages: Message[] = [
        ...completion
          .split(/({[\s\S]*?})/) // Gestisce JSON misto a testo
          .filter(Boolean)
          .map((content) => ({
            id: String(Date.now()),
            role: 'assistant' as const,
            content: content.trim(),
          })),
      ];

      const allMessages = [...currentMessages, ...assistantMessages];

      // 1. Parsa la conversazione
      const parsed = parseChatData(allMessages);
      setParsedData(parsed);

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

        const hasBookingData = parsed.party_size && parsed.booking_date; // Aggiungi altri campi necessari

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
        // Gestisci l'errore (che ora è corretto)
        console.error('Errore in onFinish:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

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
    isLoading: isLoading || isLoadingConfig, // L'UI è "loading" anche durante il config
    error,
    parsedData,
    setMessages, // Esponi setMessages se serve resettare la chat
    savedLeadInfo, // Esponi per debug o UI
    bookingSaved, // Esponi per debug o UI
  };
};
