'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { MessageSquare, Clock, Star, Trash2, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import type { Database } from '@/lib/database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  lastMessage?: {
    content: string;
    created_at: string;
    role: string;
  } | null;
  messageCount: number;
  rating?: number | null;
  review_text?: string | null;
  review_created_at?: string | null;
};

interface ConversationsListProps {
  tickets: Ticket[];
}

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: 'Idraulico',
  electric: 'Elettricista',
  locksmith: 'Fabbro',
  climate: 'Climatizzazione',
  handyman: 'Tuttofare',
  generic: 'Generico',
};

export function ConversationsList({ tickets }: ConversationsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter tickets by search query
  const filteredTickets = tickets.filter((ticket) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ticket.description?.toLowerCase().includes(query) ||
      ticket.city?.toLowerCase().includes(query) ||
      ticket.address?.toLowerCase().includes(query) ||
      CATEGORY_LABELS[ticket.category || 'generic']?.toLowerCase().includes(query)
    );
  });

  // Separate active and completed
  const activeTickets = filteredTickets.filter((t) =>
    ['new', 'pending_verification', 'confirmed', 'assigned', 'in_progress'].includes(t.status)
  );
  const completedTickets = filteredTickets.filter((t) =>
    ['resolved', 'closed'].includes(t.status)
  );
  const cancelledTickets = filteredTickets.filter((t) => t.status === 'cancelled');

  const handleDelete = async (ticketId: string) => {
    if (!confirm('Vuoi davvero eliminare questa conversazione? Questa azione è irreversibile.')) {
      return;
    }

    setDeletingId(ticketId);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Conversazione eliminata');
        window.location.reload();
      } else {
        throw new Error('Errore durante eliminazione');
      }
    } catch {
      toast.error('Impossibile eliminare la conversazione');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Cerca conversazioni..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[500px] mb-6">
          <TabsTrigger value="active">
            In Corso <span className="ml-1.5 text-xs">({activeTickets.length})</span>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completate <span className="ml-1.5 text-xs">({completedTickets.length})</span>
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Annullate <span className="ml-1.5 text-xs">({cancelledTickets.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeTickets.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              message={searchQuery ? 'Nessuna conversazione trovata' : 'Nessuna conversazione attiva'}
              action={
                !searchQuery && (
                  <Button asChild className="mt-4">
                    <Link href="/chat">Inizia una Nuova Richiesta</Link>
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTickets.map((ticket) => (
                <ConversationCard
                  key={ticket.id}
                  ticket={ticket}
                  onDelete={handleDelete}
                  isDeleting={deletingId === ticket.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedTickets.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              message={searchQuery ? 'Nessuna conversazione trovata' : 'Nessuna conversazione completata'}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedTickets.map((ticket) => (
                <ConversationCard
                  key={ticket.id}
                  ticket={ticket}
                  onDelete={handleDelete}
                  isDeleting={deletingId === ticket.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledTickets.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              message={searchQuery ? 'Nessuna conversazione trovata' : 'Nessuna conversazione annullata'}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cancelledTickets.map((ticket) => (
                <ConversationCard
                  key={ticket.id}
                  ticket={ticket}
                  onDelete={handleDelete}
                  isDeleting={deletingId === ticket.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
  action,
}: {
  icon: any;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border">
      <Icon className="w-16 h-16 mb-4 opacity-20" />
      <p className="text-lg">{message}</p>
      {action}
    </div>
  );
}

function ConversationCard({
  ticket,
  onDelete,
  isDeleting,
}: {
  ticket: Ticket;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const isResolved = ['resolved', 'closed'].includes(ticket.status);
  const isCancelled = ticket.status === 'cancelled';
  const needsReview = isResolved && !ticket.rating;

  return (
    <Card className="overflow-hidden border-border transition-all hover:shadow-lg hover:border-blue-500/30 group relative">
      <CardContent className="p-0">
        <Link
          href={`/chat?ticket_id=${ticket.id}${isResolved || isCancelled ? '&readonly=true' : ''}`}
          className="block p-5 space-y-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <Badge
              variant={isResolved ? 'default' : isCancelled ? 'destructive' : 'secondary'}
              className="uppercase text-xs font-medium"
            >
              {CATEGORY_LABELS[ticket.category || 'generic']}
            </Badge>

            {needsReview && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20">
                <Star className="w-3 h-3 mr-1" />
                Da recensire
              </Badge>
            )}

            {ticket.rating && (
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < ticket.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <h3 className="font-semibold text-base line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
              {ticket.description || 'Conversazione senza titolo'}
            </h3>
            {ticket.city && (
              <p className="text-sm text-muted-foreground">
                📍 {ticket.city}
                {ticket.address && ` • ${ticket.address.substring(0, 30)}${ticket.address.length > 30 ? '...' : ''}`}
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{ticket.messageCount || 0} messaggi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {formatDistanceToNow(new Date(ticket.created_at), {
                  addSuffix: true,
                  locale: it,
                })}
              </span>
            </div>
          </div>

          {/* Last Message Preview */}
          {ticket.lastMessage && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground line-clamp-2">
                <span className="font-medium">
                  {ticket.lastMessage.role === 'user' ? 'Tu' : 'Niki'}:
                </span>{' '}
                {ticket.lastMessage.content}
              </p>
            </div>
          )}
        </Link>

        {/* Actions Footer */}
        <div className="px-5 pb-4 pt-2 flex items-center justify-between gap-2 border-t border-border bg-secondary/20">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/chat?ticket_id=${ticket.id}${isResolved || isCancelled ? '&readonly=true' : ''}`}>
              Apri Chat
            </Link>
          </Button>

          {needsReview && (
            <Button asChild size="sm" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white">
              <Link href={`/dashboard/review/${ticket.id}`}>
                <Star className="w-3.5 h-3.5 mr-1.5" />
                Recensisci
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onDelete(ticket.id);
            }}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 px-2"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
