// app/chat/page.tsx
'use client';

import React, { useEffect, useRef, useState, ReactNode } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { SendHorizontal } from 'lucide-react';

/* ───────── Costanti di Configurazione ───────── */
const OUT_OF_ZONE_FEE = 30;
const MAIN_CITY = 'livorno';

/* ───────── Tipi Interni ───────── */
interface ChatFormState {
    message: string;
    name: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    timeslot: string;
}
type AiResult = {
    category?: string;
    urgency?: string;
    price_low?: number;
    price_high?: number;
    est_minutes?: number;
    summary?: string;
};
type Step = 'problem' | 'post-quote' | 'name' | 'phone' | 'email' | 'city' | 'address' | 'timeslot' | 'confirm' | 'done';
type Msg = { id: number; role: 'user' | 'assistant'; content: ReactNode };

/* ───────── Funzioni Helper ───────── */
const isAffirmative = (text: string) => /^(s|si|sì|ok|va bene|procedi|confermo)/i.test(text);
const phoneOk = (v: string) => v.replace(/[^\d+]/g, '').length >= 8;

/* ───────── Componenti UI di Supporto ───────── */
const QuickReplies = ({ items, onPick }: { items: string[]; onPick: (s: string) => void }) => (
    <div className="flex flex-wrap gap-2 mt-2">
        {items.map((t) => (
            <button key={t} type="button" onClick={() => onPick(t)} className="px-3 py-1.5 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-full text-sm hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-colors">
                {t}
            </button>
        ))}
    </div>
);

const Intro = ({ onQuickReply }: { onQuickReply: (text: string) => void }) => (
    <div className="space-y-3">
      <div className="leading-relaxed">
        <p className="font-medium text-gray-800 dark:text-gray-100">Ciao, sono Niki. Come posso aiutarti oggi?</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Descrivi il tuo problema e ti fornirò una stima gratuita.</p>
      </div>
      <QuickReplies items={['Perdita lavandino', 'Presa non funziona', 'Serratura bloccata', 'Montare una mensola']} onPick={onQuickReply} />
    </div>
);

const EstimateBlock = ({ ai, isOutOfZone }: { ai: AiResult; isOutOfZone?: boolean }) => {
    const final_price_low = (ai.price_low ?? 0) + (isOutOfZone ? OUT_OF_ZONE_FEE : 0);
    const final_price_high = (ai.price_high ?? 0) + (isOutOfZone ? OUT_OF_ZONE_FEE : 0);
    const price = `~${final_price_low}–${final_price_high}€`;

    return (
        <div className="space-y-2">
            <p className="font-medium text-gray-800 dark:text-gray-100">Ecco la stima iniziale:</p>
            <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                {ai.category && <div>🏷️ Servizio: <span className="font-semibold text-gray-800 dark:text-gray-100 capitalize">{ai.category}</span></div>}
                {ai.urgency && <div>⚡ Urgenza: <span className="font-semibold text-gray-800 dark:text-gray-100 capitalize">{ai.urgency}</span></div>}
                <div>💶 Stima: <span className="font-semibold text-gray-800 dark:text-gray-100">{price}</span></div>
                {typeof ai.est_minutes === 'number' && <div>⏱️ Tempo: <span className="font-semibold text-gray-800 dark:text-gray-100">{ai.est_minutes} min</span></div>}
                {isOutOfZone && <div className="text-amber-500 font-semibold">⚠️ Include {OUT_OF_ZONE_FEE}€ di trasferta.</div>}
            </div>
            <p className="text-xs text-gray-500 pt-1">Il prezzo finale viene confermato dal tecnico prima dell’intervento.</p>
        </div>
    );
};

const RecapBlock = ({ form, ai }: { form: Partial<ChatFormState>; ai: AiResult | null; }) => {
    if (!ai) return null;
    const isOutOfZone = form.city?.toLowerCase() !== MAIN_CITY;
    const final_price_low = (ai.price_low ?? 0) + (isOutOfZone ? OUT_OF_ZONE_FEE : 0);
    const final_price_high = (ai.price_high ?? 0) + (isOutOfZone ? OUT_OF_ZONE_FEE : 0);
    const price = `~${final_price_low}–${final_price_high}€`;

    return (
      <div className="space-y-1">
        <div className="font-medium text-gray-800 dark:text-gray-100">Riepilogo finale</div>
        <div className="text-sm leading-6 text-gray-600 dark:text-gray-400">
          <div>👤 {form.name || '—'}</div>
          <div>📞 {form.phone || '—'}</div>
          <div>📍 {form.address || '—'}, {form.city || ''}</div>
          <div>📝 {form.message || '—'}</div>
          <div>🏷️ Servizio: <span className="font-medium text-gray-800 dark:text-gray-100 capitalize">{ai.category}</span></div>
          <div>💶 Stima: <span className="font-medium text-gray-800 dark:text-gray-100">{price}</span></div>
          {isOutOfZone && <div className='text-amber-500 font-semibold'>⚠️ Include {OUT_OF_ZONE_FEE}€ di trasferta.</div>}
        </div>
        <div className="text-sm mt-1 pt-1 text-gray-800 dark:text-gray-100">Tutto corretto? Confermi l'invio?</div>
      </div>
    );
};

const AuthCTA = () => (
    <div className="flex flex-col sm:flex-row gap-2 mt-2">
      <Link href="/register" className="w-full text-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Registrati</Link>
      <Link href="/login" className="w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">Accedi</Link>
    </div>
);

const ChatBubble = ({ role, children }: { role: 'user' | 'assistant', children: ReactNode }) => (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-md md:max-w-lg rounded-2xl px-4 py-3 ${role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none shadow-sm'}`}>
            {children}
        </div>
    </div>
);

const Typing = () => (
    <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
);

/* ───────── Componente Interfaccia Chat ───────── */
const ChatInterface = () => {
    const { data: session } = useSession();
    const [msgs, setMsgs] = useState<Msg[]>([]);
    const [step, setStep] = useState<Step>('problem');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiResult, setAiResult] = useState<AiResult | null>(null);
    const [form, setForm] = useState<Partial<ChatFormState>>({});
    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMsgs([{ id: Date.now(), role: 'assistant', content: <Intro onQuickReply={handleQuickReply} /> }]);
    }, []);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (!loading) inputRef.current?.focus();
    }, [msgs, loading]);

    const addMessage = (role: 'user' | 'assistant', content: ReactNode) => {
        setMsgs(prev => [...prev, { id: Date.now(), role, content }]);
    };
    
    const replaceLastBotMessage = (content: ReactNode) => {
        setMsgs(prev => {
            const last = prev[prev.length -1];
            if (last && last.role === 'assistant') {
                return [...prev.slice(0, -1), { ...last, content }];
            }
            return [...prev, {id: Date.now(), role: 'assistant', content}];
        });
    };

    const handleQuickReply = (text: string) => {
        setInput(text);
        setTimeout(() => inputRef.current?.form?.requestSubmit(), 50);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || loading) return;

        addMessage('user', text);
        setInput('');
        setLoading(true);

        try {
            switch (step) {
                case 'problem':
                    setForm({ message: text });
                    addMessage('assistant', <Typing />);
                    const res = await fetch('/api/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
                    const { ok, data, error } = await res.json();
                    if (!ok) throw new Error(error);

                    if (data.category === 'none') {
                        replaceLastBotMessage(data.summary);
                    } else {
                        setAiResult(data);
                        replaceLastBotMessage(<EstimateBlock ai={data} />);
                        addMessage('assistant', 'Se la stima ti sembra corretta, procedi scrivendo "sì".');
                        setStep('post-quote');
                    }
                    break;

                case 'post-quote':
                    addMessage('assistant', <Typing />);
                    if (isAffirmative(text)) {
                        replaceLastBotMessage('Ottimo! Come ti chiami?');
                        setStep('name');
                    } else {
                        setForm((f) => ({ ...f, message: `${f.message}\n- ${text}` }));
                        replaceLastBotMessage('Dettagli aggiunti. Confermi di voler procedere?');
                    }
                    break;
                
                case 'name':
                    addMessage('assistant', <Typing />);
                    setForm((f) => ({ ...f, name: text }));
                    replaceLastBotMessage('Qual è il tuo numero di telefono?');
                    setStep('phone');
                    break;

                case 'phone':
                    addMessage('assistant', <Typing />);
                    if (!phoneOk(text)) {
                        replaceLastBotMessage('Per favore, inserisci un numero di telefono valido.');
                        return; 
                    }
                    setForm((f) => ({ ...f, phone: text }));
                    replaceLastBotMessage('Grazie. La tua email? (opzionale, scrivi "no" per saltare)');
                    setStep('email');
                    break;

                case 'email':
                    addMessage('assistant', <Typing />);
                    setForm((f) => ({...f, email: /^(no|niente|salta)$/i.test(text) ? '' : text }));
                    replaceLastBotMessage('In che città ti trovi?');
                    setStep('city');
                    break;

                case 'city':
                    addMessage('assistant', <Typing />);
                    const newCity = text.trim();
                    setForm((f) => ({ ...f, city: newCity }));
                    if (newCity.toLowerCase() !== MAIN_CITY && newCity.toLowerCase() !== '') {
                        replaceLastBotMessage(`Ho notato che sei a ${newCity}. Per gli interventi fuori Livorno applichiamo un supplemento di ${OUT_OF_ZONE_FEE}€. Ti va bene?`);
                        addMessage('assistant', "Ora inserisci l'indirizzo completo per l'intervento.");
                    } else {
                        replaceLastBotMessage("Indirizzo completo per l'intervento?");
                    }
                    setStep('address');
                    break;

                case 'address':
                    addMessage('assistant', <Typing />);
                    setForm((f) => ({...f, address: text}));
                    replaceLastBotMessage('Hai preferenze di orario? (es. "domani mattina", "no")');
                    setStep('timeslot');
                    break;
                
                case 'timeslot':
                    addMessage('assistant', <Typing />);
                    const finalForm = {...form, timeslot: /^(no|niente|nessuna)$/i.test(text) ? 'Nessuna preferenza' : text};
                    setForm(finalForm);
                    replaceLastBotMessage(<RecapBlock form={finalForm} ai={aiResult} />);
                    setStep('confirm');
                    break;
                
                case 'confirm':
                    addMessage('assistant', <Typing />);
                    if (!isAffirmative(text)) {
                        replaceLastBotMessage('Richiesta annullata. Se hai bisogno di altro, sono qui!');
                        setStep('done');
                        return;
                    }
                    
                    const contactRes = await fetch('/api/contact', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...form, ai: aiResult })
                    });
                    const contactData = await contactRes.json();
                    if (!contactData.ok) throw new Error(contactData.error);
                    
                    replaceLastBotMessage(
                        <>Richiesta inviata con successo! (ID: <b>{contactData.ticketId}</b>)<br/>Ti contatterà a breve il primo tecnico.</>
                    );
                    
                    if (session) {
                        addMessage('assistant', 
                            <>La richiesta è stata salvata. Visualizzala nella tua <Link href="/dashboard" className="underline font-semibold text-blue-600 dark:text-blue-400">Dashboard</Link>.</>
                        );
                    } else {
                        addMessage('assistant', 
                            <><p>Per salvare le tue richieste future, puoi accedere o creare un account.</p><AuthCTA/></>
                        );
                    }
                    setStep('done');
                    break;
                case 'done': break;
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Si è verificato un errore.';
            replaceLastBotMessage(`Ops! Qualcosa è andato storto: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col bg-gray-100 dark:bg-gray-800 rounded-t-xl h-full shadow-lg">
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {msgs.map((m) => <ChatBubble key={m.id} role={m.role}>{m.content}</ChatBubble>)}
                <div ref={endRef} />
            </div>

            {step !== 'done' && (
                <div className="p-4 bg-white dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                    <form onSubmit={handleSend} className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Scrivi il tuo messaggio..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                        <button type="submit" className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors" disabled={loading || !input.trim()} aria-label="Invia messaggio">
                            <SendHorizontal size={20} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

/* ───────── Componente Principale della Pagina ───────── */
export default function ChatPage() {
    return (
        <main className="flex-grow container mx-auto p-0 md:pt-4 flex">
            <ChatInterface />
        </main>
    );
}