'use client';

import { useEffect, useState } from 'react';
import Script from "next/script";

export function MicrosoftClarity() {
    const clarityId = process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID;
    const [shouldLoad, setShouldLoad] = useState(false);

    // Don't load in development or if ID is missing
    if (!clarityId || process.env.NODE_ENV === 'development') {
        return null;
    }

    // Delay Clarity loading by 5 seconds after page load to avoid blocking TBT
    useEffect(() => {
        const timer = setTimeout(() => {
            setShouldLoad(true);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    if (!shouldLoad) return null;

    return (
        <Script
            id="microsoft-clarity-init"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
                __html: `
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarityId}");
        `,
            }}
        />
    );
}
