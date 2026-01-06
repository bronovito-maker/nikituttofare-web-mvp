// lib/stores/chat-store.ts
// Zustand store for chat state management with Slot Filling

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIResponseType } from '@/lib/ai-structures';

// Message type with strict typing
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | AIResponseType;
  createdAt: Date;
  photo?: string;
}

// Slot status per UI feedback
export interface ConversationSlots {
  phoneNumber?: string;
  serviceAddress?: string;
  problemCategory?: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'handyman' | 'generic';
  problemDetails?: string;
  urgencyLevel?: 'emergency' | 'today' | 'this_week' | 'flexible';
}

// Ticket data extracted from conversation
export interface ExtractedTicketData {
  category: 'plumbing' | 'electric' | 'locksmith' | 'climate' | 'handyman' | 'generic';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  description: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface ChatState {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentTicketId: string | null;
  extractedData: ExtractedTicketData | null;
  isConfirmationPending: boolean;
  sessionId: string;
  collectedSlots: ConversationSlots;
  missingSlots: string[];
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'createdAt'>) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentTicketId: (id: string | null) => void;
  setExtractedData: (data: ExtractedTicketData | null) => void;
  setConfirmationPending: (pending: boolean) => void;
  updateSlots: (slots: Partial<ConversationSlots>, missing: string[]) => void;
  clearChat: () => void;
  generateSessionId: () => string;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      isLoading: false,
      error: null,
      currentTicketId: null,
      extractedData: null,
      isConfirmationPending: false,
      sessionId: generateId(),
      collectedSlots: {},
      missingSlots: ['phoneNumber', 'serviceAddress', 'problemCategory', 'problemDetails'],

      // Actions
      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateId(),
          createdAt: new Date(),
        };
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      },

      setMessages: (messages) => set({ messages }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      setCurrentTicketId: (id) => set({ currentTicketId: id }),

      setExtractedData: (data) => set({ extractedData: data }),

      setConfirmationPending: (pending) => set({ isConfirmationPending: pending }),

      updateSlots: (slots, missing) => set((state) => ({
        collectedSlots: { ...state.collectedSlots, ...slots },
        missingSlots: missing,
      })),

      clearChat: () => set({
        messages: [],
        error: null,
        currentTicketId: null,
        extractedData: null,
        isConfirmationPending: false,
        sessionId: generateId(),
        collectedSlots: {},
        missingSlots: ['phoneNumber', 'serviceAddress', 'problemCategory', 'problemDetails'],
      }),

      generateSessionId: () => {
        const newId = generateId();
        set({ sessionId: newId });
        return newId;
      },
    }),
    {
      name: 'ntf-chat-storage',
      partialize: (state) => ({
        messages: state.messages,
        currentTicketId: state.currentTicketId,
        extractedData: state.extractedData,
        sessionId: state.sessionId,
        collectedSlots: state.collectedSlots,
      }),
    }
  )
);
