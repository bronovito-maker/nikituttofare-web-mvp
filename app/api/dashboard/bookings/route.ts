import { NextResponse } from 'next/server';
import { auth } from '@/auth';
// import {
//   getTenantBookings,
//   getTenantCustomers,
// } from '@/lib/noco-helpers';
import type { Booking, Customer } from '@/lib/types';

const parseNumberParam = (value: string | null, fallback: number) => {
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

  try {
    // TODO: Replace this with Supabase logic
    const mockBookings: Booking[] = [
      {
        Id: 1,
        tenant_id: Number(session.user.tenantId),
        customer_id: 1,
        booking_datetime: new Date().toISOString(),
        party_size: 2,
        status: 'confermata',
        notes: 'Tavolo vicino alla finestra',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        Id: 2,
        tenant_id: Number(session.user.tenantId),
        customer_id: 2,
        booking_datetime: new Date().toISOString(),
        party_size: 4,
        status: 'richiesta',
        notes: 'Seggiolone per bambino',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const mockCustomers: Customer[] = [
        { Id: 1, tenant_id: Number(session.user.tenantId), full_name: 'Mario Rossi (Mock)', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { Id: 2, tenant_id: Number(session.user.tenantId), full_name: 'Luigi Verdi (Mock)', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ]

    const customersMap = new Map(
        mockCustomers.map((customer) => [
          Number(customer.Id),
          customer,
        ])
      );

    const list = mockBookings.map((booking) => ({
      ...booking,
      customer: customersMap.get(Number(booking.customer_id)) ?? null,
    }));

    return NextResponse.json({
      list,
      pageInfo: {
        totalRows: mockBookings.length,
        page: 1,
        isFirstPage: true,
        isLastPage: true,
      },
    });
  } catch (error) {
    console.error('[API /api/dashboard/bookings] Errore:', error);
    const message = error instanceof Error ? error.message : 'Errore sconosciuto';
    return NextResponse.json(
      { error: `Impossibile recuperare le prenotazioni: ${message}` },
      { status: 500 }
    );
  }
}
