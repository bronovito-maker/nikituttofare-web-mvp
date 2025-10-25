import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getTenantBookings,
  getTenantCustomers,
  listViewRowsById,
} from '@/lib/noco-helpers';
import {
  NC_TABLE_CONVERSATIONS_ID,
  NC_VIEW_CONVERSATIONS_ID,
} from '@/lib/noco-ids';
import type { Conversation } from '@/lib/types';

const toCount = (value: unknown) => {
  const numeric = Number(
    typeof value === 'object' && value !== null
      ? (value as { totalRows?: number }).totalRows
      : value
  );
  return Number.isFinite(numeric) ? numeric : 0;
};

const startOfDay = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export async function GET() {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const tenantId = Number(session.user.tenantId);
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  try {
    const [
      customersResult,
      totalBookingsResult,
      bookingsTodayResult,
      bookingsMonthResult,
      pendingBookingsResult,
      recentConversationsResult,
    ] = await Promise.all([
      getTenantCustomers(tenantId, { limit: 1 }),
      getTenantBookings(tenantId, { limit: 1 }),
      getTenantBookings(tenantId, {
        limit: 1,
        from: todayStart,
        to: tomorrowStart,
      }),
      getTenantBookings(tenantId, {
        limit: 1,
        from: monthStart,
        to: nextMonthStart,
      }),
      getTenantBookings(tenantId, {
        limit: 1,
        status: 'richiesta',
      }),
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
      totalCustomers: toCount(customersResult.pageInfo),
      totalBookings: toCount(totalBookingsResult.pageInfo),
      bookingsToday: toCount(bookingsTodayResult.pageInfo),
      bookingsThisMonth: toCount(bookingsMonthResult.pageInfo),
      pendingBookings: toCount(pendingBookingsResult.pageInfo),
      recentConversations,
      updatedAt: now.toISOString(),
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
