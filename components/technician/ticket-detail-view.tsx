'use client';

import { useState } from 'react';
import { MapPin, Calendar, Clock, Banknote, ArrowLeft, MessageCircle, User, Maximize2, X, Phone, MessageSquare, Wrench, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Database } from '@/lib/database.types';
import { cn } from '@/lib/utils';

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
    meta_data?: {
        ai_suggested_tools?: string[];
        [key: string]: any;
    } | null;
};

interface MessageItem {
    id: string;
    role: string;
    content: string;
}

interface TicketDetailViewProps {
    ticket: Ticket;
    messages?: MessageItem[];
    actionSlot?: React.ReactNode;
    bannerSlot?: React.ReactNode;
    backLink?: string;
    showCustomerDetails?: boolean;
}

export function TicketDetailView({
    ticket,
    messages = [],
    actionSlot,
    bannerSlot,
    backLink = "/technician",
    showCustomerDetails = false
}: TicketDetailViewProps) {
    const [isZoomed, setIsZoomed] = useState(false);

    // Format Date
    const dateStr = new Date(ticket.created_at).toLocaleString('it-IT', {
        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    });

    const timeAgo = formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: it });

    // Format Price
    const priceDisplay = ticket.price_range_min && ticket.price_range_max
        ? `€${ticket.price_range_min} - €${ticket.price_range_max}`
        : (ticket.price_range_max ? `Fino a €${ticket.price_range_max}` : 'Da concordare');

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ticket.address || ''} ${ticket.city || ''}`)}`;
    const whatsappUrl = ticket.contact_phone
        ? `https://wa.me/${ticket.contact_phone}?text=${encodeURIComponent(`Ciao ${ticket.customer_name || ''}, sono il tecnico di Niki Tuttofare. Sto arrivando per l'intervento: ${ticket.category}.`)}`
        : null;

    // Parse meta_data robustly
    let suggestedTools: string[] = [];
    try {
        // Handle double-stringified metadata that sometimes happens with n8n/Postgres
        let meta = ticket.meta_data;
        if (typeof meta === 'string') {
            try {
                meta = JSON.parse(meta);
            } catch (e) {
                // If it's not valid JSON, leave it as string
            }
        }

        if (meta && typeof meta === 'object') {
            let tools = (meta as any).ai_suggested_tools;

            // If tools is a string that looks like a JSON array/object, parse it
            if (typeof tools === 'string' && (tools.startsWith('[') || tools.startsWith('{'))) {
                try {
                    const parsedTools = JSON.parse(tools);
                    if (Array.isArray(parsedTools)) {
                        tools = parsedTools;
                    } else if (parsedTools && typeof parsedTools === 'object' && parsedTools.ai_suggested_tools) {
                        // Handle extreme nesting: {"ai_suggested_tools": ["..."]}
                        tools = parsedTools.ai_suggested_tools;
                    }
                } catch (e) { }
            }

            if (Array.isArray(tools)) {
                suggestedTools = tools;
            } else if (typeof tools === 'string') {
                suggestedTools = tools.split(',').map((t: string) => t.trim()).filter(Boolean);
            }

            // Final cleanup pass for each tool: remove quotes, braces, brackets, and potential JSON keys
            suggestedTools = suggestedTools.map(tool =>
                tool.replace(/["'{}[\]]/g, '') // Remove quotes, braces, brackets
                    .replace(/^ai_suggested_tools:\s*/i, '') // Remove key if it leaked in
                    .trim()
            ).filter(Boolean);
        }
    } catch (e) {
        console.error("Error parsing meta_data:", e);
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-8">

                {/* Back Button */}
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="shrink-0">
                        <Link href={backLink}>
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold tracking-tight truncate flex-1">
                        Dettaglio Intervento
                    </h1>
                </div>

                {/* Banner Slot (e.g. Status warnings) */}
                {bannerSlot}

                {/* Main Ticket Card */}
                <div className="bg-card text-card-foreground rounded-xl border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Photo Area with Zoom */}
                    <div
                        className="w-full h-56 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center group cursor-pointer overflow-hidden"
                        onClick={() => ticket.photo_url && setIsZoomed(true)}
                    >
                        {ticket.photo_url && ticket.photo_url !== 'null' && ticket.photo_url !== '' ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={ticket.photo_url}
                                    alt="Problema"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Maximize2 className="w-8 h-8 text-white drop-shadow-lg" />
                                </div>
                            </>
                        ) : (
                            <div className="text-center flex flex-col items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-3">
                                    <MapPin className="w-8 h-8 text-slate-400" />
                                </div>
                                <span className="text-lg font-black tracking-tighter text-slate-300 dark:text-slate-600 uppercase italic">
                                    NO FOTO
                                </span>
                                <span className="text-xs text-slate-400 mt-1">Nessuna immagine allegata</span>
                            </div>
                        )}
                        <div className="absolute top-4 right-4 flex gap-2">
                            <Badge variant="secondary" className="bg-background/80 backdrop-blur-md shadow-sm border-0">
                                {timeAgo}
                            </Badge>
                            <Badge className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90 uppercase">
                                {ticket.category || 'Generico'}
                            </Badge>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">

                        {/* Title & Description */}
                        <div>
                            <h2 className="text-2xl font-bold mb-2 capitalize leading-tight">{ticket.category}: {ticket.city || 'Intervento'}</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {ticket.description || 'Nessuna descrizione fornita.'}
                            </p>
                        </div>

                        <div className="h-px bg-border" />

                        {/* Meta Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                            <div className="flex items-start gap-3 group">
                                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Località</p>
                                    <a
                                        href={googleMapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group/link block"
                                    >
                                        <p className="font-semibold text-sm group-hover/link:text-blue-500 transition-colors underline decoration-blue-500/30 underline-offset-4">
                                            {ticket.address || 'Indirizzo non specificato'}
                                        </p>
                                        {ticket.city && <p className="text-xs text-muted-foreground mt-0.5">{ticket.city}</p>}
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 mt-1 uppercase">
                                            Apri in Maps <ExternalLink className="w-3 h-3" />
                                        </span>
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                    <Banknote className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Budget Stimato</p>
                                    <p className="font-bold text-sm text-foreground">
                                        {priceDisplay}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Data Richiesta</p>
                                    <p className="font-semibold text-sm">{dateStr}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2.5 rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Urgenza</p>
                                    <Badge variant={ticket.priority === 'high' || ticket.priority === 'urgent' ? 'destructive' : 'secondary'} className="uppercase text-[10px]">
                                        {ticket.priority || 'standard'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* AI Suggested Tools Section (Meta Data) */}
                        {suggestedTools && suggestedTools.length > 0 && (
                            <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl p-5 border border-amber-500/20">
                                    <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
                                        <Wrench className="w-4 h-4" /> Attrezzi Consigliati (AI)
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestedTools.map((tool: string, idx: number) => (
                                            <Badge key={idx} variant="outline" className="bg-background/50 border-amber-500/20 text-amber-700 dark:text-amber-300 py-1.5 px-3">
                                                {tool}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Customer Details Block (Only if claimed) */}
                    {showCustomerDetails && (
                        <div className="px-6 pb-6 animate-in fade-in duration-1000">
                            <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl p-6 border border-border space-y-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                                        <User className="w-4 h-4" /> Dati Cliente
                                    </h3>
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase py-0.5">Visibile solo a te</Badge>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xl font-bold text-foreground">{ticket.customer_name || 'Cliente Guest'}</p>
                                        <p className="text-sm text-muted-foreground mt-0.5">Contatto verificato</p>
                                    </div>

                                    <div className="flex flex-row items-center gap-3 w-full">
                                        {ticket.contact_phone && (
                                            <>
                                                <Button
                                                    asChild
                                                    size="lg"
                                                    className="rounded-xl flex-1 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 h-14 text-base font-bold"
                                                >
                                                    <a href={`tel:${ticket.contact_phone}`}>
                                                        <Phone className="w-5 h-5 mr-2" /> Chiama
                                                    </a>
                                                </Button>
                                                {whatsappUrl && (
                                                    <Button
                                                        asChild
                                                        size="lg"
                                                        className="rounded-xl flex-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 h-14 text-base font-bold border-none"
                                                    >
                                                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                                            <MessageSquare className="w-5 h-5 mr-2" /> WhatsApp
                                                        </a>
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                        {!ticket.contact_phone && (
                                            <span className="text-sm text-red-500 font-medium italic">Telefono non fornito</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chat Context (If available) */}
                    {messages && messages.length > 0 && (
                        <div className="border-t border-border bg-muted/20">
                            <div className="p-4 sm:p-6">
                                <h3 className="text-xs font-bold text-muted-foreground mb-5 flex items-center gap-2 uppercase tracking-widest">
                                    <MessageCircle className="w-4 h-4" /> Sommario Problema (Chat)
                                </h3>
                                <div className="space-y-4">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={cn(
                                            "p-4 rounded-2xl text-sm max-w-[90%] transition-colors",
                                            msg.role === 'assistant'
                                                ? 'bg-background border border-border mr-auto rounded-tl-none shadow-sm'
                                                : 'bg-primary/5 border border-primary/10 ml-auto rounded-tr-none text-slate-700 dark:text-slate-200'
                                        )}>
                                            <span className="font-bold block mb-1.5 opacity-40 uppercase text-[9px] tracking-widest">
                                                {msg.role === 'user' ? 'Cliente' : 'Niki AI'}
                                            </span>
                                            {msg.content}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Footer */}
                    {actionSlot && (
                        <div className="p-6 bg-muted/40 border-t flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 md:bg-transparent md:border-t-0">
                            {actionSlot}
                        </div>
                    )}

                </div>
            </div>

            {/* Lightbox / Zoom Portal */}
            {isZoomed && ticket.photo_url && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setIsZoomed(false)}
                >
                    <button
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        onClick={(e) => { e.stopPropagation(); setIsZoomed(false); }}
                    >
                        <X className="w-8 h-8" />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={ticket.photo_url}
                        alt="Zoom"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-500"
                    />
                </div>
            )}
        </div>
    );
}
