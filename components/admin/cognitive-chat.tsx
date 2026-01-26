'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Send,
    Bot,
    User as UserIcon,
    Paperclip,
    Sparkles,
    MoreVertical,
    CornerDownLeft,
    Power
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Database } from '@/lib/database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'];

interface CognitiveChatProps {
    ticket: Ticket | null;
}

export function CognitiveChat({ ticket }: CognitiveChatProps) {
    const [autoPilot, setAutoPilot] = useState(true);
    const [inputText, setInputText] = useState('');

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
                            onCheckedChange={setAutoPilot}
                            className="data-[state=checked]:bg-emerald-600"
                        />
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#333]">
                {/* System Note */}
                <div className="flex justify-center">
                    <div className="bg-amber-900/20 text-amber-500 border border-amber-900/50 px-3 py-1 rounded text-xs font-mono">
                        SISTEMA: Ticket creato da Web • {new Date(ticket.created_at).toLocaleTimeString()}
                    </div>
                </div>

                {/* User Message */}
                <div className="flex justify-start max-w-[80%]">
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-slate-300">{ticket.customer_name || 'Utente'}</span>
                                <span className="text-xs text-slate-500">10:42 PM</span>
                            </div>
                            <div className="bg-[#1e1e1e] p-3 rounded-2xl rounded-tl-none border border-[#333] text-slate-300 text-sm leading-relaxed">
                                {ticket.description}
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Thinking/Analysis Mock */}
                {autoPilot && (
                    <div className="flex justify-start max-w-[80%] opacity-70">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-900/20 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                                <Bot className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-blue-400">ANALISI COGNITIVA...</span>
                                </div>
                                <div className="flex gap-2 text-xs">
                                    <Badge variant="outline" className="bg-blue-950/30 border-blue-800 text-blue-300">Intento: Richiesta Preventivo</Badge>
                                    <Badge variant="outline" className="bg-blue-950/30 border-blue-800 text-blue-300">Urgenza: Alta</Badge>
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
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-slate-600 rounded-full text-xs text-slate-300 transition-colors whitespace-nowrap">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            Richiedi foto del guasto
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-slate-600 rounded-full text-xs text-slate-300 transition-colors whitespace-nowrap">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            Conferma disponibilità
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-slate-600 rounded-full text-xs text-slate-300 transition-colors whitespace-nowrap">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            Invia preventivo standard
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
                        placeholder={autoPilot ? "Disattiva autopilot per rispondere..." : "Scrivi un messaggio o TAB per suggerimento..."}
                        className="min-h-[20px] max-h-32 border-0 focus-visible:ring-0 bg-transparent p-2 resize-none text-slate-200 placeholder:text-slate-600 leading-normal"
                        disabled={autoPilot}
                    />
                    <Button
                        size="icon"
                        className={`h-9 w-9 mb-0.5 transition-all ${autoPilot
                                ? 'bg-[#222] text-slate-600 cursor-not-allowed'
                                : (inputText ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-[#222] text-slate-500')
                            }`}
                        disabled={autoPilot || !inputText}
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
