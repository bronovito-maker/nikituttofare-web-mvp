'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  parseChatData,
  type ParsedChatData,
  type BookingClarification,
  type BookingSlotKey,
} from '@/lib/chat-parser';
import type { Message as ParserMessage } from '@/lib/types';
import { AIResponseType, FormType } from '@/lib/ai-structures';

// --- CUSTOM MESSAGE TYPE ---
export interface CustomMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | AIResponseType;
  createdAt?: Date;
  photo?: string; // AGGIUNTO
}

// ... (tutti gli altri tipi e costanti rimangono invariati)

// ...

export const useChat = (
  options?: any
) => {
  const [messages, setMessages] = useState<CustomMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ... (stati esistenti)

  const sendMessage = async (messageContent: string, photo?: string) => { // AGGIUNTO photo
    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    const userMessage: CustomMessage = {
      id: String(Date.now()),
      role: 'user',
      content: messageContent,
      createdAt: new Date(),
      photo, // AGGIUNTO
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);

    try {
      // Prepara il corpo della richiesta
      const requestBody = {
        messages: [...messages, userMessage].map(m => {
          const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
          const messageObject: any = { role: m.role, content };
          if (m.photo) {
            messageObject.photo = m.photo;
          }
          return messageObject;
        })
      };

      const res = await fetch('/api/assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'API request failed');
      }

      const aiResponse: AIResponseType = await res.json();

      const assistantMessage: CustomMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: aiResponse,
        createdAt: new Date(),
      };
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // ... (resto del hook)
  const [parsedData, setParsedData] = useState<ParsedChatData | null>(null);
  const [slots, setSlots] = useState<any>(() => ({})); // createInitialSlotState());
  const [detectedEmail, setDetectedEmail] = useState<string | null>(null);
  const [clarifications, setClarifications] = useState<BookingClarification[]>([]);
  const [recentlyUpdatedSlots, setRecentlyUpdatedSlots] = useState<BookingSlotKey[]>([]);
  const [currentStep, setCurrentStep] = useState<any>('nome');
  const [savedLeadInfo, setSavedLeadInfo] = useState<any | null>(null);
  const [bookingSaved, setBookingSaved] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [highlightSlot, setHighlightSlot] = useState<BookingSlotKey | null>(null);
  const latestMessagesRef = useRef<CustomMessage[]>([]);

  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  const missingSteps = useMemo<BookingSlotKey[]>(() => {
    return [];
  }, [slots]);

  const summaryReady = missingSteps.length === 0;

  const append = async (message: CustomMessage) => {
    setMessages(prev => [...prev, message]);
  };
  
  const bookingData = useMemo<any>(() => {
    return {};
  }, [slots, detectedEmail]);

  const summaryData = null;
  const handleConfirmBooking = useCallback(async () => {}, []);
  const handlePillBarUpdate = (slot: BookingSlotKey, value: string) => {};
  const handlePillBarClear = (slot: BookingSlotKey) => {};


  return {
    messages,
    input: '',
    setInput: () => {},
    sendMessage,
    reload: () => {},
    stop: () => {},
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
    highlightSlot,
    handlePillBarUpdate,
    handlePillBarClear,
  };
};

