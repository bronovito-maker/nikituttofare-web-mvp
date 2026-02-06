'use client';

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

/**
 * Lazy-loaded Vercel Analytics and SpeedInsights
 * Delays loading by 3 seconds to avoid impacting TBT
 */
export function VercelAnalyticsLazy() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Delay loading to avoid blocking TBT during initial page load
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!shouldLoad) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
