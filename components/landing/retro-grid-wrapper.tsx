'use client';

import dynamic from 'next/dynamic';

const RetroGrid = dynamic(() => import('@/components/react-bits/RetroGrid').then(mod => mod.RetroGrid), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-950/5" />
});

export function RetroGridWrapper({ className }: { className?: string }) {
  return <RetroGrid className={className} />;
}
