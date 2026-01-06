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

// Funzione di migrazione per pulire messaggi corrotti
const migrateMessages = (messages: ChatMessage[]): ChatMessage[] => {
  return messages.filter((msg) => {
    // Rimuovi messaggi auth_required senza ticketData valido
    if (typeof msg.content === 'object' && msg.content !== null) {
      const content = msg.content as AIResponseType;
      if (content.type === 'auth_required') {
        const authContent = content.content as any;
        // Se non ha ticketData o è vuoto, rimuovi il messaggio
        if (!authContent?.ticketData || Object.keys(authContent.ticketData).length === 0) {
          console.warn('Rimosso messaggio auth_required corrotto:', msg.id);
          return false;
        }
      }
    }
    return true;
  });
};

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
      version: 2, // Incrementa versione per forzare migrazione
      partialize: (state) => ({
        messages: state.messages,
        currentTicketId: state.currentTicketId,
        extractedData: state.extractedData,
        sessionId: state.sessionId,
        collectedSlots: state.collectedSlots,
      }),
      migrate: (persistedState: any, version: number) => {
        // Migrazione da v1 a v2: pulisci messaggi corrotti
        if (version < 2 && persistedState.messages) {
          console.log('🔄 Migrazione chat store v1 → v2: pulizia messaggi corrotti');
          persistedState.messages = migrateMessages(persistedState.messages);
        }
        return persistedState;
      },
    }
  )
);
