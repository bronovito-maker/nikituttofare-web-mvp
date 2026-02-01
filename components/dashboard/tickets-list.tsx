'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { MessageCircle, Clock, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Simple Ticket Interface (adapt based on your actual DB schema)
interface Ticket {
    id: string;
    created_at: string;
    description: string;
    status: 'new' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
    category: string;
    city?: string;
    address?: string;
}

interface TicketsListProps {
    tickets: Ticket[];
}

export function TicketsList({ tickets }: TicketsListProps) {
    const activeTickets = tickets.filter(t => ['new', 'assigned', 'in_progress'].includes(t.status));
    const historyTickets = tickets.filter(t => ['resolved', 'closed', 'cancelled'].includes(t.status));

    return (
        <div className="space-y-6">
            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
                    <TabsTrigger value="active">In Corso ({activeTickets.length})</TabsTrigger>
                    <TabsTrigger value="history">Storico ({historyTickets.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    {activeTickets.length === 0 ? (
                        <EmptyState message="Nessun intervento attivo al momento." />
                    ) : (
                        activeTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} isActive={true} />)
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    {historyTickets.length === 0 ? (
                        <EmptyState message="Non hai ancora interventi conclusi." />
                    ) : (
                        historyTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} isActive={false} />)
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border">
            <Wrench className="w-12 h-12 mb-3 opacity-20" />
            <p>{message}</p>
        </div>
    );
}

function TicketCard({ ticket, isActive }: { ticket: Ticket, isActive: boolean }) {
    const isEmergency = ticket.category === 'emergency';

    return (
        <Card className="overflow-hidden border-border transition-all hover:bg-secondary/5 group">
            <CardContent className="p-0">
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">

                    {/* Status Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'
                        }`}>
                        {getStatusIcon(ticket.status)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs font-normal border-border/50 uppercase tracking-wider">
                                {ticket.category || 'Generico'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: it })}
                            </span>
                        </div>
                        <h3 className="font-semibold text-lg truncate pr-2 leading-tight mb-1">
                            {ticket.description}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                            {ticket.city} {ticket.address ? `• ${ticket.address}` : ''}
                        </p>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0 pt-2 sm:pt-0">
                        {isActive ? (
                            <Button asChild size="sm" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                                <Link href={`/chat?ticket_id=${ticket.id}`}>
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Visualizza Chat
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                                <Link href={`/chat?ticket_id=${ticket.id}&readonly=true`}>
                                    Vedi Dettagli
                                </Link>
                            </Button>
                        )}
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}

function getStatusIcon(status: string) {
    switch (status) {
        case 'resolved':
        case 'closed':
            return <CheckCircle2 className="w-6 h-6" />;
        case 'cancelled':
            return <AlertCircle className="w-6 h-6" />;
        default: // new, assigned, in_progress
            return <Clock className="w-6 h-6" />;
    }
}
