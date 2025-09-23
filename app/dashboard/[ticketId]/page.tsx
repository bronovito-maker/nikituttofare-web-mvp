// File: app/dashboard/[ticketId]/page.tsx

import TicketDetailClient from './TicketDetailClient';

export default async function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;

  return <TicketDetailClient ticketId={ticketId} />;
}