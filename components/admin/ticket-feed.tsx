'use client';

import { useState } from 'react';
import {
    Search,
    Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/lib/database.types';
import { forceCloseTicket } from '@/app/actions/admin-actions';
import { toast } from 'sonner';
import { TicketItem } from './ticket-item';

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
                    <h2 className="text-lg font-bold text-slate-200 tracking-tight flex items-center gap-2 ml-12 md:ml-0">
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
                            aria-label={`Filtro stato: ${getFilterLabel(filterMode)}`}
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
                        aria-label="Cerca ticket"
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
                        {filteredTickets.map((ticket) => (
                            <TicketItem
                                key={ticket.id}
                                ticket={ticket}
                                isActive={selectedTicketId === ticket.id}
                                onSelect={onSelectTicket}
                                onForceClose={handleForceClose}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
