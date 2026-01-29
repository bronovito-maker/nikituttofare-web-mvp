'use client';

import { useCallback, useState } from 'react';
import { AIResponseType } from '@/lib/ai-structures';

// --- CUSTOM MESSAGE TYPE ---
export interface CustomMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | AIResponseType;
  createdAt?: Date;
  photo?: string;
}

// --- HELPER FUNCTIONS ---

const detectCategory = (message: string): 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'generic' => {
  const lowerMessage = message.toLowerCase();
  const plumbingKeywords = ['idraulico', 'acqua', 'tubo', 'perdita', 'scarico'];
  const electricKeywords = ['elettric', 'luce', 'presa', 'salvavita'];
  const locksmithKeywords = ['fabbro', 'serratura', 'chiave', 'porta'];
  const climateKeywords = ['clima', 'condizionatore', 'caldaia', 'riscaldamento'];

  if (plumbingKeywords.some(kw => lowerMessage.includes(kw))) return 'plumbing';
  if (electricKeywords.some(kw => lowerMessage.includes(kw))) return 'electric';
  if (locksmithKeywords.some(kw => lowerMessage.includes(kw))) return 'locksmith';
  if (climateKeywords.some(kw => lowerMessage.includes(kw))) return 'climate';

  return 'generic';
};

const createNewTicket = async (content: string, photo?: string): Promise<string | null> => {
  try {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: detectCategory(content),
        description: content,
        priority: 'medium',
        messageContent: content,
        imageUrl: photo,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.ticketId as string;
  } catch {
    return null;
  }
};

const saveMessage = async (ticketId: string, message: CustomMessage): Promise<void> => {
  try {
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketId,
        role: message.role,
        content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
        imageUrl: message.photo,
      }),
    });
  } catch (error) {
    console.error("Failed to save message:", error);
  }
};

const fetchAiResponse = async (messages: CustomMessage[], lockedSlots?: any): Promise<AIResponseType> => {
  const body = {
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
      photo: m.photo,
    })),
    lockedSlots,
  };

  const res = await fetch('/api/assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'API request failed' }));
    throw new Error(errorData.error);
  }
  return res.json();
};

const preSendMessageChecks = (
  isLoading: boolean,
  messageContent: string,
  photo: string | undefined,
  messages: CustomMessage[],
): { pass: boolean; trimmedContent: string } => {
  if (isLoading) return { pass: false, trimmedContent: '' };

  const trimmedContent = messageContent.trim();
  if (!trimmedContent && !photo) return { pass: false, trimmedContent: '' };

  const lastUserMessage = messages.findLast(m => m.role === 'user');
  if (lastUserMessage?.content === trimmedContent && !photo) {
    console.warn('Duplicate message ignored');
    return { pass: false, trimmedContent: '' };
  }
  return { pass: true, trimmedContent };
};

const handleTicketLogic = async (
  currentTicketId: string | null,
  content: string,
  photo: string | undefined,
): Promise<string | null> => {
  if (currentTicketId) {
    return currentTicketId;
  }
  return createNewTicket(content, photo);
};

const appendUserMessage = (
  content: string,
  photo: string | undefined,
  appendMessage: (message: CustomMessage) => void,
): CustomMessage => {
  const userMessage: CustomMessage = {
    id: `${Date.now()}`,
    role: 'user',
    content: content || 'Foto caricata',
    createdAt: new Date(),
    photo,
  };
  appendMessage(userMessage);
  return userMessage;
};

const processAndAppendAiResponse = async (
  messages: CustomMessage[],
  lockedSlots: any,
  ticketId: string | null,
  appendMessage: (message: CustomMessage) => void,
  onMessage: ((message: CustomMessage) => void) | undefined,
) => {
  const aiResponse = await fetchAiResponse(messages, lockedSlots);

  const assistantMessage: CustomMessage = {
    id: `${Date.now()}-ai`,
    role: 'assistant',
    content: aiResponse,
    createdAt: new Date(),
  };
  appendMessage(assistantMessage);

  if (ticketId && aiResponse.type === 'text') {
    await saveMessage(ticketId, assistantMessage);
  }

  onMessage?.(assistantMessage);
};

const handleError = (
  error: any,
  onError: ((error: string) => void) | undefined,
  appendMessage: (message: CustomMessage) => void,
) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  onError?.(errorMessage);
  appendMessage({
    id: `${Date.now()}-error`,
    role: 'assistant',
    content: { type: 'text', content: `Si è verificato un errore: ${errorMessage}` },
    createdAt: new Date(),
  });
};

export const useChat = (options?: { onMessage?: (message: CustomMessage) => void; onError?: (error: string) => void; }) => {
  const [messages, setMessages] = useState<CustomMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  const [lockedSlots, setLockedSlots] = useState({});

  const appendMessage = useCallback((message: CustomMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const handleSendMessage = async (messageContent: string, photo?: string) => {
    const checks = preSendMessageChecks(isLoading, messageContent, photo, messages);
    if (!checks.pass) return;

    setIsLoading(true);
    setError(null);

    const userMessage = appendUserMessage(checks.trimmedContent, photo, appendMessage);
    const updatedMessages = [...messages, userMessage];

    try {
      const ticketId = await handleTicketLogic(currentTicketId, checks.trimmedContent, photo);
      if (ticketId && ticketId !== currentTicketId) {
        setCurrentTicketId(ticketId);
      }

      if (ticketId) {
        await saveMessage(ticketId, userMessage);
      }

      await processAndAppendAiResponse(updatedMessages, lockedSlots, ticketId, appendMessage, options?.onMessage);
    } catch (err) {
      handleError(err, options?.onError, appendMessage);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const onConfirm = (type: string, data?: any) => {
    if (type === 'quote') {
      setLockedSlots(prev => ({ ...prev, userConfirmed: true, quoteRejected: false }));
      handleSendMessage("Ok, accetto il preventivo, procediamo.");
    }
  };

  const onReject = (type: string, data?: any) => {
    if (type === 'quote') {
      setLockedSlots(prev => ({ ...prev, userConfirmed: false, quoteRejected: true }));
      handleSendMessage("No, non accetto il preventivo per ora.");
    }
  };


  return {
    messages,
    isLoading,
    error,
    sendMessage: handleSendMessage,
    onConfirm,
    onReject,
    // Keep other exports for compatibility if they are used elsewhere
    input: '', setInput: () => { }, reload: () => { }, stop: () => { },
    parsedData: null, bookingData: null, currentStep: '', missingSteps: [],
    summaryReady: false, summaryData: null, bookingSaved: false, savedLeadInfo: null,
    slotState: {}, clarifications: [], recentlyUpdatedSlots: [],
    confirmBooking: async () => { }, isConfirming: false, confirmationError: null,
    resetConfirmationError: () => { }, highlightSlot: null,
    handlePillBarUpdate: () => { }, handlePillBarClear: () => { },
  };
};