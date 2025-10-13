'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Message } from '@/lib/types';
import {
  INITIAL_LEAD_DRAFT,
  parseLeadDraft,
  draftToSnapshot,
  LeadDraft,
  LeadSnapshot,
} from '@/lib/chat-parser';

const MIN_TRANSCRIPT_LENGTH = 5;

type AssistantConfig = {
  menu_url?: string | null;
  menu_text?: string | null;
  [key: string]: unknown;
};

export const useChat = ({ tenantId }: { tenantId: string | null }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isHydratedRef = useRef(false);
  const [conversationLog, setConversationLog] = useState<string[]>([]);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const leadDraftRef = useRef<LeadDraft>({ ...INITIAL_LEAD_DRAFT });
  const [leadDraft, setLeadDraft] = useState<LeadDraft>(leadDraftRef.current);
  const [assistantConfig, setAssistantConfig] = useState<AssistantConfig | null>(null);

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
    setConversationLog([]);
    setLeadSubmitted(false);
    leadDraftRef.current = { ...INITIAL_LEAD_DRAFT };
    setLeadDraft(leadDraftRef.current);
  };

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

  const applyLeadParsing = (message: string) => {
    const nextDraft = parseLeadDraft(leadDraftRef.current, message);
    leadDraftRef.current = nextDraft;
    setLeadDraft(nextDraft);
    return nextDraft;
  };

  const shouldPersistLead = () => {
    const transcript = conversationLog.join('\n') + '\n' + (messages[messages.length - 1]?.content ?? '');
    if (transcript.trim().length < MIN_TRANSCRIPT_LENGTH) return false;
    if (leadDraftRef.current.telefono) return true;
    return conversationLog.length >= 2;
  };

  const maybeCreateLead = async () => {
    if (leadSubmitted) return;
    if (!tenantId) return;
    if (!shouldPersistLead()) return;

    const latestAssistantMessage = messages[messages.length - 1]?.role === 'assistant'
      ? messages[messages.length - 1]?.content ?? ''
      : '';
    const transcript = [...conversationLog, latestAssistantMessage].join('\n').trim();
    if (!transcript || transcript.length < MIN_TRANSCRIPT_LENGTH) return;

    const draft = leadDraftRef.current;
    const payload: Record<string, unknown> = {
      nome: draft.nome ?? 'Contatto chat',
      richiesta: transcript,
      tenant_id: tenantId,
      intent: draft.intent,
    };
    if (draft.telefono) payload.telefono = draft.telefono;
    if (draft.specialNotes.length) payload.note_interne = draft.specialNotes.join(' | ');
    if (draft.persone) payload.persone = draft.persone;
    if (draft.orario) payload.orario = draft.orario;

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
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;
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

    const newUserMessage: Message = { id: messageId, role: 'user', content: trimmed };
    const placeholderAssistant: Message = { id: assistantMessageId, role: 'assistant', content: '' };
    setMessages((prevMessages) => [...prevMessages, newUserMessage, placeholderAssistant]);
    setConversationLog((prev) => [...prev, trimmed]);
    const draftAfterMessage = applyLeadParsing(trimmed);
    const leadSnapshot: LeadSnapshot = draftToSnapshot(draftAfterMessage);

    setIsLoading(true);

    try {
      const response = await fetch('/api/assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: trimmed,
          tenant_id: tenantId,
          lead_snapshot: leadSnapshot,
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
        accumulated += tail;
        setMessages((prev) =>
          prev.map((message) =>
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
    leadDraft,
    assistantConfig,
  };
};
