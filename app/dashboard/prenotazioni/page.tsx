'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import BookingsDashboard, {
  type DashboardBookingsResponse,
} from '@/components/dashboard/BookingsDashboard';
import type { Booking } from '@/lib/types';

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Errore nel recupero delle prenotazioni');
  }
  return res.json();
};

type RangeFilter = 'all' | 'today' | 'upcoming';
type StatusFilter = 'all' | Booking['status'];

export default function PrenotazioniPage() {
  const [range, setRange] = useState<RangeFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({ limit: '50' });
    if (range === 'today') {
      params.set('range', 'today');
    } else if (range === 'upcoming') {
      params.set('range', 'upcoming');
    }
    if (status !== 'all') {
      params.set('status', status);
    }
    return `/api/dashboard/bookings?${params.toString()}`;
  }, [range, status]);

  const {
    data,
    error,
    isLoading,
    isValidating,
  } = useSWR<DashboardBookingsResponse>(endpoint, fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
  });

  return (
    <BookingsDashboard
      bookings={data?.list ?? []}
      totalRows={data?.pageInfo?.totalRows}
      isLoading={isLoading && !data}
      isRefreshing={isValidating}
      error={error}
      range={range}
      status={status}
      onRangeChange={setRange}
      onStatusChange={setStatus}
    />
  );
}
