import { createServerClient } from '@/lib/supabase-server';
import { ConversationsList } from '@/components/dashboard/conversations-list';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MobileNav } from '@/components/dashboard/mobile-nav';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function ConversationsPage() {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch tickets with message counts and last message
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select(`
      *,
      messages:messages(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
  }

  // Get last message for each ticket separately (Supabase limitation)
  const ticketsWithLastMessage = await Promise.all(
    (tickets || []).map(async (ticket) => {
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, created_at, role')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        ...ticket,
        lastMessage: lastMsg,
        messageCount: ticket.messages?.[0]?.count || 0,
      };
    })
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-8">
      <DashboardHeader />

      <main className="container mx-auto max-w-7xl px-4 md:px-6 pt-24 space-y-8">
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            className="w-fit pl-0 hover:bg-transparent hover:text-primary transition-colors"
            asChild
          >
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla Dashboard
            </Link>
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-blue-500" />
                Le Mie Conversazioni
              </h1>
              <p className="text-muted-foreground">
                Gestisci tutte le tue chat e lascia recensioni sui servizi ricevuti.
              </p>
            </div>

            <Button asChild className="w-fit">
              <Link href="/chat">
                <MessageSquare className="w-4 h-4 mr-2" />
                Nuova Richiesta
              </Link>
            </Button>
          </div>
        </div>

        <ConversationsList tickets={ticketsWithLastMessage} />
      </main>

      <MobileNav />
    </div>
  );
}
