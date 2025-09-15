// hooks/useChat.tsx
'use client';

import { useState, useCallback, ReactNode, useEffect } from 'react';
import { chatCopy, decorateEstimates } from '@/lib/chat-copy';
import type { AiResult, Msg, Step, ChatFormState, UploadedFile } from '@/lib/types';
import Typing from '@/components/Typing';

const validators: Record<string, (value: string) => boolean> = {
  name: (value) => value.length >= 2,
  phone: (value) => /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/.test(value) && value.length > 8,
  email: (value) => value.toLowerCase() === 'no' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  address: (value) => value.length > 5,
  city: (value) => value.length > 2,
};

export function useChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [step, setStep] = useState<Step>('problem');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [form, setForm] = useState<Partial<ChatFormState>>({});
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const addMessage = useCallback((role: 'user' | 'assistant', content: ReactNode, isThinking: boolean = false) => {
    const newMsg: Msg = { id: Date.now() + Math.random(), role, content, isThinking };
    setMsgs(prev => {
        const filtered = prev.filter(m => !m.isThinking);
        return [...filtered, newMsg];
    });
  }, []);

  const advanceConversation = useCallback(async (currentStep: Step, value: string) => {
    let nextStep: Step = currentStep;
    let botResponse: ReactNode = '';

    setLoading(true);
    addMessage('assistant', <Typing />, true);
    
    // Simula il tempo di risposta del bot
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    switch (currentStep) {
        case 'problem': {
            try {
                const res = await fetch('/api/assist', { method: 'POST', body: JSON.stringify({ message: value }), headers: { 'Content-Type': 'application/json' } });
                const { ok, data, error } = await res.json();
                if (!ok || !data) throw new Error(error || 'Risposta API non valida');
                
                setAiResult(data);
                setForm(prev => ({ ...prev, message: value }));

                if (data.requires_specialist_contact) {
                    botResponse = chatCopy.specialistIntro(data.category);
                    nextStep = 'specialist_contact';
                } else if (data.price_low && data.price_high) {
                    const estimateText = decorateEstimates(data);
                    botResponse = (
                        <>
                            <p>{chatCopy.preQuoteTitle}</p>
                            <div className="my-2 p-3 bg-secondary rounded-md text-sm whitespace-pre-wrap">{estimateText}</div>
                            <p>{chatCopy.proceed}</p>
                        </>
                    );
                    nextStep = 'post_quote';
                } else {
                    botResponse = data.clarification_question || data.summary;
                    nextStep = 'clarification';
                }
            } catch (err) {
                botResponse = chatCopy.error(err instanceof Error ? err.message : 'Unknown error');
                nextStep = 'problem';
            }
            break;
        }
        case 'clarification': {
            const combinedMessage = `${form.message}. Dettaglio aggiuntivo: ${value}`;
            await advanceConversation('problem', combinedMessage);
            return; // advanceConversation si occupa già di tutto
        }
        case 'specialist_contact':
        case 'post_quote': {
            if (value.toLowerCase().includes('sì') || value.toLowerCase().includes('si')) {
                nextStep = 'name';
                botResponse = chatCopy.askName;
            } else {
                botResponse = chatCopy.reprompt;
                nextStep = 'problem'; // Torna allo stato iniziale per una nuova descrizione
            }
            break;
        }
        case 'name': {
            setForm(prev => ({ ...prev, name: value }));
            nextStep = 'phone';
            botResponse = chatCopy.askPhone(value);
            break;
        }
        case 'phone': {
            setForm(prev => ({ ...prev, phone: value }));
            nextStep = 'address';
            botResponse = chatCopy.askAddress;
            break;
        }
        case 'address': {
            setForm(prev => ({ ...prev, address: value }));
            nextStep = 'timeslot';
            botResponse = chatCopy.askTimeslot;
            break;
        }
        case 'timeslot': {
            const finalForm = { ...form, timeslot: value, ai: aiResult };
            setForm(prev => ({ ...prev, timeslot: value }));
            nextStep = 'confirm';
            
            try {
                const res = await fetch('/api/contact', { method: 'POST', body: JSON.stringify(finalForm), headers: { 'Content-Type': 'application/json' } });
                const data = await res.json();
                if (!res.ok || !data.ticketId) throw new Error(data.error || "ID richiesta non ricevuto.");
                botResponse = chatCopy.sent(data.ticketId);
                nextStep = 'done';
            } catch (err) {
                botResponse = chatCopy.errorSend;
                nextStep = 'confirm';
            }
            break;
        }
        default:
            botResponse = "Mi sono perso, potresti ricominciare a descrivere il problema?";
            nextStep = 'problem';
    }
    
    addMessage('assistant', botResponse);
    setStep(nextStep);
    setLoading(false);
  }, [form, aiResult, addMessage]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    addMessage('user', text);
    setInput('');
    
    const currentStep = step;
    const isValid = validators[currentStep] ? validators[currentStep](text) : true;

    if (!isValid) {
        addMessage('assistant', chatCopy.validationError(currentStep));
        return;
    }
    
    await advanceConversation(currentStep, text);
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) { setFileToUpload(file); setPreviewUrl(URL.createObjectURL(file)); }
    if (event.target) event.target.value = '';
  };
  const removeFile = () => { setFileToUpload(null); if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); } };
  const handleSuggestionClick = (text: string) => { setInput(text); };

  useEffect(() => {
    if (input && msgs.length === 0) { handleSend(); }
  }, [input, msgs.length, handleSend]);

  return { msgs, input, setInput, loading, handleSend, handleSuggestionClick, step, fileToUpload, previewUrl, handleFileSelect, removeFile };
}