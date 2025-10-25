import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getTenantBookings,
  getTenantCustomers,
} from '@/lib/noco-helpers';
import type { Booking, Customer } from '@/lib/types';

const parseNumberParam = (
  value: string | null,
  fallback: number
) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const uniqueNumbers = (values: Array<number | null | undefined>) => {
  return Array.from(
    new Set(
      values
        .map((value) =>
          value !== null && value !== undefined ? Number(value) : NaN
        )
        .filter((value) => Number.isFinite(value))
    )
  ) as number[];
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

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const tenantId = Number(session.user.tenantId);
  const { searchParams } = new URL(request.url);

  const limit = parseNumberParam(searchParams.get('limit'), 50);
  const offset = parseNumberParam(searchParams.get('offset'), 0);
  const status = searchParams.get('status') ?? undefined;
  const range = searchParams.get('range') ?? undefined;
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  let from: Date | string | undefined = fromParam ?? undefined;
  let to: Date | string | undefined = toParam ?? undefined;

  if (range === 'today') {
    const todayStart = startOfDay(new Date());
    from = todayStart;
    to = addDays(todayStart, 1);
  } else if (range === 'upcoming') {
    from = new Date();
    to = undefined;
  }

  try {
    const bookingsResult = await getTenantBookings(tenantId, {
      limit,
      offset,
      status,
      from,
      to,
    });

    const bookings = bookingsResult.list ?? [];
    const customerIds = uniqueNumbers(
      bookings.map((booking) => booking.customer_id)
    );

    let customersMap = new Map<number, Customer>();

    if (customerIds.length > 0) {
      const customersResult = await getTenantCustomers(tenantId, {
        ids: customerIds,
      });

      customersMap = new Map(
        (customersResult.list ?? []).map((customer) => [
          Number(customer.Id),
          customer,
        ])
      );
    }

    const list = bookings.map((booking) => ({
      ...booking,
      customer: customersMap.get(Number(booking.customer_id)) ?? null,
    }));

    return NextResponse.json({
      list,
      pageInfo: bookingsResult.pageInfo,
    });
  } catch (error) {
    console.error('[API /api/dashboard/bookings] Errore:', error);
    const message =
      error instanceof Error ? error.message : 'Errore sconosciuto';
    return NextResponse.json(
      { error: `Impossibile recuperare le prenotazioni: ${message}` },
      { status: 500 }
    );
  }
}
