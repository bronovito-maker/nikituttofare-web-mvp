import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getTenantBookingsCount,
  getTenantCustomersCount,
  getMonthlyBookingsCount,
  getPendingBookingsCount,
  getRecentBookingsCount,
  listViewRowsById,
} from '@/lib/noco-helpers';
import {
  NC_TABLE_CONVERSATIONS_ID,
  NC_VIEW_CONVERSATIONS_ID,
} from '@/lib/noco-ids';
import type { Conversation } from '@/lib/types';

export async function GET() {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const tenantId = Number(session.user.tenantId);
  try {
    const [
      totalCustomers,
      totalBookings,
      bookingsToday,
      bookingsMonth,
      pendingBookings,
      recentConversationsResult,
    ] = await Promise.all([
      getTenantCustomersCount(tenantId),
      getTenantBookingsCount(tenantId),
      getRecentBookingsCount(tenantId),
      getMonthlyBookingsCount(tenantId),
      getPendingBookingsCount(tenantId),
      listViewRowsById(
        NC_TABLE_CONVERSATIONS_ID,
        NC_VIEW_CONVERSATIONS_ID,
        {
          where: `(tenant_id,eq,${tenantId})`,
          limit: 5,
          sort: '-CreatedAt',
        }
      ),
    ]);

    const recentConversations = (recentConversationsResult.list ??
      []) as Conversation[];

    return NextResponse.json({
      totalCustomers,
      totalBookings,
      bookingsToday,
      bookingsThisMonth: bookingsMonth,
      pendingBookings,
      recentConversations,
      updatedAt: new Date().toISOString(),
    });
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
