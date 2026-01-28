'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import {
    Search,
    Filter,
    CheckCircle2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/lib/database.types';
import { forceCloseTicket } from '@/app/actions/admin-actions';
import { toast } from 'sonner';

type Ticket = Database['public']['Tables']['tickets']['Row'];

interface TicketFeedProps {
    readonly tickets: Ticket[];
    readonly selectedTicketId?: string;
    readonly onSelectTicket: (ticketId: string) => void;
}

const getFilterLabel = (mode: 'ALL' | 'OPEN' | 'RESOLVED') => {
    switch (mode) {
        case 'OPEN': return 'Aperti';
        case 'RESOLVED': return 'Chiusi';
        default: return 'Tutti';
    }
};

export function TicketFeed({ tickets, selectedTicketId, onSelectTicket }: TicketFeedProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMode, setFilterMode] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL'); // ALL, OPEN, RESOLVED

    // Mock function to determine sentiment/urgency color
    const getUrgencyColor = (priority: string, status: string) => {
        if (status === 'resolved') return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
        if (priority === 'emergency') return 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]';
        if (priority === 'high') return 'bg-orange-500';
        return 'bg-blue-500';
    };

    const handleForceClose = async (e: React.MouseEvent, ticketId: string) => {
        e.stopPropagation(); // Stop selection trigger
        try {
            await forceCloseTicket(ticketId);
            toast.success("Ticket chiuso manualmente");
        } catch (error) {
            toast.error("Errore durante la chiusura");
            console.error(error);
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        // 1. Search Filter
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            (ticket.customer_name?.toLowerCase().includes(query) ?? false) ||
            (ticket.city?.toLowerCase().includes(query) ?? false) ||
            (ticket.description?.toLowerCase().includes(query) ?? false) ||
            (ticket.id.toLowerCase().includes(query)) ||
            (ticket.chat_session_id?.toLowerCase().includes(query) ?? false);

        if (!matchesSearch) return false;

        // 2. Status Filter
        if (filterMode === 'OPEN') {
            return ticket.status !== 'resolved';
        }
        if (filterMode === 'RESOLVED') {
            return ticket.status === 'resolved';
        }

        return true;
    });

    const cycleFilter = () => {
        if (filterMode === 'ALL') setFilterMode('OPEN');
        else if (filterMode === 'OPEN') setFilterMode('RESOLVED');
        else setFilterMode('ALL');
    };

    return (
        <div className="flex flex-col h-full bg-[#121212] border-r border-[#333]">
            {/* Feed Header */}
            <div className="p-4 border-b border-[#333] space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-200 tracking-tight flex items-center gap-2">
                        Ticket Feed
                        <Badge variant="secondary" className="bg-[#1a1a1a] text-xs font-mono text-slate-400 border border-[#333]">
                            {filteredTickets.length} / {tickets.length}
                        </Badge>
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                            {getFilterLabel(filterMode)}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={cycleFilter}
                            className={`h-8 w-8 transition-colors ${filterMode === 'ALL' ? 'text-slate-400 hover:text-white' : 'text-blue-400 bg-blue-400/10'}`}
                        >
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cerca ticket, cliente, ID..."
                        className="bg-[#1a1a1a] border-[#333] pl-9 text-slate-200 placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 h-9 text-sm rounded-lg transition-all"
                    />
                </div>
            </div>

            {/* Feed List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
                {filteredTickets.length === 0 ? (
                    <div className="p-8 text-center text-slate-600 text-sm">
                        Nessun ticket trovato.
                    </div>
                ) : (
                    <div className="divide-y divide-[#1f1f1f]">
                        {filteredTickets.map((ticket) => {
                            const isActive = selectedTicketId === ticket.id;

                            return (
                                <div
                                    key={ticket.id}
                                    onClick={() => onSelectTicket(ticket.id)}
                                    className={`w-full text-left p-4 hover:bg-[#1a1a1a] transition-all duration-200 group relative border-l-[3px] cursor-pointer ${isActive
                                        ? 'bg-[#1a1a1a] border-blue-500'
                                        : 'bg-transparent border-transparent hover:border-[#333]'
                                        }`}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            onSelectTicket(ticket.id);
                                        }
                                    }}
                                >
                                    {/* Traffic Light Indicator */}
                                    <div className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${getUrgencyColor(ticket.priority, ticket.status)}`} />

                                    <div className="space-y-1.5 pr-6">
                                        {/* Header Line */}
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                            <span className="font-mono text-[10px] opacity-70">{ticket.chat_session_id || ticket.id}</span>
                                            <span>•</span>
                                            <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: it })}</span>
                                        </div>

                                        {/* Customer & Title */}
                                        <div>
                                            <h3 className={`font-semibold text-sm truncate ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-200'}`}>
                                                {ticket.category ? ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1) : 'Richiesta Generica'}
                                            </h3>
                                            <p className="text-sm text-slate-500 truncate mt-0.5">
                                                {ticket.customer_name || 'Utente sconosciuto'}
                                            </p>
                                        </div>

                                        {/* Smart Chips */}
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {/* Location Chip */}
                                            {ticket.city && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1f1f1f] text-slate-400 border border-[#333]">
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
                                                    className="h-5 px-1.5 text-[10px] text-green-400 hover:text-green-300 hover:bg-green-400/10 ml-auto"
                                                    onClick={(e) => handleForceClose(e, ticket.id)}
                                                    title="Chiudi Lavoro"
                                                >
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Chiudi
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { readonly status: string }) {
    if (status === 'resolved') {
        return (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                Resolved
            </span>
        );
    }
    if (status === 'in_progress') {
        return (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-amber-500/10 text-amber-400 border-amber-500/20">
                In Corso
            </span>
        );
    }
    if (status === 'assigned') {
        return (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-purple-500/10 text-purple-400 border-purple-500/20">
                Assegnato
            </span>
        );
    }
    if (status === 'cancelled') {
        return (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-red-500/10 text-red-400 border-red-500/20">
                Cancellato
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20">
            {status === 'pending_verification' ? 'Da Verificare' : 'Nuovo'}
        </span>
    );
}
