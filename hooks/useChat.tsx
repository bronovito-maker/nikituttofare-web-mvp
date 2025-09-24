// File: hooks/useChat.tsx

'use client';
import { useReducer, ChangeEvent, ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Message, Step, ChatFormState } from '@/lib/types';
import Typing from '@/components/Typing';

// --- STATO E AZIONI ---

interface ChatState {
  messages: Message[];
  step: Step;
  input: string;
  formState: ChatFormState;
  isLoading: boolean;
  isScriptedFlowActive: boolean;
  scriptedQuestions: string[];
  currentScriptedQuestionIndex: number;
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
};

type Action =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'START_SEND' }
  | { type: 'FINISH_SEND'; payload: { step: Step; botResponse: ReactNode; formSummary?: any } }
  // --- CORREZIONE 1: Reinserita l'azione UPDATE_FORM mancante ---
  | { type: 'UPDATE_FORM'; payload: Partial<ChatFormState> }
  | { type: 'START_SCRIPTED_FLOW'; payload: string[] }
  | { type: 'ADVANCE_SCRIPTED_FLOW'; payload: { field: string; value: string } }
  | { type: 'END_SCRIPTED_FLOW' }
  | { type: 'START_CHAT'; payload: string }
  | { type: 'RESET_CHAT' };

// --- REDUCER (Logica di stato) ---

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
      return {
        ...state,
        step,
        formState: formSummary || state.formState,
        isLoading: false,
        messages: newMessages,
      };
    }
    // --- CORREZIONE 2: Reinserita la logica per UPDATE_FORM ---
    case 'UPDATE_FORM':
      return { ...state, formState: { ...state.formState, ...action.payload } };
    case 'START_SCRIPTED_FLOW':
      return {
        ...state,
        isScriptedFlowActive: true,
        scriptedQuestions: action.payload,
        currentScriptedQuestionIndex: 0,
      };
    case 'ADVANCE_SCRIPTED_FLOW': {
      const { field, value } = action.payload;
      return {
        ...state,
        formState: { ...state.formState, [field]: value },
        currentScriptedQuestionIndex: state.currentScriptedQuestionIndex + 1,
      };
    }
    case 'END_SCRIPTED_FLOW':
      return { ...state, isScriptedFlowActive: false };
    case 'START_CHAT':
      return { ...state, step: 'service', formState: { ...state.formState, message: action.payload } };
    case 'RESET_CHAT':
      return initialState;
    default:
      return state;
  }
};

// --- HOOK PRINCIPALE ---

export const useChat = () => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { data: session } = useSession();

  useEffect(() => {
    if (state.isScriptedFlowActive && state.currentScriptedQuestionIndex < state.scriptedQuestions.length) {
      const nextQuestion = state.scriptedQuestions[state.currentScriptedQuestionIndex];
      dispatch({ type: 'ADD_MESSAGE', payload: { role: 'assistant', content: nextQuestion } });
    }
    if (state.isScriptedFlowActive && state.currentScriptedQuestionIndex >= state.scriptedQuestions.length) {
      dispatch({ type: 'END_SCRIPTED_FLOW' });
      dispatch({ type: 'ADD_MESSAGE', payload: { role: 'assistant', content: 'Grazie, ho raccolto tutte le informazioni. Sto inviando la sua richiesta...' } });
      console.log('DATI FINALI PRONTI PER L\'INVIO:', state.formState);
    }
  }, [state.isScriptedFlowActive, state.currentScriptedQuestionIndex]);

  const addMessage = (role: 'user' | 'assistant', content: ReactNode, isLoading = false) => {
    dispatch({ type: 'ADD_MESSAGE', payload: { role, content, isLoading } });
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_INPUT', payload: event.target.value });
  };

  const handleSend = async (messageOverride?: string) => {
    const text = (messageOverride ?? state.input).trim();
    if (!text) return;

    addMessage('user', text);

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
      dispatch({ type: 'SET_INPUT', payload: '' });
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
      
      dispatch({
        type: 'FINISH_SEND',
        payload: { step: data.nextStep, botResponse: data.response, formSummary: data.summary },
      });

      if (data.nextStep === 'done') {
        let questions: string[] = [];
        if (session?.user) {
          dispatch({ 
            type: 'UPDATE_FORM', 
            payload: { 
              name: session.user.name ?? undefined, 
              email: session.user.email ?? undefined 
            } 
          });
          questions = [
            `L'intervento è da effettuare all'indirizzo che ha in memoria? Se sì, mi dia conferma. Altrimenti, scriva il nuovo indirizzo.`,
            'Qual è la sua disponibilità oraria per l\'intervento?'
          ];
        } else {
          questions = [
            'Per procedere, avrei bisogno del suo nome e cognome.',
            'Qual è l\'indirizzo completo per l\'intervento?',
            'Ottimo. Potrebbe lasciarmi un suo recapito telefonico?',
            'Perfetto. E un indirizzo email (opzionale, può scrivere "salta")?',
            'Ultima domanda: ha delle preferenze per giorno e orario?'
          ];
        }
        dispatch({ type: 'START_SCRIPTED_FLOW', payload: questions });
      }
    } catch (error) {
      const errorMessage = 'Ops, si è verificato un errore. Potrebbe riprovare?';
      dispatch({
        type: 'FINISH_SEND',
        payload: { step: state.step, botResponse: errorMessage, formSummary: state.formState },
      });
    }
  };

  const startChat = (service: string) => {
    dispatch({ type: 'START_CHAT', payload: service });
    handleSend(service);
  };

  const resetChat = () => dispatch({ type: 'RESET_CHAT' });

  return { ...state, handleInputChange, handleSend, startChat, resetChat };
};