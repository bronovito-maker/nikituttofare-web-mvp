// hooks/useChat.tsx
import { useState, useCallback, ReactNode } from 'react';
import { chatCopy, decorateEstimates } from '@/lib/chat-copy';
import type { AiResult, Msg, Step, ChatFormState } from '@/lib/types';
import Typing from '@/components/Typing';

const INFO_GATHERING_QUESTIONS: (keyof ChatFormState)[] = ['address', 'phone'];

export function useChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [step, setStep] = useState<Step>('problem');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [form, setForm] = useState<Partial<ChatFormState>>({ details: {} });
  const [questionQueue, setQuestionQueue] = useState<string[]>([]);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const addMessage = useCallback((role: 'user' | 'assistant', content: ReactNode, isThinking: boolean = false) => {
    const newMsg: Msg = { id: Date.now(), role, content, isThinking };
    setMsgs(prev => [...prev.filter(m => !m.isThinking), newMsg]);
  }, []);

  const askNextQuestion = useCallback(() => {
    if (questionQueue.length > 0) {
      const nextQuestionKey = questionQueue[0];
      const botResponse = chatCopy[nextQuestionKey as keyof typeof chatCopy] as ReactNode;
      addMessage('assistant', botResponse);
      setStep('collecting_info');
    } else {
      const finalEstimate = decorateEstimates(aiResult!);
      addMessage('assistant', `Perfetto, ho tutto! Riepilogo:\n\n${finalEstimate}`);
      addMessage('assistant', "Invio la richiesta al tecnico? (sì/no)");
      setStep('confirm');
    }
  }, [questionQueue, aiResult, addMessage]);

  const handleSend = async (messageOverride?: string) => {
    const text = typeof messageOverride === 'string' ? messageOverride : input.trim();
    if (!text || loading) return;

    addMessage('user', text);
    setInput('');
    setLoading(true);
    addMessage('assistant', <Typing />, true);
    await new Promise(resolve => setTimeout(resolve, 500));

    if (step === 'problem') {
      try {
        const res = await fetch('/api/assist', { method: 'POST', body: JSON.stringify({ message: text }) });
        const { ok, data } = await res.json();
        if (!ok) throw new Error("Errore API");
        
        setAiResult(data);
        setForm({ message: text, category: data.category, details: {} });
        
        addMessage('assistant', data.acknowledgement);
        await new Promise(resolve => setTimeout(resolve, 600));
        addMessage('assistant', data.clarification_question);
        setStep('clarification');
      } catch (e) {
        addMessage('assistant', "Ops, si è verificato un errore. Riprova.");
        setStep('problem');
      }
    } else if (step === 'clarification') {
      setForm(prev => ({ ...prev, details: { ...prev.details, clarification: text } }));
      const initialQueue = [...INFO_GATHERING_QUESTIONS];
      setQuestionQueue(initialQueue);
      const nextQuestionKey = initialQueue[0];
      const botResponse = chatCopy[nextQuestionKey as keyof typeof chatCopy] as ReactNode;
      addMessage('assistant', botResponse);
      setStep('collecting_info');
    } else if (step === 'collecting_info') {
      const currentQuestion = questionQueue[0];
      setForm(prev => ({ ...prev, [currentQuestion]: text }));
      const remainingQuestions = questionQueue.slice(1);
      setQuestionQueue(remainingQuestions);
      if (remainingQuestions.length > 0) {
        const nextQuestionKey = remainingQuestions[0];
        const botResponse = chatCopy[nextQuestionKey as keyof typeof chatCopy] as ReactNode;
        addMessage('assistant', botResponse);
      } else {
        const finalEstimate = decorateEstimates(aiResult!);
        addMessage('assistant', `Perfetto, ho tutto! Riepilogo:\n\n${finalEstimate}`);
        addMessage('assistant', "Invio la richiesta al tecnico? (sì/no)");
        setStep('confirm');
      }
    } else if (step === 'confirm') {
      if (text.toLowerCase().startsWith('sì') || text.toLowerCase().startsWith('si')) {
        addMessage('assistant', chatCopy.sent("NTF-DEMO-123"));
        setStep('done');
      } else {
        addMessage('assistant', "Ok, annullato. Se hai bisogno di altro, sono qui!");
        setStep('problem');
      }
    }
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

  // --- MODIFICA CHIAVE: Restituisce TUTTE le proprietà necessarie ---
  return {
    msgs,
    input,
    setInput,
    loading,
    handleSend: () => handleSend(), // La form chiama handleSend senza argomenti
    fileToUpload,
    previewUrl,
    handleFileSelect,
    removeFile,
    handleSuggestionClick,
  };
}