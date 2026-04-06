"use client";

import React, { useState } from 'react';
import { MessageCircle, ExternalLink, Send, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WhatsappData {
    numero: string;
    testo: string;
    link_whatsapp: string;
}

interface WhatsappCardProps {
    data: WhatsappData;
    className?: string;
}

export function WhatsappCard({ data, className }: WhatsappCardProps) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(data.testo);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className={cn("bg-emerald-950/40 border border-emerald-900/50 rounded-xl overflow-hidden shadow-lg my-3", className)}>
            <div className="bg-emerald-900/40 px-4 py-2 border-b border-emerald-800/50 flex flex-row items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-emerald-100 text-sm">Bozza Messaggio WhatsApp</h4>
            </div>
            
            <div className="p-4 flex flex-col gap-3">
                <div className="text-xs text-emerald-200/70 font-mono">
                    A: <span className="text-emerald-100 font-semibold">{data.numero}</span>
                </div>
                
                <div className="bg-slate-900/60 rounded-lg p-3 text-sm text-slate-200 border border-slate-800 whitespace-pre-wrap relative">
                    {/* Fumetto tail (opzionale, per dare l'idea del messaggio) */}
                    <div className="absolute -left-2 top-4 w-4 h-4 bg-slate-900/60 rotate-45 border-l border-b border-slate-800 border-r-0 border-t-0" />
                    <span className="relative z-10 italic">"{data.testo}"</span>
                </div>

                <div className="mt-2 flex gap-2">
                    <button
                        onClick={handleCopy}
                        className={cn(
                            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all active:scale-95",
                            isCopied 
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                        )}
                    >
                        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {isCopied ? "Copiato!" : "Copia Testo"}
                    </button>
                    
                    <a 
                        href={data.link_whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-[1.5] items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2.5 text-sm font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                    >
                        <Send className="w-4 h-4" />
                        Apri in App
                        <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                    </a>
                </div>
            </div>
        </div>
    );
}
