// hooks/useChat.tsx
import { useState, useCallback, ReactNode, useMemo } from 'react';
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
  | 'ask_address_and_city'
  | 'out_of_area_confirm'
  | 'ask_phone'
  | 'ask_email'
  | 'ask_timeslot'
  | 'confirm'
  | 'cancelled' // Nuovo stato per gestire l'annullamento
  | 'done';

export function useChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [step, setStep] = useState<DetailedStep>('problem');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [form, setForm] = useState<Partial<ChatFormState>>({});
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // --- LOGICA PER LA BARRA DI PROGRESSO ---
  const progressState = useMemo(() => {
    const stepMap: Record<DetailedStep, number> = {
      problem: 1,
      clarification_1: 2,
      clarification_2: 2,
      clarification_3: 2,
      ask_name: 3,
      ask_address_and_city: 3,
      out_of_area_confirm: 3,
      ask_phone: 3,
      ask_email: 3,
      ask_timeslot: 3,
      confirm: 4,
      cancelled: 4,
      done: 5,
    };
    return {
      current: stepMap[step] || 1,
      total: 5,
      labels: ['Problema', 'Dettagli', 'Contatto', 'Riepilogo', 'Inviata'],
    };
  }, [step]);


  const addMessage = useCallback((role: 'user' | 'assistant', content: ReactNode, isThinking: boolean = false) => {
    const newMsg: Msg = { id: Date.now() + Math.random(), role, content, isThinking };
    setMsgs(prev => [...prev.filter(m => !m.isThinking), newMsg]);
  }, []);
  
  const handleSend = async (messageOverride?: string) => {
    const text = typeof messageOverride === 'string' ? messageOverride : input.trim();
    if (!text && !fileToUpload) return;
    if (step === 'done') return; // Non fare nulla se la conversazione è già terminata con successo

    addMessage('user', text || 'File allegato');
    setInput('');
    if (fileToUpload) removeFile();
    
    setLoading(true);
    addMessage('assistant', <Typing />, true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let nextStep: DetailedStep = step;
    let botResponse: ReactNode = chatCopy.off_topic;

    if (step === 'problem' || step === 'cancelled') {
      try {
        const res = await fetch('/api/assist', { method: 'POST', body: JSON.stringify({ message: text }) });
        const { ok, data } = await res.json();
        if (!ok) throw new Error("Errore API");

        if(data.category === 'off_topic') {
            botResponse = chatCopy.off_topic;
            nextStep = 'problem';
        } else {
            setAiResult(data);
            setForm(prev => ({ ...prev, message: text, details: {} }));
            addMessage('assistant', data.acknowledgement);
            await new Promise(resolve => setTimeout(resolve, 600));
            botResponse = data.clarification_question;
            nextStep = 'clarification_1';
        }

      } catch (e) {
        botResponse = "Ops, si è verificato un errore. Riprova.";
        nextStep = 'problem';
      }
    } else if (step === 'clarification_1') {
        setForm(prev => ({ ...prev, message: text, details: { ...prev.details, clarification1: text } }));
        botResponse = aiResult?.request_type === 'task' 
            ? chatCopy.clarification_2_task 
            : chatCopy.clarification_2_problem;
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
        botResponse = chatCopy.ask_address_and_city;
        nextStep = 'ask_address_and_city';
    } else if (step === 'ask_address_and_city') {
        const fullAddress = text.trim();
        const city = fullAddress.toLowerCase();
        setForm(prev => ({ ...prev, address: fullAddress, city: city })); 
        if (city.includes('livorno')) {
            botResponse = chatCopy.ask_phone;
            nextStep = 'ask_phone';
        } else {
            botResponse = chatCopy.out_of_area;
            nextStep = 'out_of_area_confirm';
        }
    } else if (step === 'out_of_area_confirm') {
        if (text.toLowerCase().startsWith('sì') || text.toLowerCase().startsWith('si')) {
            botResponse = chatCopy.ask_phone;
            nextStep = 'ask_phone';
        } else {
            botResponse = chatCopy.cancel;
            nextStep = 'cancelled';
        }
    } else if (step === 'ask_phone') {
        setForm(prev => ({ ...prev, phone: text }));
        botResponse = chatCopy.ask_email;
        nextStep = 'ask_email';
    } else if (step === 'ask_email') {
        setForm(prev => ({ ...prev, email: text.toLowerCase() === 'no' ? '' : text }));
        botResponse = chatCopy.ask_timeslot;
        nextStep = 'ask_timeslot';
    } else if (step === 'ask_timeslot') {
        const updatedForm = { ...form, timeslot: text };
        setForm(updatedForm);
        addMessage('assistant', <SummaryBubble form={updatedForm} aiResult={aiResult} />);
        botResponse = chatCopy.confirm_action;
        nextStep = 'confirm';
    } else if (step === 'confirm') {
      if (text.toLowerCase().startsWith('sì') || text.toLowerCase().startsWith('si') || text.includes('manda')) {
        try {
          const payload = { ...form, ai: aiResult };
          const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
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
        nextStep = 'cancelled';
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
    progressState, // Esponiamo lo stato del progresso
  };
}