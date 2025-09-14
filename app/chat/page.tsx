// app/chat/page.tsx
'use client';

import React, { useEffect, useRef, useState, ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { SendHorizontal, LoaderCircle, Wrench, Lightbulb, KeyRound, Hammer } from 'lucide-react';
import { chatCopy } from '@/lib/chat-copy';

// --- Tipi, Costanti e Funzioni Helper ---
interface ChatFormState {
    message: string; name: string; phone: string; email: string;
    city: string; address: string; timeslot: string;
}
type AiResult = {
    category?: string; clarification_question?: string; urgency?: string;
    price_low?: number; price_high?: number; est_minutes?: number; summary?: string;
    requires_specialist_contact?: boolean;
};
type Step = 'problem' | 'clarification' | 'post-quote' | 'name' | 'phone' | 'email' | 'city' | 'address' | 'timeslot' | 'confirm' | 'done';
type Msg = { id: number; role: 'user' | 'assistant'; content: ReactNode };

const OUT_OF_ZONE_FEE = 30;
const MAIN_CITY = 'livorno';
const isAffirmative = (text: string) => /^(s|si|sì|ok|va bene|procedi|confermo|certo|corretto)/i.test(text);
const phoneOk = (v: string) => v.replace(/[^\d+]/g, '').length >= 9;

// --- Componenti UI di Supporto (Definizioni Complete) ---

const ChatIntroScreen = ({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }): JSX.Element => {
    const suggestions = [
        { icon: <Wrench size={24} />, text: "Perdita dal lavandino in cucina" },
        { icon: <Lightbulb size={24} />, text: "Una presa di corrente non funziona" },
        { icon: <KeyRound size={24} />, text: "La serratura della porta è bloccata" },
        { icon: <Hammer size={24} />, text: "Ho bisogno di montare delle mensole" },
    ];
    return (
        <div className="flex-grow flex flex-col justify-center items-center p-4 h-full">
            <div className="text-center">
                <Image src="/logo_ntf.png" alt="NikiTuttoFare Logo" width={64} height={64} className="rounded-xl mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-foreground">Come posso aiutarti?</h1>
                <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                    Descrivi il tuo problema qui sotto, oppure scegli uno degli esempi per iniziare.
                </p>
            </div>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {suggestions.map(({ icon, text }) => (
                    <button key={text} onClick={() => onSuggestionClick(text)} className="p-4 bg-card border border-border rounded-lg text-left flex items-center gap-4 hover:bg-secondary hover:border-primary/50 transition-all duration-200 group">
                        <div className="text-primary">{icon}</div>
                        <span className="text-card-foreground group-hover:text-foreground">{text}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const EstimateBlock = ({ ai, isOutOfZone }: { ai: AiResult; isOutOfZone?: boolean }): JSX.Element => {
    const final_price_low = (ai.price_low ?? 0) + (isOutOfZone ? OUT_OF_ZONE_FEE : 0);
    const final_price_high = (ai.price_high ?? 0) + (isOutOfZone ? OUT_OF_ZONE_FEE : 0);
    const price = `~${final_price_low}–${final_price_high}€`;
    return (
        <div className="space-y-2">
            <p className="font-medium text-foreground">Ecco una stima di massima:</p>
            <div className="text-sm space-y-1 text-muted-foreground">
                {ai.category && <div>🏷️ Servizio: <span className="font-semibold text-foreground capitalize">{ai.category}</span></div>}
                {ai.urgency && <div>⚡ Urgenza: <span className="font-semibold text-foreground capitalize">{ai.urgency}</span></div>}
                <div>💶 Stima: <span className="font-semibold text-foreground">{price}</span></div>
                {typeof ai.est_minutes === 'number' && <div>⏱️ Tempo: <span className="font-semibold text-foreground">~{ai.est_minutes} min</span></div>}
                {isOutOfZone && <div className="text-amber-500 font-semibold">⚠️ Include {OUT_OF_ZONE_FEE}€ di trasferta.</div>}
            </div>
            <p className="text-xs text-muted-foreground/80 pt-1">Il prezzo finale viene confermato dal tecnico prima dell’intervento.</p>
        </div>
    );
};

const RecapBlock = ({ form, ai }: { form: Partial<ChatFormState>; ai: AiResult | null; }): JSX.Element | null => {
    if (!ai) return null;
    const isOutOfZone = form.city?.toLowerCase() !== MAIN_CITY;
    const price_low = (ai.price_low ?? 0) + (isOutOfZone ? OUT_OF_ZONE_FEE : 0);
    const price_high = (ai.price_high ?? 0) + (isOutOfZone ? OUT_OF_ZONE_FEE : 0);
    const price = ai.requires_specialist_contact ? "Preventivo su misura" : `~${price_low}–${price_high}€`;

    return (
      <div className="space-y-1">
        <div className="font-medium text-foreground">Riepilogo finale</div>
        <div className="text-sm leading-6 text-muted-foreground">
          <div>👤 {form.name || '—'}</div>
          <div>📞 {form.phone || '—'}</div>
          <div>📍 {form.address || '—'}, {form.city || ''}</div>
          <div>📝 {form.message || '—'}</div>
          <div>🏷️ Servizio: <span className="font-medium text-foreground capitalize">{ai.category}</span></div>
          <div>💶 Stima: <span className="font-medium text-foreground">{price}</span></div>
          {isOutOfZone && !ai.requires_specialist_contact && <div className='text-amber-500 font-semibold'>⚠️ Include {OUT_OF_ZONE_FEE}€ di trasferta.</div>}
        </div>
        <div className="text-sm mt-2 pt-2 border-t border-border text-foreground">Tutto corretto? Confermi l'invio?</div>
      </div>
    );
};

const AuthCTA = (): JSX.Element => (
    <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Per salvare le tue richieste, crea un account o accedi.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/register" className="w-full text-center px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-secondary transition-colors">Registrati</Link>
          <Link href="/login" className="w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">Accedi</Link>
        </div>
    </div>
);

const ChatBubble = ({ role, children }: { role: 'user' | 'assistant', children: ReactNode }): JSX.Element => (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-md md:max-w-lg rounded-2xl px-4 py-3 shadow-sm ${role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground border rounded-bl-none'}`}>
            {children}
        </div>
    </div>
);

const Typing = (): JSX.Element => (
    <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
);

// --- Componente Principale ChatInterface ---
const ChatInterface = (): JSX.Element => {
    const { data: session } = useSession();
    const [msgs, setMsgs] = useState<Msg[]>([]);
    const [step, setStep] = useState<Step>('problem');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiResult, setAiResult] = useState<AiResult | null>(null);
    const [form, setForm] = useState<Partial<ChatFormState>>({});
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior,
            });
        }
    };

    useEffect(() => {
        scrollToBottom(isInitialLoad ? 'auto' : 'smooth');
        if (isInitialLoad && inputRef.current) {
            inputRef.current.focus();
            setIsInitialLoad(false);
        }
    }, [msgs, isInitialLoad]);

    const handleInputFocus = () => {
        setTimeout(() => scrollToBottom('smooth'), 150);
    };

    const handleScrollInteraction = () => {
        if (document.activeElement === inputRef.current) {
            inputRef.current?.blur();
        }
    };

    const addMessage = (role: 'user' | 'assistant', content: ReactNode) => {
        setMsgs(prev => [...prev, { id: Date.now() + Math.random(), role, content }]);
    };
    
    const replaceLastBotMessage = (content: ReactNode) => {
        setMsgs(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant') {
                return [...prev.slice(0, -1), { ...last, content }];
            }
            return [...prev, { id: Date.now() + Math.random(), role: 'assistant', content }];
        });
    };
    
    const handleSuggestionClick = (text: string) => {
        setInput(text);
        setTimeout(() => {
            inputRef.current?.form?.requestSubmit();
        }, 50);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || loading) return;

        addMessage('user', text);
        if (inputRef.current) {
            inputRef.current.blur();
        }
        
        setInput('');
        setLoading(true);

        try {
            switch (step) {
                case 'problem': {
                    setForm({ message: text });
                    addMessage('assistant', <Typing />);
                    const res = await fetch('/api/assist', { method: 'POST', body: JSON.stringify({ message: text }), headers: {'Content-Type': 'application/json'} });
                    const { ok, data, error } = await res.json();
                    if (!ok) throw new Error(error);

                    setAiResult(data);
                    
                    if (data.category === 'none' || !data.clarification_question) {
                        replaceLastBotMessage(data.summary);
                    } else {
                        replaceLastBotMessage(chatCopy.clarification(data.category, data.clarification_question));
                        setStep('clarification');
                    }
                    break;
                }
                case 'clarification': {
                    addMessage('assistant', <Typing />);
                    const fullMessage = `${form.message || ''}\n\nRisposta: ${text}`;
                    setForm(f => ({...f, message: fullMessage}));
                    
                    const res = await fetch('/api/assist', { method: 'POST', body: JSON.stringify({ message: fullMessage, originalCategory: aiResult?.category }), headers: {'Content-Type': 'application/json'} });
                    const { ok, data, error } = await res.json();
                    if (!ok) throw new Error(error);
                    
                    setAiResult(data);
                    
                    if (data.requires_specialist_contact) {
                        replaceLastBotMessage(chatCopy.specialistIntro);
                        addMessage('assistant', chatCopy.specialistProceed);
                    } else {
                        replaceLastBotMessage(<EstimateBlock ai={data} />);
                        addMessage('assistant', chatCopy.estimateIntro);
                    }
                    setStep('post-quote');
                    break;
                }
                case 'post-quote': {
                    addMessage('assistant', <Typing />);
                    if (isAffirmative(text)) {
                        replaceLastBotMessage(chatCopy.askForName);
                        setStep('name');
                    } else {
                        replaceLastBotMessage(chatCopy.askForFeedbackOnNo);
                        setStep('clarification');
                    }
                    break;
                }
                case 'name':
                    addMessage('assistant', <Typing />);
                    setForm((f) => ({ ...f, name: text }));
                    replaceLastBotMessage(chatCopy.askForPhone);
                    setStep('phone');
                    break;
                case 'phone':
                    addMessage('assistant', <Typing />);
                    if (!phoneOk(text)) {
                        replaceLastBotMessage('Per favore, inserisci un numero di telefono valido.');
                        return; 
                    }
                    setForm((f) => ({ ...f, phone: text }));
                    replaceLastBotMessage(chatCopy.askForEmail);
                    setStep('email');
                    break;
                case 'email':
                    addMessage('assistant', <Typing />);
                    setForm((f) => ({...f, email: /^(no|niente|salta)$/i.test(text) ? '' : text }));
                    replaceLastBotMessage(chatCopy.askForCity);
                    setStep('city');
                    break;
                case 'city': {
                    addMessage('assistant', <Typing />);
                    const newCity = text.trim();
                    const isOutOfZone = newCity.toLowerCase() !== MAIN_CITY && newCity.toLowerCase() !== '';
                    setForm((f) => ({ ...f, city: newCity }));
                    
                    if (aiResult && !aiResult.requires_specialist_contact && isOutOfZone) {
                        replaceLastBotMessage(<EstimateBlock ai={aiResult} isOutOfZone={isOutOfZone} />);
                        addMessage('assistant', chatCopy.askForAddress);
                    } else {
                        replaceLastBotMessage(`Ottimo, ci troviamo a ${newCity}. ` + chatCopy.askForAddress);
                    }
                    
                    setStep('address');
                    break;
                }
                case 'address':
                    addMessage('assistant', <Typing />);
                    setForm((f) => ({...f, address: text}));
                    replaceLastBotMessage(chatCopy.askForTimeslot);
                    setStep('timeslot');
                    break;
                case 'timeslot':
                    addMessage('assistant', <Typing />);
                    const finalForm = {...form, timeslot: /^(no|niente|nessuna)$/i.test(text) ? 'Nessuna preferenza' : text};
                    setForm(finalForm);
                    replaceLastBotMessage(<RecapBlock form={finalForm} ai={aiResult} />);
                    setStep('confirm');
                    break;
                case 'confirm': {
                    addMessage('assistant', <Typing />);
                    if (!isAffirmative(text)) {
                        replaceLastBotMessage(chatCopy.requestCancelled);
                        setStep('done');
                        return;
                    }
                    
                    const contactRes = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, ai: aiResult }) });
                    const contactData = await contactRes.json();
                    if (!contactData.ok) throw new Error(contactData.error || 'Errore durante l\'invio della richiesta.');
                    
                    replaceLastBotMessage(<div dangerouslySetInnerHTML={{ __html: chatCopy.requestSent(contactData.ticketId) }} />);
                    
                    if (session) {
                        addMessage('assistant', <>La richiesta è stata salvata. Puoi visualizzarla nella tua <Link href="/dashboard" className="underline font-semibold text-primary">Dashboard</Link>.</>);
                    } else {
                        addMessage('assistant', <AuthCTA/>);
                    }
                    setStep('done');
                    break;
                }
                case 'done': break;
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Si è verificato un errore.';
            replaceLastBotMessage(<div className="text-destructive">{chatCopy.error(message)}</div>);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col bg-background h-full shadow-lg border border-border rounded-t-xl">
            <div 
                ref={scrollContainerRef} 
                className="flex-1 overflow-y-auto"
                onTouchStart={handleScrollInteraction}
            >
                {msgs.length === 0 ? (
                    <ChatIntroScreen onSuggestionClick={handleSuggestionClick} />
                ) : (
                    <div className="p-4 space-y-4">
                        {msgs.map((m) => <ChatBubble key={m.id} role={m.role}>{m.content}</ChatBubble>)}
                    </div>
                )}
            </div>

            {step !== 'done' && (
                <div className="p-4 bg-card/80 backdrop-blur-sm border-t border-border">
                    <form onSubmit={handleSend} className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            onFocus={handleInputFocus}
                            className="w-full px-4 py-2.5 bg-secondary border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Descrivi il tuo problema..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 disabled:bg-primary/70 disabled:cursor-not-allowed transition-colors" disabled={loading || !input.trim()} aria-label="Invia messaggio">
                           {loading ? <LoaderCircle size={20} className="animate-spin"/> : <SendHorizontal size={20} />}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default function ChatPage() {
    return (
        <main className="flex-1 container mx-auto p-0 flex flex-col min-h-0">
            <ChatInterface />
        </main>
    );
}