// File: hooks/useChat.tsx

'use client';
import { useReducer, ChangeEvent, ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Message, Step, ChatFormState } from '@/lib/types';
import Typing from '@/components/Typing';
import { chatCopy } from '@/lib/chat-copy';
import { useRouter } from 'next/navigation';

interface ChatState {
  messages: Message[];
  step: Step;
  input: string;
  formState: ChatFormState;
  isLoading: boolean;
  isScriptedFlowActive: boolean;
  scriptedQuestions: string[];
  currentScriptedQuestionIndex: number;
  finalTicketId: string | null;
  fileToUpload: File | null;
  previewUrl: string | null;
}

const initialState: ChatState = {
  messages: [{ role: 'assistant', content: 'Ciao! Sono Niki. Come posso aiutarti oggi?' }],
  step: 'intro',
  input: '',
  formState: { message: '', details: {} },
  isLoading: false,
  isScriptedFlowActive: false,
  scriptedQuestions: [],
  currentScriptedQuestionIndex: 0,
  finalTicketId: null,
  fileToUpload: null,
  previewUrl: null,
};

type Action =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'START_SEND' }
  | { type: 'FINISH_SEND'; payload: { step: Step; botResponse: ReactNode; formSummary?: any } }
  | { type: 'UPDATE_FORM'; payload: Partial<ChatFormState> }
  | { type: 'START_SCRIPTED_FLOW'; payload: string[] }
  | { type: 'ADVANCE_SCRIPTED_FLOW'; payload: { field: string; value: string } }
  | { type: 'END_SCRIPTED_FLOW' }
  | { type: 'START_CHAT'; payload: string }
  | { type: 'SET_TICKET_ID'; payload: string }
  | { type: 'RESET_CHAT' }
  | { type: 'SET_FILE'; payload: { file: File; url: string } }
  | { type: 'REMOVE_FILE' };

export const chatReducer = (state: ChatState, action: Action): ChatState => {
    switch (action.type) {
        case 'ADD_MESSAGE':
          return { ...state, messages: [...state.messages.filter(m => !m.isLoading), action.payload] };
        case 'SET_INPUT':
          return { ...state, input: action.payload };
        case 'START_SEND':
          return { ...state, isLoading: true, input: '' };
        case 'FINISH_SEND': {
          const { step, botResponse, formSummary } = action.payload;
          const newMessages = state.messages.filter(m => !m.isLoading);
          newMessages.push({ role: 'assistant', content: botResponse, isLoading: false });
          return { ...state, step, formState: formSummary || state.formState, isLoading: false, messages: newMessages };
        }
        case 'UPDATE_FORM':
          return { ...state, formState: { ...state.formState, ...action.payload } };
        case 'START_SCRIPTED_FLOW':
          return { ...state, isScriptedFlowActive: true, scriptedQuestions: action.payload, currentScriptedQuestionIndex: 0, isLoading: false };
        case 'ADVANCE_SCRIPTED_FLOW': {
          const { field, value } = action.payload;
          return { ...state, formState: { ...state.formState, [field]: value }, currentScriptedQuestionIndex: state.currentScriptedQuestionIndex + 1 };
        }
        case 'END_SCRIPTED_FLOW':
          return { ...state, isScriptedFlowActive: false };
        case 'START_CHAT':
          return { ...state, step: 'service', formState: { message: action.payload, details: {} } }; // Resetta formState
        case 'SET_TICKET_ID':
            return { ...state, finalTicketId: action.payload };
        case 'RESET_CHAT':
          return initialState;
        case 'SET_FILE':
            return { ...state, fileToUpload: action.payload.file, previewUrl: action.payload.url };
        case 'REMOVE_FILE':
            if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
            return { ...state, fileToUpload: null, previewUrl: null };
        default:
          return state;
      }
};

export const useChat = () => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { data: session } = useSession();
  const router = useRouter();

  const finalSubmit = async (finalFormState: ChatFormState) => {
    dispatch({ type: 'ADD_MESSAGE', payload: { role: 'assistant', content: <Typing /> } });
    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalFormState)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Errore durante l\'invio finale');
        
        dispatch({ type: 'SET_TICKET_ID', payload: data.ticketId });
        
        const finalMessage = `Richiesta inviata con successo! Il suo ID ticket è ${data.ticketId}. Può visualizzare i dettagli nella sua dashboard.`;
        dispatch({ type: 'FINISH_SEND', payload: { step: 'done', botResponse: finalMessage, formSummary: finalFormState } });

    } catch (error) {
        addMessage('assistant', 'Si è verificato un errore grave nell\'invio della richiesta. Riprova più tardi.');
    }
  };
  
  useEffect(() => {
    if (state.isScriptedFlowActive && state.currentScriptedQuestionIndex < state.scriptedQuestions.length) {
      const nextQuestion = state.scriptedQuestions[state.currentScriptedQuestionIndex];
      addMessage('assistant', nextQuestion);
    }
    if (state.isScriptedFlowActive && state.currentScriptedQuestionIndex >= state.scriptedQuestions.length) {
      dispatch({ type: 'END_SCRIPTED_FLOW' });
      finalSubmit(state.formState);
    }
  }, [state.isScriptedFlowActive, state.currentScriptedQuestionIndex]);

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
    const text = (messageOverride ?? state.input).trim();
    if (!text && !state.fileToUpload) return;

    addMessage('user', text);
    dispatch({ type: 'SET_INPUT', payload: '' });

    if (state.fileToUpload) {
        // Logica di upload
        console.log("File da caricare:", state.fileToUpload.name);
        // ... await uploadFile(state.fileToUpload)
        dispatch({ type: 'UPDATE_FORM', payload: { ...state.formState, imageUrl: 'https://placeholder.com/image.jpg' } });
        removeFile();
    }

    if (state.isScriptedFlowActive) {
      const currentQuestion = state.scriptedQuestions[state.currentScriptedQuestionIndex]?.toLowerCase() || '';
      let field = '';
      if (currentQuestion.includes('nome')) field = 'name';
      else if (currentQuestion.includes('indirizzo')) field = 'address';
      else if (currentQuestion.includes('telefono')) field = 'phone';
      else if (currentQuestion.includes('email')) field = 'email';
      else if (currentQuestion.includes('disponibilità')) field = 'timeslot';
      if (field) {
        dispatch({ type: 'ADVANCE_SCRIPTED_FLOW', payload: { field, value: text } });
      }
      return;
    }

    dispatch({ type: 'START_SEND' });
    addMessage('assistant', <Typing />, true);

    try {
      const response = await fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, formState: state.formState, step: state.step }),
      });
      if (!response.ok) throw new Error('Server error');
      const data = await response.json();

      if (data.nextStep === 'done') {
        dispatch({ type: 'FINISH_SEND', payload: { step: data.nextStep, botResponse: data.response, formSummary: data.summary } });
        let questions: string[] = [];
        if (session?.user) {
          dispatch({ type: 'UPDATE_FORM', payload: { name: session.user.name ?? undefined, email: session.user.email ?? undefined } });
          questions = [ chatCopy.ask_address_and_city, chatCopy.ask_timeslot ];
        } else {
          questions = [ chatCopy.ask_name, chatCopy.ask_address_and_city, chatCopy.ask_phone, chatCopy.ask_email, chatCopy.ask_timeslot ];
        }
        dispatch({ type: 'START_SCRIPTED_FLOW', payload: questions });
      } else {
        dispatch({ type: 'FINISH_SEND', payload: { step: data.nextStep, botResponse: data.response, formSummary: data.summary } });
      }

    } catch (error) {
      const errorMessage = 'Ops, si è verificato un errore. Potrebbe riprovare?';
      dispatch({ type: 'FINISH_SEND', payload: { step: state.step, botResponse: errorMessage, formSummary: state.formState } });
    }
  };

  const startChat = (service: string) => {
    dispatch({ type: 'START_CHAT', payload: service });
    handleSend(service);
  };

  const resetChat = () => dispatch({ type: 'RESET_CHAT' });

  return { ...state, handleInputChange, handleSend, startChat, resetChat, setFileToUpload, removeFile };
};