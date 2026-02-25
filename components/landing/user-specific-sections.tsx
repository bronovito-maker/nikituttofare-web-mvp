'use client';

import dynamic from 'next/dynamic';

// Dynamic imports for below-the-fold components
const PriceComparison = dynamic(() => import('@/components/landing/price-comparison').then(mod => mod.PriceComparison));

export function UserSpecificSections() {
  // Simplified for Homepage: Show Residential content directly
  return (
    <section className="py-16 sm:py-24 bg-card/50 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Onestà Garantita: Metodo <span className="text-blue-600 dark:text-blue-400">GlassBox™</span></h2>
          <p className="text-lg text-muted-foreground">
            Basta preventivi &quot;a occhio&quot;. Il mio metodo ti garantisce prezzi onesti basati sui listini ufficiali, senza alcuna sorpresa sul conto finale.
          </p>
        </div>
        <PriceComparison />
      </div>
    </section>
  );
}
