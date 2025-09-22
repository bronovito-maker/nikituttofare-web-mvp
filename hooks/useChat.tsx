// File: hooks/useChat.tsx

'use client';
import { useReducer, useRef, useEffect, ChangeEvent, ReactNode } from 'react';
import { Message, Step, ChatFormState } from '@/lib/types';
import Typing from '@/components/Typing';

interface ChatState {
  messages: Message[];
  step: Step;
  input: string;
  formState: ChatFormState;
  isLoading: boolean;
  fileToUpload: File | null;
  previewUrl: string | null;
  formSummary: any;
  finalTicketId: string | null;
}

const initialState: ChatState = {
  messages: [{ role: 'assistant', content: 'Ciao! Come posso aiutarti oggi?' }],
  step: 'intro',
  input: '',
  formState: { message: '', details: {} },
  isLoading: false,
  fileToUpload: null,
  previewUrl: null,
  formSummary: null,
  finalTicketId: null,
};

type Action =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'START_SEND' }
  | { type: 'FINISH_SEND'; payload: { step: Step; botResponse: ReactNode; formSummary?: any } }
  | { type: 'UPDATE_FORM'; payload: Partial<ChatFormState> }
  | { type: 'SET_FILE'; payload: { file: File; url: string } }
  | { type: 'REMOVE_FILE' }
  | { type: 'START_CHAT'; payload: string }
  | { type: 'RESET_CHAT' }
  | { type: 'SET_TICKET_ID'; payload: string };

export const chatReducer = (state: ChatState, action: Action): ChatState => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    case 'START_SEND':
      return { ...state, isLoading: true, input: '' };
    case 'FINISH_SEND':
      const { step, botResponse, formSummary } = action.payload;
      return {
        ...state,
        step,
        formSummary: formSummary || state.formSummary,
        isLoading: false,
        messages: [...state.messages.slice(0, -1), { role: 'assistant', content: botResponse, isLoading: false }],
      };
    case 'UPDATE_FORM':
      return { ...state, formState: { ...state.formState, ...action.payload } };
    case 'SET_FILE':
      return { ...state, fileToUpload: action.payload.file, previewUrl: action.payload.url };
    case 'REMOVE_FILE':
      if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
      return { ...state, fileToUpload: null, previewUrl: null };
    case 'START_CHAT':
      return { ...state, step: 'service', formState: { ...state.formState, message: action.payload } };
    case 'SET_TICKET_ID':
      return { ...state, finalTicketId: action.payload };
    case 'RESET_CHAT':
      return initialState;
    default:
      return state;
  }
};

export const useChat = () => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { messages, step, input, formState, isLoading, fileToUpload, previewUrl, formSummary, finalTicketId } = state;

  const addMessage = (role: 'user' | 'assistant', content: ReactNode, isLoading = false) => {
    dispatch({ type: 'ADD_MESSAGE', payload: { role, content, isLoading } });
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_INPUT', payload: event.target.value });
  };

  const setFileToUpload = (file: File | null) => {
    if (file) {
      const url = URL.createObjectURL(file);
      dispatch({ type: 'SET_FILE', payload: { file, url } });
    }
  };

  const removeFile = () => {
    dispatch({ type: 'REMOVE_FILE' });
  };

  const handleSend = async (messageOverride?: string) => {
    const text = messageOverride ?? input.trim();
    if (!text && !fileToUpload) return;

    addMessage('user', text);
    dispatch({ type: 'START_SEND' });
    if (fileToUpload) removeFile();
    addMessage('assistant', <Typing />, true);

    try {
      const response = await fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, formState, step }),
      });
      if (!response.ok) throw new Error('Server error');
      const data = await response.json();
      dispatch({ type: 'FINISH_SEND', payload: { step: data.nextStep, botResponse: data.response, formSummary: data.summary } });
    } catch (error) {
      dispatch({ type: 'FINISH_SEND', payload: { step, botResponse: 'Ops, qualcosa è andato storto.' } });
    }
  };

  const startChat = (service: string) => {
    dispatch({ type: 'START_CHAT', payload: service });
    handleSend(`Voglio iniziare una richiesta per ${service}`);
  };

  const resetChat = () => dispatch({ type: 'RESET_CHAT' });

  return { ...state, handleInputChange, handleSend, startChat, resetChat, setFileToUpload, removeFile };
};