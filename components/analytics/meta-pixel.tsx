'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useConsentCheck } from '@/components/providers/cookie-consent-provider';

export function MetaPixel() {
  const pixelId = '930612862873643'; // Meta Pixel ID
  const [shouldLoad, setShouldLoad] = useState(false);
  const marketingAllowed = useConsentCheck('marketing');

  // Delay Meta Pixel loading by 5 seconds after page load to avoid blocking TBT
  // This improves Core Web Vitals while still tracking conversions
  useEffect(() => {
    // Only set timer if in production and marketing is allowed
    if (process.env.NODE_ENV !== 'development' && marketingAllowed) {
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [marketingAllowed]);

  // Don't load in development
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  // Only load if marketing cookies are allowed
  if (!marketingAllowed) {
    return null;
  }

  if (!shouldLoad) return null;

  return (
    <>
      <Script
        id="meta-pixel-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
