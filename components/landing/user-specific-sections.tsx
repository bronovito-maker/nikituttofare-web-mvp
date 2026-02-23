'use client';

import dynamic from 'next/dynamic';
import { FileCheck, FileSpreadsheet, QrCode, CalendarClock } from 'lucide-react';
import { useUserType } from './user-type-context';

// Dynamic imports for below-the-fold components
const PriceComparison = dynamic(() => import('@/components/landing/price-comparison').then(mod => mod.PriceComparison));

export function UserSpecificSections() {
  const { userType } = useUserType();

  return (
    <>
      {/* --- COMPARISON SECTION (Glass Box) - Residential Only --- */}
      {userType === 'residential' && (
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
      )}

      {/* --- B2B FEATURES - Business Only --- */}
      {userType === 'business' && (
        <section className="py-16 sm:py-24 bg-card/50 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="bg-background p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Compliance HACCP Garantita</h3>
                <p className="text-muted-foreground">Report automatici validi per controlli ASL generati dopo ogni intervento su impianti frigo e idraulici.</p>
              </div>
              <div className="bg-background p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Gestione Asset Intelligente con QR</h3>
                <p className="text-muted-foreground">Applichiamo un QR su ogni macchinario. Scansiona per vedere lo storico riparazioni, schede tecniche e manuali.</p>
              </div>
              <div className="bg-background p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Amministrazione Senza Stress</h3>
                <p className="text-muted-foreground">Unico fornitore, un&apos;unica fattura a fine mese con dettaglio centri di costo per ogni struttura.</p>
              </div>

              {/* NEW B2B Feature */}
              <div className="bg-background p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6">
                  <CalendarClock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Manutenzione Proattiva Programma</h3>
                <p className="text-muted-foreground">Piani di intervento programmati per prevenire guasti, ottimizzare i costi e garantire la continuità del servizio.</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
