'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useConsentCheck } from '@/components/providers/cookie-consent-provider';

const GA_MEASUREMENT_ID = 'G-5HD3K53RNP';

export function GoogleAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const analyticsAllowed = useConsentCheck('analytics');

  // Delay GA loading by 3 seconds to avoid blocking TBT / Core Web Vitals
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' && analyticsAllowed) {
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [analyticsAllowed]);

  // Never load in development
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  // Wait for analytics consent
  if (!analyticsAllowed) {
    return null;
  }

  if (!shouldLoad) return null;

  return (
    <>
      <Script
        id="google-analytics-loader"
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              anonymize_ip: true
            });
          `,
        }}
      />
    </>
  );
}
