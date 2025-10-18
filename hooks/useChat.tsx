'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Message } from '@/lib/types';
import { parseChatData, type ParsedChatData } from '@/lib/chat-parser';

type AssistantConfig = {
  menu_url?: string | null;
  menu_text?: string | null;
  [key: string]: unknown;
};

export const useChat = ({ tenantId }: { tenantId: string | null }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isHydratedRef = useRef(false);
  const [assistantConfig, setAssistantConfig] = useState<AssistantConfig | null>(null);
  const [parsedData, setParsedData] = useState<ParsedChatData | null>(null);
  const [savedConversationInfo, setSavedConversationInfo] = useState<{
    customerId?: number;
    conversationId?: number;
  } | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'in_progress' | 'success' | 'error'>('idle');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const messagesRef = useRef<Message[]>([]);

  const storageKey = useMemo(
    () => (tenantId ? `chat-history-${tenantId}` : 'chat-history-default'),
    [tenantId]
  );

  const resetState = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: 'Ciao! Sono il tuo assistente virtuale. Come posso aiutarti oggi?',
    };
    setMessages([welcomeMessage]);
    messagesRef.current = [welcomeMessage];
    setParsedData(null);
    setSavedConversationInfo(null);
    setBookingStatus('idle');
    setBookingError(null);
  };

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
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

    resetState();
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

  useEffect(() => {
    if (!tenantId) return;
    let isCancelled = false;

    const loadAssistant = async () => {
      try {
        const response = await fetch('/api/assistente', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!isCancelled) {
          setAssistantConfig(data ?? null);
        }
      } catch (error) {
        console.warn('Impossibile caricare la configurazione assistente:', error);
      }
    };

    loadAssistant();

    return () => {
      isCancelled = true;
    };
  }, [tenantId]);

  const sendMessage = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;
    setSavedConversationInfo(null);
    setParsedData(null);
    setBookingStatus('idle');
    setBookingError(null);
    if (!tenantId) {
      console.error('Tenant ID non fornito, impossibile inviare il messaggio.');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Errore di configurazione: ID assistente non trovato.',
        },
      ]);
      return;
    }

    const messageId = Date.now().toString();
    const assistantMessageId = `${messageId}-assistant`;

    const baseMessages = [...messagesRef.current];
    const newUserMessage: Message = { id: messageId, role: 'user', content: trimmed };
    const placeholderAssistant: Message = { id: assistantMessageId, role: 'assistant', content: '' };
    setMessages([...baseMessages, newUserMessage, placeholderAssistant]);

    setIsLoading(true);

    let assistantContent = '';

    try {
      const payloadMessages = [...baseMessages, newUserMessage].map(({ role, content }) => ({
        role,
        content,
      }));

      const response = await fetch('/api/assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: payloadMessages,
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

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        assistantContent += chunk;

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? { ...message, content: (message.content || '') + chunk }
              : message
          )
        );
      }

      const tail = decoder.decode();
      if (tail) {
        assistantContent += tail;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? { ...message, content: (message.content || '') + tail }
              : message
          )
        );
      }

      if (!assistantContent.trim()) {
        throw new Error('Risposta vuota dal modello');
      }

      const finalMessages: Message[] = [
        ...baseMessages,
        newUserMessage,
        { id: assistantMessageId, role: 'assistant', content: assistantContent },
      ];

      const parsed = parseChatData(finalMessages);
      setParsedData(parsed);

      let customerId: number | undefined;
      let conversationId: number | undefined;

      if (parsed.nome) {
        const leadsResponse = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: finalMessages,
            nome: parsed.nome,
            telefono: parsed.telefono,
            email: parsed.email,
            intent: parsed.intent,
          }),
        });

        if (!leadsResponse.ok) {
          const errBody = await leadsResponse.json().catch(() => ({}));
          throw new Error(errBody.error || leadsResponse.statusText || 'Errore salvataggio conversazione');
        }

        const result = await leadsResponse.json();
        customerId = result?.customerId !== undefined ? Number(result.customerId) : undefined;
        conversationId = result?.conversationId !== undefined ? Number(result.conversationId) : undefined;

        setSavedConversationInfo({
          customerId,
          conversationId,
        });
        console.log('Conversazione salvata con successo:', result);
      } else {
        console.warn('Conversazione non salvata: nome del cliente non parsato.');
      }

      const shouldCreateBooking =
        parsed.intent === 'prenotazione' &&
        !!parsed.booking_date_time &&
        !!parsed.party_size &&
        typeof customerId === 'number' &&
        !Number.isNaN(customerId);

      if (shouldCreateBooking) {
        setBookingStatus('in_progress');
        setBookingError(null);

        try {
          const bookingResponse = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerId,
              conversationId,
              bookingDateTime: parsed.booking_date_time,
              partySize: parsed.party_size,
              notes: parsed.notes ?? '',
            }),
          });

          if (!bookingResponse.ok) {
            const errData = await bookingResponse.json().catch(() => ({}));
            throw new Error(errData.error || bookingResponse.statusText || 'Errore API Bookings');
          }

          const bookingResult = await bookingResponse.json();
          console.log('Prenotazione creata:', bookingResult);
          setBookingStatus('success');
        } catch (error) {
          console.error('Errore durante la creazione della prenotazione:', error);
          setBookingStatus('error');
          setBookingError(error instanceof Error ? error.message : 'Errore sconosciuto');
        }
      } else {
        setBookingStatus('idle');
      }

      setMessages(finalMessages);
    } catch (error) {
      console.error('Errore durante la chiamata API:', error);
      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: 'Spiacente, si è verificato un errore. Riprova più tardi.',
      };
      setMessages((prevMessages) => {
        const filtered = prevMessages.filter((message) => message.id !== assistantMessageId);
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
    assistantConfig,
    parsedData,
    savedConversationInfo,
    bookingStatus,
    bookingError,
  };
};
