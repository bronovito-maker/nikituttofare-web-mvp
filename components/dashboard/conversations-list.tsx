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
import { cn } from '@/lib/utils';
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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: 'Richiesta Inviata', color: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/30' },
  pending_verification: { label: 'In Verifica', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-500/30' },
  confirmed: { label: 'Confermato', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/30' },
  assigned: { label: 'Tecnico Assegnato', color: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-500/30' },
  in_progress: { label: 'Intervento in Corso', color: 'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-500/30' },
  resolved: { label: 'Risolto', color: 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-500/30' },
  closed: { label: 'Chiuso', color: 'bg-zinc-500/10 text-zinc-600 border-zinc-200 dark:border-zinc-500/30' },
  cancelled: { label: 'Annullato', color: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-500/30' },
};

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
  const statusInfo = STATUS_LABELS[ticket.status] || { label: ticket.status, color: 'bg-gray-500/10 text-gray-600' };

  return (
    <Card className="overflow-hidden border-border bg-card transition-all hover:shadow-md hover:border-brand/40 group relative">
      <CardContent className="p-0">
        <Link
          href={`/chat?ticket_id=${ticket.id}${isResolved || isCancelled ? '&readonly=true' : ''}`}
          className="block p-5 space-y-4"
        >
          {/* Header: Category & Status */}
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant="secondary"
              className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            >
              {CATEGORY_LABELS[ticket.category || 'generic']}
            </Badge>

            <Badge
              variant="outline"
              className={cn("px-2 py-0.5 text-[10px] font-semibold border", statusInfo.color)}
            >
              {statusInfo.label}
            </Badge>
          </div>

          {/* Description */}
          <div className="space-y-1.5 flex-1 mt-1">
            <h3 className="font-bold text-base leading-snug line-clamp-3 text-foreground group-hover:text-brand transition-colors">
              <span className="text-muted-foreground/70 text-xs font-bold uppercase tracking-widest block mb-1">
                📝 Riepilogo Intervento:
              </span>
              {ticket.description || 'Richiesta senza descrizione'}
            </h3>
            {ticket.city && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
                <span className="text-red-500 text-xs">📍</span> {ticket.city}
                {ticket.address && (
                  <span className="opacity-60 font-normal">
                    • {ticket.address.substring(0, 25)}{ticket.address.length > 25 ? '...' : ''}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Stats & Time */}
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground/80 pt-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {ticket.messageCount || 0} messaggi
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(ticket.created_at), {
                  addSuffix: true,
                  locale: it,
                })}
              </span>
            </div>

            {ticket.rating && (
              <div className="flex items-center gap-0.5 text-yellow-500 bg-yellow-500/5 px-1.5 py-0.5 rounded-full border border-yellow-500/10">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-[10px] font-bold">{ticket.rating}</span>
              </div>
            )}
          </div>

          {/* Last Message (Optional cleanup) */}
          {ticket.lastMessage && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-[11px] text-muted-foreground line-clamp-1 italic italic">
                <span className="font-semibold not-italic">
                  {ticket.lastMessage.role === 'user' ? 'Tu' : 'Niki'}:
                </span>{' '}
                {ticket.lastMessage.content}
              </p>
            </div>
          )}
        </Link>

        {/* Action Button Strip */}
        <div className="flex items-center gap-px border-t border-border bg-muted/30">
          <Link
            href={`/chat?ticket_id=${ticket.id}${isResolved || isCancelled ? '&readonly=true' : ''}`}
            className="flex-1 py-3 text-center text-sm font-bold bg-background hover:bg-muted transition-colors text-foreground flex items-center justify-center gap-2"
          >
            Apri Chat
          </Link>

          {needsReview && (
            <Link
              href={`/dashboard/review/${ticket.id}`}
              className="flex-1 py-3 text-center text-sm font-bold bg-yellow-500 hover:bg-yellow-600 text-white transition-colors flex items-center justify-center gap-2"
            >
              <Star className="w-4 h-4" />
              Recensisci
            </Link>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(ticket.id);
            }}
            disabled={isDeleting}
            className="px-4 h-11 text-red-500/70 hover:text-red-600 hover:bg-red-500/5 transition-colors disabled:opacity-50 border-l border-border"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
