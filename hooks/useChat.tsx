'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Message } from '@/lib/types';

export const useChat = ({ tenantId }: { tenantId: string | null }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isHydratedRef = useRef(false);
  const [conversationLog, setConversationLog] = useState<string[]>([]);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadInfo, setLeadInfo] = useState<{ nome?: string; telefono?: string }>({});

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
    setLeadInfo({});
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

    const phoneMatch = cleaned.match(/(\+?\d[\d\s\-\/]{6,})/);
    if (phoneMatch) {
      const normalized = phoneMatch[0].replace(/[^\d\+]/g, '');
      if (normalized.replace(/\D/g, '').length >= 7) {
        setLeadInfo((prev) =>
          prev.telefono ? prev : { ...prev, telefono: normalized }
        );
      }
    }

    if (!leadInfo.nome) {
      const miChiamoMatch = cleaned.match(/mi chiamo\s+([A-Za-zÀ-ÿ' ]+)/i);
      let possibleName: string | undefined;
      if (miChiamoMatch) {
        possibleName = miChiamoMatch[1]?.trim().split(/[\s,\.]/)[0];
      } else {
        const firstToken = cleaned.split(/[\s,\.!?]/).find((token) => /^[A-Za-zÀ-ÿ']{2,}$/.test(token));
        if (firstToken) {
          possibleName = firstToken;
        }
      }

      if (possibleName) {
        const capitalized =
          possibleName.charAt(0).toUpperCase() + possibleName.slice(1).toLowerCase();
        setLeadInfo((prev) => ({ ...prev, nome: capitalized }));
      }
    }
  };

  const maybeCreateLead = async () => {
    if (leadSubmitted) return;
    if (!tenantId) return;
    if (!leadInfo.telefono) return;
    if (!conversationLog.length) return;

    const richiesta = conversationLog.join('\n');
    if (!richiesta.trim()) return;

    const payload = {
      nome: leadInfo.nome ?? 'Contatto chat',
      email: '', // opzionale, non sempre disponibile
      telefono: leadInfo.telefono,
      richiesta,
      tenant_id: tenantId,
    };

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
