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

  const mainTitle = userType === 'residential'
    ? "Ciao, sono Nikita. Il tuo tuttofare di fiducia a Rimini e dintorni."
    : "Impianti Sempre Operativi.";

  const subTitle = userType === 'residential'
    ? "Risolvo i tuoi guasti in casa in meno di 2 ore. Trasparenza totale, pulizia e garanzia sui lavori."
    : "Il Tuo Business non si Ferma Mai.";

  const hookTitle = "Un guasto ti sta rovinando la giornata?";

  return (
    <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
      {/* Text Content */}
      <div className="text-center lg:text-left space-y-6 sm:space-y-8">
        {/* Profile + Hook */}
        <div className="flex flex-col lg:flex-row items-center lg:items-end gap-4 lg:gap-6 justify-center lg:justify-start">
          {userType === 'residential' && (
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-orange-500/20 shadow-xl shadow-orange-500/10 rotate-3 transition-transform group-hover:rotate-0">
                <img
                  src="/team-photo.png"
                  alt="Nikita Bronovs"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-background shadow-lg">
                <span className="block w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
              </div>
            </div>
          )}
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center justify-center lg:justify-start">
              <span className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest shadow-sm transition-colors ${userType === 'residential'
                ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/50 text-orange-700 dark:text-orange-400'
                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                {userType === 'residential' ? `✓ Pronto Intervento H24` : '✓ Partner Horeca & Corporate'}
              </span>
            </div>
            {userType === 'residential' && (
              <p className="text-orange-600 dark:text-orange-400 font-bold text-lg md:text-xl tracking-tight animate-pulse">
                {hookTitle}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <BlurText
            key={`${userType}-personal-title`}
            text={mainTitle}
            as="h1"
            className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-foreground leading-[1.1] pb-1 max-md:opacity-100 max-md:animate-none max-md:filter-none text-balance"
            delay={0.05}
          />
          <p className="text-lg sm:text-2xl font-medium text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0 text-balance">
            {subTitle}
          </p>
        </div>

        {/* CSS-only animation for performance (no JS hydration overhead) */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light md:opacity-0 md:animate-lcp-entry max-md:!opacity-100 text-balance" style={{ animationDelay: '0.4s' }}>
          {userType === 'residential' ? (
            <>
              <span className="font-semibold text-foreground">Non aspettare che peggiori.</span> Il miglior servizio di{' '}
              <strong>tuttofare {cityName ? 'nella tua zona' : 'a Rimini e dintorni'}</strong>, con intervento garantito <span className="font-bold text-blue-600 dark:text-blue-400">entro 2 ore</span>
              {cityName && <span className="text-blue-600 dark:text-blue-400 md:hidden font-medium"> a {cityName}</span>}.
            </>
          ) : (
            <>
              Mantieni la tua operatività al massimo con la mia assistenza tecnica H24. Soluzioni proattive e interventi rapidi per <strong>Hotel, Ristoranti e Stabilimenti</strong> della Riviera Romagnola, garantendo continuità e conformità.
            </>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4 md:opacity-0 md:animate-lcp-entry max-md:!opacity-100" style={{ animationDelay: '0.6s' }}>
          <div className="flex flex-col items-center lg:items-start gap-2">
            <Button asChild className={`h-16 px-10 text-xl rounded-full font-bold shadow-2xl transition-all hover:scale-105 active:scale-95 ${userType === 'residential'
              ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-orange-500/30'
              : 'bg-foreground text-background hover:bg-foreground/90'
              }`}>
              <Link href={userType === 'residential' ? "/chat" : "/contact"} className="flex items-center">
                {userType === 'residential' ? 'Chiedi al mio assistente personale' : 'Richiedi una Consulenza Gratuita'}
                <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
            </Button>
            {userType === 'residential' && (
              <p className="text-xs text-muted-foreground/80 font-medium tracking-wide flex items-center gap-1.5 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Disponibile ora a Rimini e dintorni
              </p>
            )}
          </div>

          {/* Secondary CTA - WhatsApp */}
          <a
            href="https://wa.me/393461027447?text=Ciao%20Niki%2C%20ho%20bisogno%20del%20tuo%20aiuto"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center h-16 px-10 text-xl font-bold rounded-full border-2 border-green-500/30 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/40 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-green-500/5"
          >
            Scrivimi su WhatsApp
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
              <p className="text-sm font-semibold leading-tight">Copertura completa e garantita su ogni intervento.</p>
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
                  <span className="text-slate-500">Verifica Semestrale</span>
                  <span className="font-medium">Programmabile</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Copertura</span>
                  <span className="font-medium">H24/7 (Premium)</span>
                </div>
                <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Efficienza Operativa</span>
                  <div className="flex items-end gap-1 h-12">
                    <div className="w-4 bg-blue-500/40 h-[60%] rounded-t-sm" />
                    <div className="w-4 bg-blue-500/60 h-[80%] rounded-t-sm" />
                    <div className="w-4 bg-blue-500/80 h-[100%] rounded-t-sm animate-pulse" />
                    <div className="w-4 bg-blue-500/40 h-[70%] rounded-t-sm" />
                    <div className="w-4 bg-blue-500/60 h-[90%] rounded-t-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
