// hooks/useChat.tsx
import { useState, useCallback, ReactNode } from 'react';
import { chatCopy, decorateEstimates } from '@/lib/chat-copy';
import type { AiResult, Msg, Step, ChatFormState } from '@/lib/types';
import Typing from '@/components/Typing';

// Definiamo le fasi della chat in modo più granulare
type DetailedStep = 
  | 'problem'
  | 'clarification_1'
  | 'clarification_2'
  | 'clarification_3'
  | 'ask_name'
  | 'ask_city'
  | 'ask_address'
  | 'out_of_area_confirm'
  | 'ask_phone'
  | 'ask_email'
  | 'ask_timeslot'
  | 'confirm'
  | 'done';

export function useChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [step, setStep] = useState<DetailedStep>('problem');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [form, setForm] = useState<Partial<ChatFormState>>({ details: {} });

  // File upload state (invariato)
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const addMessage = useCallback((role: 'user' | 'assistant', content: ReactNode, isThinking: boolean = false) => {
    const newMsg: Msg = { id: Date.now() + Math.random(), role, content, isThinking };
    setMsgs(prev => [...prev.filter(m => !m.isThinking), newMsg]);
  }, []);
  
  const handleSend = async (messageOverride?: string) => {
    const text = typeof messageOverride === 'string' ? messageOverride : input.trim();
    if (!text && !fileToUpload) return;

    addMessage('user', text || 'File allegato');
    setInput('');
    if (fileToUpload) removeFile(); // Rimuove l'anteprima dopo l'invio
    
    setLoading(true);
    addMessage('assistant', <Typing />, true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // --- NUOVA LOGICA DI FLUSSO ---
    
    let nextStep: DetailedStep = step;
    let botResponse: ReactNode = "Scusa, non ho capito.";

    if (step === 'problem') {
      try {
        const res = await fetch('/api/assist', { 
            method: 'POST', 
            body: JSON.stringify({ message: text }) 
        });
        const { ok, data } = await res.json();
        if (!ok) throw new Error("Errore API");
        
        setAiResult(data);
        setForm({ message: text, category: data.category, details: {} });
        
        addMessage('assistant', data.acknowledgement);
        await new Promise(resolve => setTimeout(resolve, 600));
        
        botResponse = chatCopy.clarification_1;
        nextStep = 'clarification_1';

      } catch (e) {
        botResponse = "Ops, si è verificato un errore. Riprova.";
        nextStep = 'problem';
      }
    } else if (step === 'clarification_1') {
        setForm(prev => ({ ...prev, details: { ...prev.details, clarification1: text } }));
        botResponse = chatCopy.clarification_2;
        nextStep = 'clarification_2';
    } else if (step === 'clarification_2') {
        setForm(prev => ({ ...prev, details: { ...prev.details, clarification2: text } }));
        botResponse = chatCopy.clarification_3;
        nextStep = 'clarification_3';
    } else if (step === 'clarification_3') {
        setForm(prev => ({ ...prev, details: { ...prev.details, clarification3: text } }));
        botResponse = chatCopy.ask_name;
        nextStep = 'ask_name';
    } else if (step === 'ask_name') {
        setForm(prev => ({ ...prev, name: text }));
        botResponse = chatCopy.ask_city;
        nextStep = 'ask_city';
    } else if (step === 'ask_city') {
        const city = text.trim().toLowerCase();
        setForm(prev => ({ ...prev, city }));
        if (city.includes('livorno')) {
            botResponse = chatCopy.ask_address;
            nextStep = 'ask_address';
        } else {
            botResponse = chatCopy.out_of_area;
            nextStep = 'out_of_area_confirm';
        }
    } else if (step === 'out_of_area_confirm') {
        if (text.toLowerCase().startsWith('sì') || text.toLowerCase().startsWith('si')) {
            botResponse = chatCopy.ask_address;
            nextStep = 'ask_address';
        } else {
            botResponse = chatCopy.cancel;
            nextStep = 'problem';
        }
    } else if (step === 'ask_address') {
        setForm(prev => ({ ...prev, address: text }));
        botResponse = chatCopy.ask_phone;
        nextStep = 'ask_phone';
    } else if (step === 'ask_phone') {
        setForm(prev => ({ ...prev, phone: text }));
        botResponse = chatCopy.ask_email;
        nextStep = 'ask_email';
    } else if (step === 'ask_email') {
        setForm(prev => ({ ...prev, email: text.toLowerCase() === 'no' ? '' : text }));
        botResponse = chatCopy.ask_timeslot;
        nextStep = 'ask_timeslot';
    } else if (step === 'ask_timeslot') {
        setForm(prev => ({ ...prev, timeslot: text }));
        const finalEstimate = decorateEstimates(aiResult!);
        addMessage('assistant', `${chatCopy.confirm_summary}\n\n${finalEstimate}`);
        botResponse = chatCopy.confirm_action;
        nextStep = 'confirm';
    } else if (step === 'confirm') {
      if (text.toLowerCase().startsWith('sì') || text.toLowerCase().startsWith('si')) {
        try {
          // --- LOGICA DI INVIO REALE ---
          const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, ai: aiResult })
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error || "Errore di invio");
          
          botResponse = chatCopy.sent(result.ticketId || 'NON-DISPONIBILE');
          nextStep = 'done';
        } catch (err: any) {
          botResponse = chatCopy.error(err.message);
          nextStep = 'problem';
        }
      } else {
        botResponse = chatCopy.cancel;
        nextStep = 'problem';
      }
    }

    addMessage('assistant', botResponse);
    setStep(nextStep);
    setLoading(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileToUpload(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
    if (event.target) event.target.value = '';
  };

  const removeFile = () => {
    setFileToUpload(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    // Invia automaticamente il suggerimento
    handleSend(text); 
  };
  
  return {
    msgs,
    input,
    setInput,
    loading,
    handleSend: () => handleSend(),
    fileToUpload,
    previewUrl,
    handleFileSelect,
    removeFile,
    handleSuggestionClick,
  };
}