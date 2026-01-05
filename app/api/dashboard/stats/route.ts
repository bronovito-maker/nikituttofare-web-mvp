import { NextResponse } from 'next/server';
import { auth } from '@/auth';
// import {
//   getTenantBookingsCount,
//   getTenantCustomersCount,
//   getMonthlyBookingsCount,
//   getPendingBookingsCount,
//   getRecentBookingsCount,
//   listViewRowsById,
// } from '@/lib/noco-helpers';
// import {
//   NC_TABLE_CONVERSATIONS_ID,
//   NC_VIEW_CONVERSATIONS_ID,
// } from '@/lib/noco-ids';
import type { Conversation } from '@/lib/types';

export async function GET() {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    // TODO: Replace this with Supabase logic
    const mockStats = {
      totalCustomers: 123,
      totalBookings: 456,
      bookingsToday: 5,
      bookingsThisMonth: 42,
      pendingBookings: 3,
      recentConversations: [],
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(mockStats);
  } catch (error) {
    console.error('[API /api/dashboard/stats] Errore:', error);
    const message =
      error instanceof Error ? error.message : 'Errore sconosciuto';
    return NextResponse.json(
      { error: `Impossibile recuperare le statistiche: ${message}` },
      { status: 500 }
    );
  }
}
