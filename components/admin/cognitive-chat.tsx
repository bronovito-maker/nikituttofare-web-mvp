'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Send,
    Bot,
    User as UserIcon,
    Paperclip,
    Sparkles,
    Power,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Database } from '@/lib/database.types';
import { getChatHistory, sendAdminMessage, toggleAutopilot } from '@/app/actions/admin-chat-actions';
import { toast } from 'sonner';

type Ticket = Database['public']['Tables']['tickets']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

interface CognitiveChatProps {
    ticket: Ticket | null;
}

export function CognitiveChat({ ticket }: CognitiveChatProps) {
    const [autoPilot, setAutoPilot] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');

    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Sync autopilot state with ticket
    useEffect(() => {
        if (ticket) {
            // If ai_paused is in the DB types we could use it, otherwise state init
            setAutoPilot(!ticket.ai_paused);
        }
    }, [ticket]);

    // Fetch messages when ticket changes or periodically (polling)
    useEffect(() => {
        if (!ticket) return;

        let isMounted = true;
        const fetchMessages = async () => {
            try {
                // @ts-ignore - DB types might not fully align yet with chat_session_id if user hasn't regenerated them perfectly
                const history = await getChatHistory(ticket.id, ticket.chat_session_id);
                if (isMounted) {
                    setMessages(history);
                }
            } catch (error) {
                console.error("Failed to fetch messages", error);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Simple polling every 3s

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [ticket]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !ticket) return;

        const content = inputText;
        setInputText('');
        setIsSending(true);

        try {
            await sendAdminMessage(content, ticket.id, ticket.chat_session_id || undefined);
            // Optimistic update done by polling next cycle, or manual:
            // setMessages(prev => [...prev, { content, role: 'assistant', created_at: new Date().toISOString(), ... }])
        } catch (error) {
            toast.error("Errore nell'invio del messaggio");
            setInputText(content); // Restore input
        } finally {
            setIsSending(false);
        }
    };

    const handleToggleAutopilot = async (checked: boolean) => {
        if (!ticket) return;
        setAutoPilot(checked); // Optimistic UI
        try {
            await toggleAutopilot(ticket.id, !checked); // Paused is inverse of Enabled
            toast.success(checked ? "Autopilot Attivato" : "Controllo Manuale Attivato");
        } catch (error) {
            setAutoPilot(!checked); // Revert
            toast.error("Errore nel cambio stato Autopilot");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!ticket) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#121212] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a1a] to-[#121212]">
                <div className="text-center space-y-4 max-w-md px-6">
                    <div className="w-20 h-20 bg-[#1a1a1a] rounded-2xl mx-auto flex items-center justify-center border border-[#333] shadow-2xl">
                        <Bot className="w-10 h-10 text-slate-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-200">Centro di Comando Cognitivo</h2>
                    <p className="text-slate-500">
                        Seleziona un ticket dal feed per iniziare. L&apos;AI analizzerà automaticamente il contesto e suggerirà le risposte.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#121212] relative">
            {/* Header Handoff Control */}
            <div className="h-16 border-b border-[#333] flex items-center justify-between px-6 bg-[#121212]/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            {ticket.description.slice(0, 40)}...
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-[#333] text-slate-400 font-mono">
                                #{ticket.id.slice(0, 4)}
                            </Badge>
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className={`w-1.5 h-1.5 rounded-full ${autoPilot ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                            {autoPilot ? 'AI Active Monitoring' : 'Manuale (Handoff)'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-[#1a1a1a] px-3 py-1.5 rounded-full border border-[#333]">
                        <span className={`text-xs font-bold ${autoPilot ? 'text-emerald-400' : 'text-slate-500'}`}>AUTO-PILOT</span>
                        <Switch
                            checked={autoPilot}
                            onCheckedChange={handleToggleAutopilot}
                            className="data-[state=checked]:bg-emerald-600"
                        />
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#333]">
                {/* System Note */}
                <div className="flex justify-center">
                    <div className="bg-amber-900/20 text-amber-500 border border-amber-900/50 px-3 py-1 rounded text-xs font-mono">
                        SISTEMA: Ticket creato da Web • {new Date(ticket.created_at).toLocaleTimeString()}
                    </div>
                </div>

                {messages.length === 0 && (
                    <div className="flex justify-center py-10 opacity-50">
                        <p className="text-sm text-slate-500">Nessun messaggio precedente.</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'} max-w-[85%]`}>
                            <div className={`flex gap-3 ${isUser ? '' : 'flex-row-reverse'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-slate-800' : 'bg-blue-600/20 border border-blue-500/30'}`}>
                                    {isUser ? <UserIcon className="w-4 h-4 text-slate-400" /> : <Bot className="w-4 h-4 text-blue-400" />}
                                </div>
                                <div className="space-y-1">
                                    <div className={`flex items-baseline gap-2 ${isUser ? '' : 'justify-end'}`}>
                                        <span className="text-sm font-bold text-slate-300">{isUser ? (ticket.customer_name || 'Utente') : 'Niki AI'}</span>
                                        <span className="text-xs text-slate-500">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className={`p-3 rounded-2xl border text-sm leading-relaxed ${isUser
                                        ? 'bg-[#1e1e1e] border-[#333] rounded-tl-none text-slate-300'
                                        : 'bg-blue-950/30 border-blue-900/50 rounded-tr-none text-blue-100'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* AI Thinking/Analysis Mock */}
                {autoPilot && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                    <div className="flex justify-start max-w-[80%] opacity-70 animate-pulse">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-900/20 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                                <Bot className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-blue-400">ANALISI COGNITIVA...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#121212] border-t border-[#333]">
                {/* Magic Suggestions */}
                {!autoPilot && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-none">
                        <button onClick={() => setInputText("Per procedere ho bisogno di una foto del guasto. Puoi caricarla qui?")} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-slate-600 rounded-full text-xs text-slate-300 transition-colors whitespace-nowrap">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            Richiedi foto
                        </button>
                        <button onClick={() => setInputText("Ciao, saresti disponibile per un intervento domani mattina?")} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-slate-600 rounded-full text-xs text-slate-300 transition-colors whitespace-nowrap">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            Conferma disp.
                        </button>
                        <button onClick={() => setInputText("Ecco il preventivo per l'intervento richiesto: [LINK]")} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-slate-600 rounded-full text-xs text-slate-300 transition-colors whitespace-nowrap">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            Preventivo std.
                        </button>
                    </div>
                )}

                <div className="relative flex items-end gap-2 bg-[#1a1a1a] p-2 rounded-xl border border-[#333] focus-within:border-slate-600 transition-colors">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-300">
                        <Paperclip className="w-4 h-4" />
                    </Button>
                    <Textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={autoPilot ? "Disattiva autopilot per rispondere..." : "Scrivi un messaggio..."}
                        className="min-h-[20px] max-h-32 border-0 focus-visible:ring-0 bg-transparent p-2 resize-none text-slate-200 placeholder:text-slate-600 leading-normal"
                        disabled={autoPilot || isSending}
                    />
                    <Button
                        onClick={handleSendMessage}
                        size="icon"
                        className={`h-9 w-9 mb-0.5 transition-all ${autoPilot
                            ? 'bg-[#222] text-slate-600 cursor-not-allowed'
                            : (inputText ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-[#222] text-slate-500')
                            }`}
                        disabled={autoPilot || !inputText || isSending}
                    >
                        {autoPilot ? <Power className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
                <p className="text-[10px] text-slate-600 text-center mt-2 font-mono">
                    {autoPilot
                        ? "SISTEMA IN ASCOLTO ATTIVO. INTERVIENI SOLO IN EMERGENZA."
                        : "MODALITÀ MANUALE ATTIVA. PREMI ENTER PER INVIARE."}
                </p>
            </div>
        </div>
    );
}
