'use client';
import { useReducer, useRef, useEffect } from 'react';
import { Message, Step, ChatFormState } from '@/lib/types';
import Typing from '@/components/Typing';

interface ChatState {
  messages: Message[];
  step: Step;
  input: string;
  formState: ChatFormState;
  isLoading: boolean;
  progress: number;
  fileToUpload: File | null;
  previewUrl: string | null;
  formSummary: any;
  finalTicketId: string | null;
}

const initialState: ChatState = {
  messages: [{ role: 'assistant', content: 'Ciao! Come posso aiutarti oggi?' }],
  step: 'intro',
  input: '',
  formState: {},
  isLoading: false,
  progress: 0,
  fileToUpload: null,
  previewUrl: null,
  formSummary: null,
  finalTicketId: null,
};

type Action =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_LAST_MESSAGE'; payload: { content: string | React.ReactNode; isLoading?: boolean } }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'START_SEND' }
  | { type: 'FINISH_SEND'; payload: { step: Step; botResponse: string | React.ReactNode; formSummary?: any; progress?: number } }
  | { type: 'UPDATE_FORM'; payload: Partial<ChatFormState> }
  | { type: 'SET_FILE'; payload: { file: File; url: string } }
  | { type: 'REMOVE_FILE' }
  | { type: 'START_CHAT'; payload: string }
  | { type: 'RESET_CHAT' }
  | { type: 'SET_TICKET_ID'; payload: string };

export const chatReducer = (state: ChatState, action: Action): ChatState => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'UPDATE_LAST_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg, index) =>
          index === state.messages.length - 1 ? { ...msg, ...action.payload } : msg
        ),
      };
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    case 'START_SEND':
      return { ...state, isLoading: true, input: '' };
    case 'FINISH_SEND':
      const { step, botResponse, formSummary, progress } = action.payload;
      return {
        ...state,
        step,
        formSummary: formSummary || state.formSummary,
        progress: progress !== undefined ? progress : state.progress,
        isLoading: false,
        messages: state.messages.map((msg, index) =>
          index === state.messages.length - 1 ? { ...msg, content: botResponse, isLoading: false } : msg
        ),
      };
    case 'UPDATE_FORM':
      return {
        ...state,
        formState: { ...state.formState, ...action.payload },
      };
    case 'SET_FILE':
      return { ...state, fileToUpload: action.payload.file, previewUrl: action.payload.url };
    case 'REMOVE_FILE':
      if (state.previewUrl) {
        URL.revokeObjectURL(state.previewUrl);
      }
      return { ...state, fileToUpload: null, previewUrl: null };
    case 'START_CHAT':
      return {
        ...state,
        step: 'service',
        formState: { service: action.payload },
      };
    case 'SET_TICKET_ID':
      return { ...state, finalTicketId: action.payload };
    case 'RESET_CHAT':
      return {
        ...initialState,
        messages: [{ role: 'assistant', content: 'Ciao! Come posso aiutarti oggi?' }],
      };
    default:
      return state;
  }
};

export const useChat = () => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { messages, step, input, formState, progress, fileToUpload, previewUrl, formSummary, finalTicketId } = state;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string | React.ReactNode, isLoading = false) => {
    dispatch({ type: 'ADD_MESSAGE', payload: { role, content, isLoading } });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    const text = typeof messageOverride === 'string' ? messageOverride : input.trim();
    const fileToSend = fileToUpload;
    if ((!text && !fileToSend) || step === 'done') return;

    addMessage('user', text || (previewUrl ? <img src={previewUrl} alt="Anteprima" className="w-32 h-32 object-cover rounded-md" /> : ''));
    dispatch({ type: 'START_SEND' });
    if (fileToSend) removeFile();

    addMessage('assistant', <Typing />, true);

    let uploadedImageUrl: string | undefined = undefined;
    if (fileToSend) {
      try {
        const response = await fetch(`/api/upload?filename=${encodeURIComponent(fileToSend.name)}`, { method: 'POST', body: fileToSend });
        const newBlob = await response.json();
        if (!response.ok) throw new Error(newBlob.error || 'Caricamento del file fallito.');
        uploadedImageUrl = newBlob.url;
        dispatch({ type: 'UPDATE_FORM', payload: { imageUrl: newBlob.url } });
      } catch (uploadError: any) {
        dispatch({ type: 'FINISH_SEND', payload: { step: state.step, botResponse: `C'è stato un problema con il caricamento del file: ${uploadError.message}` } });
        return;
      }
    }

    try {
      const response = await fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          formState: { ...state.formState, imageUrl: uploadedImageUrl || state.formState.imageUrl },
          step,
        }),
      });

      if (!response.ok) throw new Error('La richiesta al server è fallita.');
      const data = await response.json();
      dispatch({ type: 'FINISH_SEND', payload: { step: data.nextStep as Step, botResponse: data.response, formSummary: data.summary, progress: data.progress } });
    } catch (error: any) {
      dispatch({ type: 'FINISH_SEND', payload: { step: state.step, botResponse: 'Ops, qualcosa è andato storto.' } });
    }
  };

  const startChat = (service: string) => {
    dispatch({ type: 'START_CHAT', payload: service });
    handleSend(`Voglio iniziare una richiesta per ${service}`);
  };

  const resetChat = () => {
    dispatch({ type: 'RESET_CHAT' });
  };

  const setFinalTicketId = (ticketId: string) => {
    dispatch({ type: 'SET_TICKET_ID', payload: ticketId });
  };

  return {
    messages,
    input,
    handleInputChange,
    handleSend,
    startChat,
    resetChat,
    step,
    formState,
    progress,
    fileToUpload,
    setFileToUpload,
    removeFile,
    previewUrl,
    formSummary,
    finalTicketId,
    setFinalTicketId,
  };
};