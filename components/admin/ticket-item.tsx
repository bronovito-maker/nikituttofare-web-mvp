import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { CheckCircle2, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Database } from '@/lib/database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'];

interface TicketItemProps {
    readonly ticket: Ticket;
    readonly isActive: boolean;
    readonly onSelect: (ticketId: string) => void;
    readonly onForceClose: (e: React.MouseEvent, ticketId: string) => Promise<void>;
    readonly onMarkAsPaid?: (e: React.MouseEvent, ticketId: string) => Promise<void>;
}

export function TicketItem({ ticket, isActive, onSelect, onForceClose, onMarkAsPaid }: Readonly<TicketItemProps>) {
    const getUrgencyColor = (priority: string, status: string) => {
        if (status === 'resolved') return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
        if (priority === 'emergency') return 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]';
        if (priority === 'high') return 'bg-orange-500';
        return 'bg-blue-500';
    };

    return (
        <button
            type="button"
            onClick={() => onSelect(ticket.id)}
            className={`w-full text-left p-4 hover:bg-secondary/50 transition-all duration-200 group relative border-l-[3px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${isActive
                ? 'bg-secondary/50 border-blue-500'
                : 'bg-transparent border-transparent hover:border-border'
                }`}
        >
            {/* Traffic Light Indicator */}
            <div className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${getUrgencyColor(ticket.priority, ticket.status)}`} />

            <div className="space-y-1.5 pr-6">
                {/* Header Line */}
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="font-mono text-[10px] opacity-70">{ticket.chat_session_id || ticket.id}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: it })}</span>
                </div>

                {/* Customer & Title */}
                <div>
                    <h3 className={`font-semibold text-sm truncate ${isActive ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'}`}>
                        {ticket.category ? ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1) : 'Richiesta Generica'}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {ticket.customer_name || 'Utente sconosciuto'}
                    </p>
                </div>

                {/* Smart Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {/* Location Chip */}
                    {ticket.city && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-muted-foreground border border-border">
                            {ticket.city}
                        </span>
                    )}

                    {/* Status Chip */}
                    <StatusBadge status={ticket.status} />

                    {/* Force Close Action */}
                    {ticket.status !== 'resolved' && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 px-1.5 text-[10px] text-green-600 dark:text-green-400 hover:text-green-500 hover:bg-green-500/10 ml-auto"
                            onClick={(e) => onForceClose(e, ticket.id)}
                            title="Chiudi Lavoro"
                            aria-label="Chiudi ticket manualmente"
                        >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Chiudi
                        </Button>
                    )}

                    {/* Payment Action */}
                    {ticket.payment_status !== 'paid' && onMarkAsPaid && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 px-1.5 text-[10px] text-amber-600 dark:text-amber-400 hover:text-amber-500 hover:bg-amber-500/10"
                            onClick={(e) => onMarkAsPaid(e, ticket.id)}
                            title="Segna come Pagato"
                            aria-label="Segna ticket come pagato"
                        >
                            <Banknote className="w-3 h-3 mr-1" />
                            Pagato
                        </Button>
                    )}

                    {/* Payment Status Badge */}
                    {ticket.payment_status === 'paid' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                            💰 Pagato
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}

function StatusBadge({ status }: { readonly status: string }) {
    if (status === 'resolved') {
        return (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                Resolved
            </span>
        );
    }
    if (status === 'in_progress') {
        return (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                In Corso
            </span>
        );
    }
    if (status === 'assigned') {
        return (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                Assegnato
            </span>
        );
    }
    if (status === 'cancelled') {
        return (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                Cancellato
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            {status === 'pending_verification' ? 'Da Verificare' : 'Nuovo'}
        </span>
    );
}
