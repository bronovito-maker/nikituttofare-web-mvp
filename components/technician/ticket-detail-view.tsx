import { MapPin, Calendar, Clock, Banknote, ArrowLeft, MessageCircle, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface TicketDetailViewProps {
    ticket: any; // We will use a stricter type if available, typically Database['public']['Tables']['tickets']['Row']
    messages?: any[];
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
    // Format Date
    const dateStr = new Date(ticket.created_at).toLocaleString('it-IT', {
        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    });

    const timeAgo = formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: it });

    // Format Price
    const priceDisplay = ticket.price_range_min && ticket.price_range_max
        ? `€${ticket.price_range_min} - €${ticket.price_range_max}`
        : (ticket.price_range_max ? `Fino a €${ticket.price_range_max}` : 'Da concordare');

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

                    {/* Map/Image Placeholder Area */}
                    <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center group">
                        {ticket.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={ticket.photo_url}
                                alt="Problema"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        ) : (
                            <div className="text-center text-slate-400">
                                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <span className="text-sm font-medium">Nessuna foto allegata</span>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Località</p>
                                    <p className="font-semibold text-sm">{ticket.address || 'Indirizzo non specificato'}</p>
                                    {ticket.city && <p className="text-xs text-muted-foreground">{ticket.city}</p>}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                                    <Banknote className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Budget Stimato</p>
                                    <p className="font-semibold text-sm">
                                        {priceDisplay}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Data Richiesta</p>
                                    <p className="font-semibold text-sm">{dateStr}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Urgenza</p>
                                    <p className="font-semibold capitalize text-sm">{ticket.priority || 'standard'}</p>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Customer Details Block (Only if claimed) */}
                    {showCustomerDetails && (
                        <div className="px-6 pb-6 animate-in fade-in duration-700">
                            <div className="bg-secondary/30 rounded-xl p-4 border border-border">
                                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" /> DATI CLIENTE
                                </h3>
                                <div>
                                    <p className="font-semibold text-foreground">{ticket.customer_name || 'Cliente Guest'}</p>
                                    <p className="text-primary font-medium text-sm mt-1 flex items-center gap-2">
                                        {ticket.contact_phone ? (
                                            <a href={`tel:${ticket.contact_phone}`} className="hover:underline">
                                                +{ticket.contact_phone}
                                            </a>
                                        ) : 'Telefono non disponibile'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chat Context (If available) */}
                    {messages && messages.length > 0 && (
                        <div className="border-t border-border bg-muted/20">
                            <div className="p-4 sm:p-6">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4" /> ESTRATTO CONVERSAZIONE
                                </h3>
                                <div className="space-y-3">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`p-3 rounded-lg text-sm max-w-[90%] ${msg.role === 'assistant'
                                                ? 'bg-background border border-border mr-auto rounded-tl-none'
                                                : 'bg-primary/10 text-primary-foreground ml-auto rounded-tr-none dark:text-emerald-100'
                                            }`}>
                                            <span className="font-bold block mb-1 opacity-50 uppercase text-[10px] tracking-wider">{msg.role === 'user' ? 'Cliente' : 'Niki AI'}</span>
                                            {msg.content}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Footer */}
                    {actionSlot && (
                        <div className="p-6 bg-muted/30 border-t flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                            {actionSlot}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
