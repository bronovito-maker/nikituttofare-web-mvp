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
  photo?: string;
}

// Slot state type
interface SlotState {
  nome?: string;
  telefono?: string;
  persone?: string;
  orario?: string;
  [key: string]: string | undefined;
}

// Lead info type
interface LeadInfo {
  nome?: string;
  telefono?: string;
  email?: string;
  [key: string]: string | undefined;
}

// Booking data type
interface BookingData {
  slots: SlotState;
  email?: string | null;
}

export const useChat = (
  options?: {
    onMessage?: (message: CustomMessage) => void;
    onError?: (error: string) => void;
  }
) => {
  const [messages, setMessages] = useState<CustomMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  
  // Additional states for booking flow
  const [parsedData, setParsedData] = useState<ParsedChatData | null>(null);
  const [slots, setSlots] = useState<SlotState>({});
  const [detectedEmail, setDetectedEmail] = useState<string | null>(null);
  const [clarifications, setClarifications] = useState<BookingClarification[]>([]);
  const [recentlyUpdatedSlots, setRecentlyUpdatedSlots] = useState<BookingSlotKey[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('nome');
  const [savedLeadInfo, setSavedLeadInfo] = useState<LeadInfo | null>(null);
  const [bookingSaved, setBookingSaved] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [highlightSlot, setHighlightSlot] = useState<BookingSlotKey | null>(null);
  const latestMessagesRef = useRef<CustomMessage[]>([]);

  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  const sendMessage = async (messageContent: string, photo?: string) => {
    if (isLoading) return;
    
    // Evita messaggi vuoti o duplicati consecutivi
    const trimmedContent = messageContent.trim();
    if (!trimmedContent && !photo) return;
    
    // Controlla se l'ultimo messaggio è identico (evita duplicati)
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user' && 
          typeof lastMessage.content === 'string' && 
          lastMessage.content.trim() === trimmedContent &&
          !photo) {
        console.warn('Messaggio duplicato ignorato');
        return;
      }
    }

    setError(null);
    setIsLoading(true);

    const userMessage: CustomMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      role: 'user',
      content: trimmedContent || 'Foto caricata',
      createdAt: new Date(),
      photo,
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);

    try {
      // Se è il primo messaggio, crea un ticket
      let ticketId = currentTicketId;
      if (!ticketId && messages.length === 0) {
        const category = detectCategory(messageContent);

        const ticketRes = await fetch('/api/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category,
            description: messageContent,
            priority: 'medium',
            address: null,
            messageContent,
            imageUrl: photo,
          }),
        });

        if (ticketRes.ok) {
          const ticketData = await ticketRes.json();
          ticketId = ticketData.ticketId as string;
          setCurrentTicketId(ticketId);
        }
      } else if (ticketId) {
        // Salva il messaggio su Supabase
        await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticketId,
            role: 'user',
            content: messageContent,
            imageUrl: photo,
          }),
        });
      }

      // Prepara il corpo della richiesta per l'AI
      const allMessages = [...messages, userMessage];
      const requestBody = {
        messages: allMessages.map(m => {
          const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
          const messageObject: { role: string; content: string; photo?: string } = { 
            role: m.role, 
            content 
          };
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
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        role: 'assistant',
        content: aiResponse,
        createdAt: new Date(),
      };
      
      // Evita duplicati
      setMessages(prevMessages => {
        const lastMsg = prevMessages[prevMessages.length - 1];
        if (lastMsg && 
            lastMsg.role === 'assistant' && 
            typeof lastMsg.content === typeof assistantMessage.content) {
          const lastContent = typeof lastMsg.content === 'string' 
            ? lastMsg.content 
            : JSON.stringify(lastMsg.content);
          const newContent = typeof assistantMessage.content === 'string'
            ? assistantMessage.content
            : JSON.stringify(assistantMessage.content);
          
          if (lastContent === newContent) {
            console.warn('Risposta duplicata ignorata');
            return prevMessages;
          }
        }
        return [...prevMessages, assistantMessage];
      });

      // Salva anche la risposta dell'AI se c'è un ticket
      if (ticketId && typeof aiResponse === 'object' && aiResponse.type === 'text') {
        await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticketId,
            role: 'assistant',
            content: aiResponse.content as string,
          }),
        });
      }

      // Callback
      if (options?.onMessage) {
        options.onMessage(assistantMessage);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(errorMessage);
      if (options?.onError) {
        options.onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Funzione helper per rilevare la categoria dal messaggio
  const detectCategory = (message: string): 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'generic' => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('idraulico') || lowerMessage.includes('acqua') || lowerMessage.includes('tubo') || lowerMessage.includes('perdita') || lowerMessage.includes('scarico')) {
      return 'plumbing';
    }
    if (lowerMessage.includes('elettric') || lowerMessage.includes('luce') || lowerMessage.includes('presa') || lowerMessage.includes('salvavita')) {
      return 'electric';
    }
    if (lowerMessage.includes('fabbro') || lowerMessage.includes('serratura') || lowerMessage.includes('chiave') || lowerMessage.includes('porta')) {
      return 'locksmith';
    }
    if (lowerMessage.includes('clima') || lowerMessage.includes('condizionatore') || lowerMessage.includes('caldaia') || lowerMessage.includes('riscaldamento')) {
      return 'climate';
    }
    
    return 'generic';
  };

  const missingSteps = useMemo<BookingSlotKey[]>(() => {
    return [];
  }, [slots]);

  const summaryReady = missingSteps.length === 0;

  const append = async (message: CustomMessage) => {
    setMessages(prev => [...prev, message]);
  };
  
  const bookingData = useMemo<BookingData>(() => {
    return {
      slots,
      email: detectedEmail,
    };
  }, [slots, detectedEmail]);

  const summaryData = null;
  const handleConfirmBooking = useCallback(async () => {
    setIsConfirming(true);
    // TODO: Implement booking confirmation
    setIsConfirming(false);
  }, []);

  const handlePillBarUpdate = (slot: BookingSlotKey, value: string) => {
    setSlots(prev => ({ ...prev, [slot]: value }));
  };

  const handlePillBarClear = (slot: BookingSlotKey) => {
    setSlots(prev => {
      const newSlots = { ...prev };
      delete newSlots[slot];
      return newSlots;
    });
  };

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
