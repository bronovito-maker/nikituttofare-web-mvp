'use client';

import useSWR from 'swr';
import DashboardOverview, {
  type DashboardStatsResponse,
} from '@/components/dashboard/DashboardOverview';

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Errore nel recupero dei dati dashboard');
  }
  return res.json();
};

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR<DashboardStatsResponse>(
    '/api/dashboard/stats',
    fetcher,
    {
      refreshInterval: 15000,
      revalidateOnFocus: true,
    }
  );

  return (
    <DashboardOverview
      data={data}
      isLoading={isLoading}
      error={error}
    />
  );
}
