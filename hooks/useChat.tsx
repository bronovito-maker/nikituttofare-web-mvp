// hooks/useChat.tsx
import { useReducer, useCallback, ReactNode, useMemo, Reducer } from 'react';
import { chatCopy } from '@/lib/chat-copy';
import type { AiResult, Msg, ChatFormState } from '@/lib/types';
import Typing from '@/components/Typing';
import { SummaryBubble } from '@/components/chat/SummaryBubble';

type DetailedStep =
  | 'problem'
  | 'clarification_1'
  | 'clarification_2'
  | 'clarification_3'
  | 'ask_name'
  | 'ask_address'
  | 'ask_city'
  | 'out_of_area_confirm'
  | 'ask_phone'
  | 'ask_email'
  | 'ask_timeslot'
  | 'confirm'
  | 'awaiting_modification_field' // Nuovo stato per la modifica
  | 'cancelled'
  | 'done';

interface ChatState {
  msgs: Msg[];
  step: DetailedStep;
  input: string;
  loading: boolean;
  aiResult: AiResult | null;
  form: Partial<ChatFormState>;
  fileToUpload: File | null;
  previewUrl: string | null;
}

type ChatAction =
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'START_SEND' }
  | { type: 'ADD_MESSAGE'; payload: { role: 'user' | 'assistant'; content: ReactNode; isThinking?: boolean } }
  | { type: 'FINISH_SEND'; payload: { step: DetailedStep; botResponse?: ReactNode } }
  | { type: 'UPDATE_AI_RESULT'; payload: AiResult }
  | { type: 'UPDATE_FORM'; payload: Partial<ChatFormState> }
  | { type: 'SET_FILE'; payload: { file: File | null; previewUrl: string | null } };

const initialState: ChatState = {
  msgs: [],
  step: 'problem',
  input: '',
  loading: false,
  aiResult: null,
  form: {},
  fileToUpload: null,
  previewUrl: null,
};

const chatReducer: Reducer<ChatState, ChatAction> = (state, action): ChatState => {
  switch (action.type) {
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    case 'START_SEND':
      return { ...state, loading: true, input: '' };
    case 'ADD_MESSAGE': {
      const newMsg: Msg = { id: Date.now() + Math.random(), ...action.payload };
      const filteredMsgs = state.msgs.filter(m => !m.isThinking);
      return { ...state, msgs: [...filteredMsgs, newMsg] };
    }
    case 'FINISH_SEND': {
      let finalState = { ...state, loading: false, step: action.payload.step };
      // Rimuove il "typing" e aggiunge la risposta del bot se presente
      const thinkingRemovedMsgs = state.msgs.filter(m => !m.isThinking);
      if (action.payload.botResponse) {
        const botMsg: Msg = { id: Date.now() + Math.random(), role: 'assistant', content: action.payload.botResponse };
        finalState.msgs = [...thinkingRemovedMsgs, botMsg];
      } else {
         finalState.msgs = thinkingRemovedMsgs;
      }
      return finalState;
    }
    case 'UPDATE_AI_RESULT':
      return { ...state, aiResult: action.payload };
    case 'UPDATE_FORM':
      return { ...state, form: { ...state.form, ...action.payload } };
    case 'SET_FILE':
      return { ...state, fileToUpload: action.payload.file, previewUrl: action.payload.previewUrl };
    default:
      return state;
  }
};

export function useChat() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { msgs, step, input, loading, aiResult, form, fileToUpload, previewUrl } = state;

  const progressState = useMemo(() => {
    const stepMap: Record<DetailedStep, number> = {
      problem: 1, clarification_1: 1, clarification_2: 1, clarification_3: 1,
      ask_name: 2, ask_address: 2, ask_city: 2, out_of_area_confirm: 2, ask_phone: 2, ask_email: 2, ask_timeslot: 2, confirm: 2,
      awaiting_modification_field: 2,
      cancelled: 1,
      done: 3,
    };
    return {
      current: stepMap[step] || 1,
      total: 3,
      labels: ['Richiesta', 'Verifica', 'Conferma'],
    };
  }, [step]);

  const addMessage = useCallback((role: 'user' | 'assistant', content: ReactNode, isThinking: boolean = false) => {
    dispatch({ type: 'ADD_MESSAGE', payload: { role, content, isThinking } });
  }, []);
  
  const setInput = (value: string) => dispatch({ type: 'SET_INPUT', payload: value });
  
  const removeFile = useCallback(() => {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    dispatch({ type: 'SET_FILE', payload: { file: null, previewUrl: null } });
  }, [state.previewUrl]);

  const handleSend = async (messageOverride?: string) => {
    const text = typeof messageOverride === 'string' ? messageOverride : input.trim();
    const fileToSend = fileToUpload;
    if (!text && !fileToSend || step === 'done') return;

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

    await new Promise(resolve => setTimeout(resolve, 500));
    
    let nextStep: DetailedStep = step;
    let botResponse: ReactNode = chatCopy.off_topic;
    const currentForm = { ...form, imageUrl: uploadedImageUrl || form.imageUrl };

    try {
      if (step === 'awaiting_modification_field') {
        const field = text.toLowerCase();
        let targetStep: DetailedStep = 'confirm';
        if (field.includes('nome')) targetStep = 'ask_name';
        else if (field.includes('indirizzo')) targetStep = 'ask_address';
        else if (field.includes('telefono')) targetStep = 'ask_phone';
        else if (field.includes('email')) targetStep = 'ask_email';
        else if (field.includes('disponibilità')) targetStep = 'ask_timeslot';
        
        botResponse = `Ok, inserisci di nuovo ${field}.`;
        nextStep = targetStep;

      } else {
        switch (step) {
            case 'problem': case 'cancelled':
                const res = await fetch('/api/assist', { method: 'POST', body: JSON.stringify({ message: text }) });
                const { ok, data } = await res.json();
                if (!ok || !data) throw new Error("Errore API");
                if (data.category === 'off_topic') { botResponse = chatCopy.off_topic; nextStep = 'problem'; } else {
                    dispatch({ type: 'UPDATE_AI_RESULT', payload: data });
                    dispatch({ type: 'UPDATE_FORM', payload: { message: text, details: {} } });
                    addMessage('assistant', data.acknowledgement); await new Promise(r => setTimeout(r, 600));
                    botResponse = data.clarification_question; nextStep = 'clarification_1';
                }
                break;
            case 'clarification_1': dispatch({ type: 'UPDATE_FORM', payload: { details: { ...form.details, clarification1: text } } }); botResponse = aiResult?.request_type === 'task' ? chatCopy.clarification_2_task : chatCopy.clarification_2_problem; nextStep = 'clarification_2'; break;
            case 'clarification_2': dispatch({ type: 'UPDATE_FORM', payload: { details: { ...form.details, clarification2: text } } }); botResponse = chatCopy.clarification_3; nextStep = 'clarification_3'; break;
            case 'clarification_3': dispatch({ type: 'UPDATE_FORM', payload: { details: { ...form.details, clarification3: text } } }); botResponse = chatCopy.ask_name; nextStep = 'ask_name'; break;
            case 'ask_name': dispatch({ type: 'UPDATE_FORM', payload: { name: text } }); botResponse = chatCopy.ask_address_and_city; nextStep = 'ask_address'; break;
            case 'ask_address': {
              const addressInput = text.trim();
              const cityInAddress = addressInput.toLowerCase().includes('livorno');
              dispatch({ type: 'UPDATE_FORM', payload: { address: addressInput } });
              if (cityInAddress) {
                dispatch({ type: 'UPDATE_FORM', payload: { city: 'Livorno' } });
                botResponse = chatCopy.ask_phone;
                nextStep = 'ask_phone';
              } else {
                botResponse = "Perfetto, e in quale città?";
                nextStep = 'ask_city';
              }
              break;
            }
            case 'ask_city': const city = text.trim().toLowerCase(); dispatch({ type: 'UPDATE_FORM', payload: { city } }); if (city.includes('livorno')) { botResponse = chatCopy.ask_phone; nextStep = 'ask_phone'; } else { botResponse = chatCopy.out_of_area; nextStep = 'out_of_area_confirm'; } break;
            case 'out_of_area_confirm': if (text.toLowerCase().startsWith('sì') || text.toLowerCase().startsWith('si')) { botResponse = chatCopy.ask_phone; nextStep = 'ask_phone'; } else { botResponse = chatCopy.cancel; nextStep = 'cancelled'; } break;
            case 'ask_phone': dispatch({ type: 'UPDATE_FORM', payload: { phone: text } }); botResponse = chatCopy.ask_email; nextStep = 'ask_email'; break;
            case 'ask_email': dispatch({ type: 'UPDATE_FORM', payload: { email: text.toLowerCase() === 'no' ? '' : text } }); botResponse = chatCopy.ask_timeslot; nextStep = 'ask_timeslot'; break;
            case 'ask_timeslot':
                const formAfterTimeslot = { ...currentForm, timeslot: text };
                dispatch({ type: 'UPDATE_FORM', payload: { timeslot: text } });
                addMessage('assistant', <SummaryBubble form={formAfterTimeslot} aiResult={aiResult} />, true);
                botResponse = chatCopy.confirm_action;
                nextStep = 'confirm';
                break;
            case 'confirm':
                const userMessage = text.toLowerCase();
                if (userMessage.startsWith('sì') || userMessage.startsWith('si')) {
                    const payload = { ...currentForm, ai: aiResult };
                    const res = await fetch('/api/contact', { method: 'POST', body: JSON.stringify(payload) });
                    if (!res.ok) throw new Error((await res.json()).error || "Errore di invio");
                    const result = await res.json();
                    botResponse = chatCopy.sent(result.ticketId || 'N/D');
                    nextStep = 'done';
                } else if (userMessage.includes('modifica')) {
                    botResponse = chatCopy.ask_modification;
                    nextStep = 'awaiting_modification_field';
                } else {
                    botResponse = chatCopy.cancel;
                    nextStep = 'cancelled';
                }
                break;
        }
      }
      dispatch({ type: 'FINISH_SEND', payload: { step: nextStep, botResponse } });
    } catch (err: any) {
      console.error("Errore nella logica della chat:", err);
      dispatch({ type: 'FINISH_SEND', payload: { step: 'problem', botResponse: chatCopy.error(err.message) } });
    }
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const newPreviewUrl = URL.createObjectURL(file);
      dispatch({ type: 'SET_FILE', payload: { file, previewUrl: newPreviewUrl } });
    }
    if (event.target) event.target.value = '';
  };

  const handleSuggestionClick = (text: string) => handleSend(text);

  return { msgs, input, setInput, loading, handleSend, fileToUpload, previewUrl, handleFileSelect, removeFile, handleSuggestionClick, progressState };
}