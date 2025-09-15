// hooks/useChat.ts
'use client';

import { useState, useCallback, ReactNode } from 'react';
import { chatCopy } from '@/lib/chat-copy';
import type { AiResult, Msg, Step, ChatFormState, UploadedFile } from '@/lib/types';

export function useChat() {
    const [msgs, setMsgs] = useState<Msg[]>([]);
    const [step, setStep] = useState<Step>('problem');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiResult, setAiResult] = useState<AiResult | null>(null);
    const [form, setForm] = useState<Partial<ChatFormState>>({});
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const addMessage = useCallback((role: 'user' | 'assistant', content: ReactNode) => {
        setMsgs(prev => [...prev, { id: Date.now() + Math.random(), role, content }]);
    }, []);

    const replaceLastBotMessage = useCallback((content: ReactNode) => {
        setMsgs(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant') {
                return [...prev.slice(0, -1), { ...last, content }];
            }
            return [...prev, { id: Date.now() + Math.random(), role: 'assistant', content }];
        });
    }, []);
    
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
        // La logica per l'invio automatico sarà gestita dal componente di input
        // che chiamerà handleSend
    };

    const handleSend = async () => {
        const text = input.trim();
        if ((!text && !fileToUpload) || loading) return;

        setLoading(true);
        let messageToSend = text;
        let userMessageContent: ReactNode = text;

        if (fileToUpload) {
            addMessage('user', <>{text}<div className="italic text-sm mt-2">Caricamento: {fileToUpload.name}...</div></>);
            try {
                const response = await fetch(`/api/upload?filename=${encodeURIComponent(fileToUpload.name)}`, {
                    method: 'POST',
                    body: fileToUpload,
                });
                if (!response.ok) throw new Error('Upload fallito.');
                const newBlob = await response.json() as UploadedFile;
                messageToSend += `\n\nImmagine allegata: ${newBlob.url}`;
                userMessageContent = <>{text}{text && <br/>}<img src={newBlob.url} alt="Allegato" className="mt-2 rounded-lg max-w-[150px]"/></>;
                removeFile();
            } catch (error) {
                replaceLastBotMessage(<div className="text-destructive">Errore nel caricamento del file. Riprova.</div>);
                setLoading(false);
                return;
            }
            setMsgs(prev => [...prev.slice(0, -1), { id: Date.now(), role: 'user', content: userMessageContent }]);
        } else {
            addMessage('user', text);
        }
        
        setInput('');
        
        try {
            addMessage('assistant', '...'); // Placeholder for Typing
            const res = await fetch('/api/assist', { method: 'POST', body: JSON.stringify({ message: messageToSend }), headers: {'Content-Type': 'application/json'} });
            const { ok, data, error } = await res.json();
            if (!ok) throw new Error(error);

            if (data.category === 'status_check') {
                const ticketId = data.clarification_question;
                const statusRes = await fetch(`/api/status/${ticketId}`);
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    replaceLastBotMessage(<>La richiesta <strong>#{ticketId}</strong> ({statusData.category}) è nello stato: <strong className="capitalize">{statusData.status}</strong>.</>);
                } else {
                    replaceLastBotMessage(`Non ho trovato una richiesta con l'ID #${ticketId}. Verifica e riprova.`);
                }
            } else {
                setAiResult(data);
                // Qui andrebbe la logica completa dello switch, per ora la semplifichiamo
                replaceLastBotMessage(data.clarification_question || data.summary);
                setStep('clarification'); // Esempio di avanzamento
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Si è verificato un errore.';
            replaceLastBotMessage(<div className="text-destructive">{chatCopy.error(errorMessage)}</div>);
        } finally {
            setLoading(false);
        }
    };
    
    return {
        msgs,
        input,
        setInput,
        loading,
        handleSend,
        fileToUpload,
        previewUrl,
        handleFileSelect,
        removeFile,
        handleSuggestionClick // Esportiamo la funzione
    };
}