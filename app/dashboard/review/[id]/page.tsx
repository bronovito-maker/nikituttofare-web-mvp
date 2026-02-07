import { createServerClient } from '@/lib/supabase-server';
import { ReviewForm } from '@/components/dashboard/review-form';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Unwrap params (Next.js 15+)
  const { id } = await params;

  // Fetch ticket
  // Note: Type cast needed until Supabase types are regenerated
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as any;

  // Redirect if ticket not found or not owned by user
  if (error || !ticket) {
    redirect('/dashboard/conversations');
  }

  // Redirect if already reviewed
  if (ticket.rating) {
    redirect(`/chat?ticket_id=${ticket.id}&readonly=true`);
  }

  // Redirect if not completed yet
  if (!['resolved', 'closed'].includes(ticket.status)) {
    redirect(`/chat?ticket_id=${ticket.id}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto max-w-2xl px-4 pt-24 pb-12">
        <Button variant="ghost" className="mb-6 pl-0" asChild>
          <Link href="/dashboard/conversations">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alle Conversazioni
          </Link>
        </Button>

        <ReviewForm ticket={ticket} />
      </main>
    </div>
  );
}
