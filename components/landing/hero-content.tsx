'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { BlurText } from '@/components/react-bits/BlurText';
import { COMPANY_PHONE_LINK } from '@/lib/constants';
import { TechnicianPreview } from '@/components/landing/technician-preview';
import { useUserType } from './user-type-context';

interface HeroContentProps {
  cityName?: string;
  serviceName?: string;
}

export function HeroContent({ cityName, serviceName }: HeroContentProps) {
  const { userType } = useUserType();

  // Dynamic strings based on location/service
  const mainTitle = serviceName
    ? `${serviceName} a ${cityName || 'Rimini'}`
    : cityName
      ? `Niki Tuttofare a ${cityName}`
      : userType === 'residential'
        ? "Niki Tuttofare Pronto Intervento"
        : "Impianti Sempre Operativi.";

  const subTitle = userType === 'residential'
    ? "Un guasto ti sta rovinando la giornata?"
    : "Il Tuo Business non si Ferma Mai.";

  return (
    <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
      {/* Text Content */}
      <div className="text-center lg:text-left space-y-6 sm:space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center justify-center lg:justify-start">
          <span className={`px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider shadow-sm transition-colors ${userType === 'residential'
            ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
            {userType === 'residential' ? `✓ Pronto Intervento H24 ${cityName ? `a ${cityName}` : ''}` : '✓ Partner Horeca & Corporate'}
          </span>
        </div>

        <div className="space-y-4">
          <BlurText
            key={`${userType}-${cityName}-${serviceName}`} // Force re-render on toggle/context change
            text={mainTitle}
            as="h1"
            className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-foreground leading-[1.15] pb-1 max-md:opacity-100 max-md:animate-none max-md:filter-none"
            delay={0.05}
          />
          <BlurText
            key={`${userType}-sub`}
            text={subTitle}
            as="h2"
            className={`text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r leading-[1.15] pb-1 ${userType === 'residential'
              ? 'from-orange-600 via-red-500 to-orange-500'
              : 'from-slate-700 via-slate-600 to-slate-500 dark:from-slate-300 dark:via-slate-400 dark:to-slate-500'
              } max-md:opacity-100 max-md:animate-none max-md:filter-none`}
            delay={0.25}
          />
        </div>

        {/* CSS-only animation for performance (no JS hydration overhead) */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light md:opacity-0 md:animate-lcp-entry max-md:!opacity-100" style={{ animationDelay: '0.4s' }}>
          {userType === 'residential' ? (
            <>
              <span className="font-semibold text-foreground">Non aspettare che peggiori.</span> Il miglior servizio di <br />
              <strong>tuttofare {cityName ? 'nella tua zona' : 'a Rimini, Riccione e Misano Adriatico'}</strong>, con intervento garantito <span className="font-bold text-blue-600 dark:text-blue-400">entro 2 ore</span>
              {cityName && <span className="text-blue-600 dark:text-blue-400 md:hidden font-medium"> a {cityName}</span>}.
            </>
          ) : (
            <>
              Mantieni la tua operatività al massimo con la nostra assistenza tecnica H24. <br />
              Soluzioni proattive e interventi rapidi per <strong>Hotel, Ristoranti e Stabilimenti</strong> della Riviera Romagnola, <br />
              garantendo continuità e conformità.
            </>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4 md:opacity-0 md:animate-lcp-entry max-md:!opacity-100" style={{ animationDelay: '0.6s' }}>
          <div className="flex flex-col items-center lg:items-start gap-2">
            <Button asChild className={`h-14 px-8 text-lg rounded-full font-bold shadow-xl transition-all hover:scale-105 ${userType === 'residential'
              ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-orange-500/20'
              : 'bg-foreground text-background hover:bg-foreground/90'
              }`}>
              <Link href={userType === 'residential' ? "/chat" : "/contact"} className="flex items-center">
                {userType === 'residential' ? 'Preventivo IMMEDIATO' : 'Richiedi una Consulenza Gratuita'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            {userType === 'residential' && (
              <p className="text-[10px] sm:text-xs text-muted-foreground/60 font-medium tracking-wide flex items-center gap-1.5 ml-1">
                <span className="w-1 h-1 rounded-full bg-orange-500/40" />
                Senza impegno
              </p>
            )}
          </div>

          {/* Secondary CTA for Desktop */}
          <a href={COMPANY_PHONE_LINK} className="hidden sm:inline-flex items-center justify-center h-14 px-8 text-lg font-semibold rounded-full border border-border bg-card/50 hover:bg-muted transition-all">
            {userType === 'residential' ? "Chiama Tecnico" : "Contattaci Subito"}
          </a>
        </div>
      </div>

      {/* Visual Content - Right Column */}
      <div className="hidden lg:block relative">
        {userType === 'residential' ? (
          <div className="relative">
            <TechnicianPreview />
            {/* Floating Trust Badge */}
            <div className="absolute top-20 -left-10 bg-card/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-border border-l-4 border-l-green-500 max-w-[200px]">
              <p className="text-xs font-bold text-muted-foreground uppercase opacity-70 mb-1">Garanzia</p>
              <p className="text-sm font-semibold leading-tight">Copertura completa e assicurata su ogni intervento.</p>
            </div>
          </div>
        ) : (
          <div className="relative p-6 bg-slate-100 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl rotate-2">
            {/* Mock Asset Dashboard */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="text-sm font-bold text-slate-500">ASSET REPORT AZIENDALE</p>
                  <p className="text-xl font-bold">Monitoraggio Impianti: OK</p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded text-green-700 dark:text-green-300 font-mono text-sm font-bold">
                  COMPLIANCE ✅
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Prossima Manutenzione</span>
                  <span className="font-medium">15 Apr 2024</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Copertura</span>
                  <span className="font-medium">H24/7 (Premium)</span>
                </div>
                <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                  [Grafico Storico Interventi & Efficienza]
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
