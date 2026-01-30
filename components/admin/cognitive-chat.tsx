'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Send,
    Bot,
    Paperclip,
    Sparkles,
    Power
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Database } from '@/lib/database.types';
import { getChatHistory, sendAdminMessage, toggleAutopilot } from '@/app/actions/admin-chat-actions';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase-browser';
import { ChatMessage } from './chat-message';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type Ticket = Database['public']['Tables']['tickets']['Row'] & { ai_paused?: boolean | null };
type Message = Database['public']['Tables']['messages']['Row'];

const getSendButtonClass = (autoPilot: boolean, inputText: string) => {
    if (autoPilot) return 'bg-secondary text-muted-foreground cursor-not-allowed';
    return inputText ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-secondary text-muted-foreground';
};

interface CognitiveChatProps {
    readonly ticket: Ticket | null;
    readonly isMobileView?: boolean;
    readonly externalAutoPilot?: boolean;
    readonly onToggleAutoPilot?: (checked: boolean) => void;
}

export function CognitiveChat({ ticket, isMobileView, externalAutoPilot, onToggleAutoPilot }: CognitiveChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    // Internal state fallback
    const [internalAutoPilot, setInternalAutoPilot] = useState(true);

    const autoPilot = externalAutoPilot ?? internalAutoPilot;

    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial State Sync (Only if no external control)
    useEffect(() => {
        if (ticket && externalAutoPilot === undefined) {
            setInternalAutoPilot(!ticket.ai_paused);
        }
    }, [ticket, externalAutoPilot]);

    // FETCH & REALTIME SUBSCRIPTION
    useEffect(() => {
        if (!ticket) return;

        let isMounted = true;
        const supabase = createBrowserClient();

        // 1. Initial Fetch
        const fetchMessages = async () => {
            try {
                const history = await getChatHistory(ticket.id, ticket.chat_session_id || undefined);
                if (isMounted) {
                    setMessages(history);
                }
            } catch (error) {
                console.error("Failed to fetch messages", error);
                toast.error("Errore nel caricamento della chat");
            }
        };


        fetchMessages();

        // Helper to add unique message
        const addUniqueMessage = (messages: Message[], newMsg: Message) => {
            if (messages.some(m => m.id === newMsg.id)) return messages;
            return [...messages, newMsg];
        };

        // Realtime handler
        const handleNewMessage = (payload: RealtimePostgresChangesPayload<Message>) => {
            const newMsg = payload.new as Message;

            // Client-side filtering as requested:
            // Check if message belongs to this Ticket OR this Chat Session
            const isRelevant =
                (newMsg.ticket_id && newMsg.ticket_id === ticket.id) ||
                (newMsg.chat_session_id && newMsg.chat_session_id === ticket.chat_session_id);

            if (!isRelevant) return;

            setMessages(prev => addUniqueMessage(prev, newMsg));

            // Scroll to bottom on new message
            if (scrollRef.current) {
                setTimeout(() => {
                    scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight;
                }, 100);
            }
        };

        // 2. Realtime Subscription
        const channel = supabase
            .channel('admin-chat-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                handleNewMessage
            )
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [ticket]); // Re-run if selected ticket changes

    // Auto-scroll on messages change
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
            // No need to manually update state, Realtime will catch the INSERT.
        } catch {
            toast.error("Errore nell'invio del messaggio");
            setInputText(content);
        } finally {
            setIsSending(false);
        }
    };

    const handleToggleAutopilot = async (checked: boolean) => {
        if (onToggleAutoPilot) {
            onToggleAutoPilot(checked);
            return;
        }

        if (!ticket) return;
        setInternalAutoPilot(checked); // Optimistic UI
        try {
            await toggleAutopilot(ticket.id, !checked); // Paused is inverse of Enabled
            toast.success(checked ? "Autopilot Attivato" : "Controllo Manuale Attivato");
        } catch {
            setInternalAutoPilot(!checked); // Revert
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
            <div className="flex-1 flex items-center justify-center bg-background bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary to-background">
                <div className="text-center space-y-4 max-w-md px-6">
                    <div className="w-20 h-20 bg-card rounded-2xl mx-auto flex items-center justify-center border border-border shadow-2xl">
                        <Bot className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Centro di Comando Cognitivo</h2>
                    <p className="text-muted-foreground">
                        Seleziona un ticket dal feed per iniziare. L&apos;AI analizzerà automaticamente il contesto e suggerirà le risposte.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background relative">
            {/* Header Handoff Control */}
            <div className="hidden md:flex h-16 border-b border-border items-center justify-between px-6 bg-background/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                            {ticket.description.slice(0, 40)}...
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-border text-muted-foreground font-mono">
                                {ticket.chat_session_id || ticket.id}
                            </Badge>
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className={`w-1.5 h-1.5 rounded-full ${autoPilot ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                            {autoPilot ? 'AI Active Monitoring' : 'Manuale (Handoff)'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-card px-3 py-1.5 rounded-full border border-border">
                        <span className={`text-xs font-bold ${autoPilot ? 'text-emerald-500 dark:text-emerald-400' : 'text-muted-foreground'}`}>AUTO-PILOT</span>
                        <Switch
                            checked={autoPilot}
                            onCheckedChange={handleToggleAutopilot}
                            className="data-[state=checked]:bg-emerald-600"
                        />
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-border pb-32 md:pb-6">
                {/* ... existing chat content ... */}
                {/* System Note */}
                <div className="flex justify-center">
                    <div className="bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/30 px-3 py-1 rounded text-xs font-mono">
                        SISTEMA: Ticket creato da Web • {new Date(ticket.created_at).toLocaleTimeString()}
                    </div>
                </div>

                {messages.length === 0 && (
                    <div className="flex justify-center py-10 opacity-50">
                        <p className="text-sm text-muted-foreground">Nessun messaggio precedente.</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} ticket={ticket} />
                ))}

                {/* AI Thinking/Analysis Mock */}
                {autoPilot && messages.length > 0 && messages.at(-1)?.role === 'user' && (
                    <div className="flex justify-start max-w-[80%] opacity-70 animate-pulse">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                                <Bot className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-blue-500 dark:text-blue-400">ANALISI COGNITIVA...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background border-t border-border fixed bottom-0 inset-x-0 z-[60] md:static md:z-auto">
                {/* Magic Suggestions */}
                {!autoPilot && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-none">
                        <button onClick={() => setInputText("Per procedere ho bisogno di una foto del guasto. Puoi caricarla qui?")} className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-secondary border border-border hover:border-primary/30 rounded-full text-xs text-foreground transition-colors whitespace-nowrap">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            Richiedi foto
                        </button>
                        <button onClick={() => setInputText("Ciao, saresti disponibile per un intervento domani mattina?")} className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-secondary border border-border hover:border-primary/30 rounded-full text-xs text-foreground transition-colors whitespace-nowrap">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            Conferma disp.
                        </button>
                        <button onClick={() => setInputText("Ecco il preventivo per l'intervento richiesto: [LINK]")} className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-secondary border border-border hover:border-primary/30 rounded-full text-xs text-foreground transition-colors whitespace-nowrap">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            Preventivo std.
                        </button>
                    </div>
                )}

                <div className="relative flex items-end gap-2 bg-card p-2 rounded-xl border border-border focus-within:border-primary/50 transition-colors">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                        <Paperclip className="w-4 h-4" />
                    </Button>
                    <Textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={autoPilot ? "Disattiva autopilot per rispondere..." : "Scrivi un messaggio..."}
                        className="min-h-[20px] max-h-32 border-0 focus-visible:ring-0 bg-transparent p-2 resize-none text-foreground placeholder:text-muted-foreground leading-normal"
                        disabled={autoPilot || isSending}
                    />
                    <Button
                        onClick={handleSendMessage}
                        size="icon"
                        className={`h-9 w-9 mb-0.5 transition-all ${getSendButtonClass(autoPilot, inputText)}`}
                        disabled={autoPilot || !inputText || isSending}
                    >
                        {autoPilot ? <Power className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
                <div className="h-4 md:hidden" /> {/* Safe area spacer */}
            </div>
        </div>
    );
}
