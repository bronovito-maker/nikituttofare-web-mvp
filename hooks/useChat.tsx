// hooks/useChat.tsx
'use client';

import { useState, useCallback, ReactNode, useEffect } from 'react';
import { chatCopy, decorateEstimates } from '@/lib/chat-copy';
import type { AiResult, Msg, Step, ChatFormState, UploadedFile } from '@/lib/types';
import Typing from '@/components/Typing';

const validators: Record<string, (value: string) => boolean> = {
  name: (value) => value.length >= 2,
  phone: (value) => /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/.test(value) && value.length > 8,
  address: (value) => value.length > 5,
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

    const pause = () => new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
    
    switch (currentStep) {
        case 'problem': {
            try {
                const res = await fetch('/api/assist', { method: 'POST', body: JSON.stringify({ message: value }), headers: { 'Content-Type': 'application/json' } });
                const { ok, data, error } = await res.json();
                if (!ok || !data) throw new Error(error || 'Risposta API non valida');
                setAiResult(data);
                setForm(prev => ({ ...prev, message: value }));
                if (data.acknowledgement) {
                    addMessage('assistant', data.acknowledgement);
                    await pause();
                }
                addMessage('assistant', data.clarification_question || data.summary);
                nextStep = 'clarification';
            } catch (err) {
                addMessage('assistant', chatCopy.error(err instanceof Error ? err.message : 'Unknown error'));
                nextStep = 'problem';
            }
            break;
        }
        case 'clarification': {
            const updatedMessage = `${form.message}. Dettagli: ${value}`;
            setForm(prev => ({ ...prev, message: updatedMessage }));
            if (aiResult) {
                addMessage('assistant', chatCopy.thankYouForDetails);
                await pause();
                const estimateText = decorateEstimates(aiResult);
                const quoteResponse = (
                    <>
                        <div className="my-2 p-3 bg-secondary rounded-md text-sm whitespace-pre-wrap">{estimateText}</div>
                        <p>{chatCopy.proceed}</p>
                    </>
                );
                addMessage('assistant', quoteResponse);
                nextStep = 'post_quote';
            } else {
                addMessage('assistant', chatCopy.error("Si è verificato un errore, non ho una stima da mostrarti."));
                nextStep = 'problem';
            }
            break;
        }
        case 'post_quote': {
            if (value.toLowerCase().includes('sì') || value.toLowerCase().includes('si')) {
                nextStep = 'name';
                botResponse = chatCopy.askName;
            } else {
                botResponse = chatCopy.reprompt;
                nextStep = 'problem';
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
                await pause();
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
    }
    if (botResponse) { await pause(); addMessage('assistant', botResponse); }
    setStep(nextStep);
    setLoading(false);
  }, [form, aiResult, addMessage]);

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && !fileToUpload) || loading) return;

    // Logica di upload file (se presente)
    let messageToSend = text;
    if (fileToUpload) {
        addMessage('user', `(Immagine: ${fileToUpload.name}) ${text}`);
        // Qui la logica di upload... per ora la simuliamo.
        // In una versione reale, faresti l'upload e aggiungeresti l'URL a messageToSend
        messageToSend += `\nImmagine allegata: ${fileToUpload.name}`;
        removeFile();
    } else {
        addMessage('user', text);
    }
    setInput('');
    
    const currentStep = step;
    const isValid = validators[currentStep] ? validators[currentStep](text) : true;
    if (!isValid) {
        addMessage('assistant', chatCopy.validationError(currentStep));
        return;
    }
    await advanceConversation(currentStep, messageToSend);
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) { setFileToUpload(file); setPreviewUrl(URL.createObjectURL(file)); }
    if (event.target) event.target.value = '';
  };

  const removeFile = () => {
    setFileToUpload(null);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
  };

  const handleSuggestionClick = (text: string) => { setInput(text); };

  useEffect(() => { if (input && msgs.length === 0) { handleSend(); } }, [input, msgs.length, handleSend]);

  // --- MODIFICA CHIAVE: Restituisce tutte le proprietà necessarie ---
  return { 
    msgs, input, setInput, loading, step,
    handleSend, handleSuggestionClick, 
    fileToUpload, previewUrl, handleFileSelect, removeFile 
  };
}