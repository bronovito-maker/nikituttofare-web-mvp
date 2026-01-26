'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ShieldCheck, Clock, Star, ArrowRight, FileCheck, FileSpreadsheet, QrCode } from 'lucide-react';
import { RetroGrid } from '@/components/react-bits/RetroGrid';
import { BlurText } from '@/components/react-bits/BlurText';
import { ClientAnimationWrapper } from '@/components/ui/client-animation-wrapper';
import { COMPANY_PHONE, COMPANY_PHONE_LINK } from '@/lib/constants';

// New Components
import { UserTypeToggle } from '@/components/landing/user-type-toggle';
import { StickyActionNav } from '@/components/landing/sticky-action-nav';
import { TechnicianPreview } from '@/components/landing/technician-preview';
import { PriceComparison } from '@/components/landing/price-comparison';

type UserType = 'residential' | 'business';

export default function Home() {
  const [userType, setUserType] = useState<UserType>('residential');

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-blue-100 dark:selection:bg-blue-900 pb-20 sm:pb-0">

      {/* --- NAVBAR STICKY GLASSMORPHISM --- */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="relative h-9 sm:h-11 w-9 sm:w-11 overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow flex-shrink-0">
              <Image src="/logo_ntf.png" alt="NTF Logo" fill className="object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base lg:text-lg font-black tracking-tight text-foreground leading-none">
                <span className="sm:hidden">NTF</span>
                <span className="hidden sm:inline">Niki<span className="text-blue-600 dark:text-blue-400">Tuttofare</span></span>
              </span>
              <span className="hidden sm:block text-xs text-muted-foreground font-medium">Pronto Intervento H24</span>
            </div>
          </div>

          {/* Center Toggle - Desktop */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <UserTypeToggle value={userType} onChange={setUserType} />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="md:hidden">
              {/* Mobile reduced toggle or just integrated in menu - for now keep it simple or hide specific controls */}
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="hidden xl:inline">Tecnici attivi su <strong>Rimini e Provincia</strong></span>
            </div>
            <ThemeToggle />
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm rounded-full px-5 shadow-lg transition-all hover:scale-105">
              <Link href="/login">Area Riservata</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Toggle Row */}
        <div className="md:hidden border-t border-border bg-card/50 p-2 flex justify-center">
          <UserTypeToggle value={userType} onChange={setUserType} />
        </div>
      </header>

      <main className="flex-1">

        {/* --- HERO SECTION --- */}
        <section className="relative py-12 sm:py-20 lg:py-32 px-4 sm:px-6 overflow-hidden">
          <RetroGrid className="absolute inset-0 z-0 opacity-20" />

          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

              {/* Text Content */}
              <div className="text-center lg:text-left space-y-6 sm:space-y-8">
                {/* Badge */}
                <div className="inline-flex items-center justify-center lg:justify-start">
                  <span className={`px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider shadow-sm transition-colors ${userType === 'residential'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                    {userType === 'residential' ? '✓ Pronto Intervento H24' : '✓ Partner Horeca & Corporate'}
                  </span>
                </div>

                <div className="space-y-4">
                  <BlurText
                    key={userType} // Force re-render on toggle
                    text={userType === 'residential' ? "Guasti in casa?" : "Manutenzione Hotel."}
                    className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-foreground leading-[1.05]"
                    delay={0.05}
                  />
                  <BlurText
                    key={`${userType}-sub`}
                    text={userType === 'residential' ? "Arriviamo subito." : "Stagione Salva."}
                    className={`text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r leading-[1.05] ${userType === 'residential'
                      ? 'from-blue-600 via-blue-500 to-cyan-500'
                      : 'from-slate-700 via-slate-600 to-slate-500 dark:from-slate-300 dark:via-slate-400 dark:to-slate-500'
                      }`}
                    delay={0.25}
                  />
                </div>

                <ClientAnimationWrapper delay={0.4} duration={0.8}>
                  <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                    {userType === 'residential' ? (
                      <>
                        Basta preventivi a voce e attese infinite. <br />
                        L&apos;<span className="font-semibold text-foreground">Intelligenza Artificiale</span> calcola il prezzo giusto su Rimini, Riccione e dintorni. Tu chiami, noi risolviamo.
                      </>
                    ) : (
                      <>
                        Dalla Notte Rosa al Capodanno, i tuoi impianti non si fermano mai. <br />
                        Assistenza H24 per <strong>Hotel, Ristoranti e Stabilimenti</strong> della Riviera Romagnola.
                      </>
                    )}
                  </p>
                </ClientAnimationWrapper>

                <ClientAnimationWrapper delay={0.6} duration={0.8}>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                    <Button asChild className={`h-14 px-8 text-lg rounded-full font-bold shadow-xl transition-all hover:scale-105 ${userType === 'residential'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-orange-500/20'
                      : 'bg-foreground text-background hover:bg-foreground/90'
                      }`}>
                      <Link href="/chat" className="flex items-center">
                        {userType === 'residential' ? 'Chiedi a Niki AI' : 'Richiedi Demo Aziende'}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>

                    {/* Secondary CTA for Desktop */}
                    <a href={COMPANY_PHONE_LINK} className="hidden sm:inline-flex items-center justify-center h-14 px-8 text-lg font-semibold rounded-full border border-border bg-card/50 hover:bg-muted transition-all">
                      Chiama Tecnico
                    </a>
                  </div>
                </ClientAnimationWrapper>
              </div>

              {/* Visual Content - Right Column */}
              <div className="hidden lg:block relative">
                {userType === 'residential' ? (
                  <div className="relative">
                    <TechnicianPreview />
                    {/* Floating Trust Badge */}
                    <div className="absolute top-20 -left-10 bg-card/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-border border-l-4 border-l-green-500 max-w-[200px]">
                      <p className="text-xs font-bold text-muted-foreground uppercase opacity-70 mb-1">Garanzia</p>
                      <p className="text-sm font-semibold leading-tight">Copertura danni fino a 1.000.000€ su ogni intervento.</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative p-6 bg-slate-100 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl rotate-2">
                    {/* Mock Asset Dashboard */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-4">
                        <div>
                          <p className="text-sm font-bold text-slate-500">ASSET REPORT</p>
                          <p className="text-xl font-bold">Cella Frigorifera #3</p>
                        </div>
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded text-green-700 dark:text-green-300 font-mono text-sm font-bold">
                          HACCP OK
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Ultimo Intervento</span>
                          <span className="font-medium">24 Gen 2026</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Tecnico</span>
                          <span className="font-medium">Luca M. (Certified)</span>
                        </div>
                        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                          [Grafico Manutenzione]
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* --- COMPARISON SECTION (Glass Box) --- */}
        {userType === 'residential' && (
          <section className="py-16 sm:py-24 bg-card/50 border-y border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Motore di Prezzo <span className="text-blue-600 dark:text-blue-400">GlassBox™</span></h2>
                <p className="text-lg text-muted-foreground">
                  Basta preventivi scritti a mano. Il nostro AI utilizza i prezziari ufficiali della Regione Emilia-Romagna.
                </p>
              </div>
              <PriceComparison />
            </div>
          </section>
        )}

        {/* --- B2B FEATURES --- */}
        {userType === 'business' && (
          <section className="py-16 sm:py-24 bg-card/50 border-y border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-background p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Compliance HACCP</h3>
                  <p className="text-muted-foreground">Report automatici validi per controlli ASL generati dopo ogni intervento su impianti frigo e idraulici.</p>
                </div>
                <div className="bg-background p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Asset QR Code</h3>
                  <p className="text-muted-foreground">Applichiamo un QR su ogni macchinario. Scansiona per vedere lo storico riparazioni e manuali.</p>
                </div>
                <div className="bg-background p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Fatturazione Semplificata</h3>
                  <p className="text-muted-foreground">Unico fornitore, un&apos;unica fattura a fine mese con dettaglio centri di costo per ogni struttura.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* --- COMMON FEATURES --- */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
                Siamo di qui, mica un call center.
              </h2>
              <p className="text-lg text-muted-foreground font-light px-2">
                Conosciamo ogni via di Rimini e Riccione. Tecnologia per eliminare l&apos;ansia, artigiani per risolvere il problema.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
              <PremiumFeatureCard
                icon={<Clock className="w-6 h-6 text-white" />}
                iconBg="from-blue-600 to-blue-500"
                number="01"
                title="Da te in un attimo"
                desc="I nostri tecnici sono già in zona. Non arriviamo da Bologna, siamo già qui."
                features={["Rimini, Riccione, Santarcangelo", "Tracking GPS in tempo reale", "Priorità Emergenza"]}
              />
              <PremiumFeatureCard
                icon={<Star className="w-6 h-6 text-white" />}
                iconBg="from-purple-600 to-purple-500"
                number="02"
                title="Prezzi Chiari"
                desc="Niente 'faccio un prezzo a occhio'. Usiamo i listini ufficiali Emilia-Romagna. Quello che vedi è quello che paghi."
                features={["Stima Costi Immediata", "Listini Regionali", "Pagamento In-App"]}
              />
              <PremiumFeatureCard
                icon={<ShieldCheck className="w-6 h-6 text-white" />}
                iconBg="from-green-600 to-green-500"
                number="03"
                title="Lavori Fatti Bene"
                desc="Siamo romagnoli: le cose o si fanno bene o non si fanno. E se sbagliamo, paghiamo noi."
                features={["Assicurazione 1M€", "Rifacimento Gratuito", "Supporto h24"]}
              />
            </div>
          </div>
        </section>

      </main>

      {/* --- MOBILE THUMB ZONE NAV --- */}
      <StickyActionNav />

      {/* FOOTER PREMIUM */}
      <footer className="py-12 lg:py-16 bg-card border-t border-border text-center mb-20 sm:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em]">Supporto Totale</p>
            <a
              href={COMPANY_PHONE_LINK}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold text-xl transition-colors"
            >
              📞 +39 {COMPANY_PHONE}
            </a>
          </div>
          <div className="pt-8 border-t border-border text-muted-foreground text-sm space-y-2">
            <p>© 2026 NikiTuttofare • Powered by Gemini AI</p>
            <p className="text-xs">
              Attivi su: Rimini • Riccione • Cattolica • Misano • Bellaria • Santarcangelo • San Marino
            </p>
            <p className="text-xs opacity-50">P.IVA 1234567890</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Componente Card Premium "Apple Level"
function PremiumFeatureCard({
  icon,
  iconBg,
  number,
  title,
  desc,
  features
}: {
  readonly icon: React.ReactNode;
  readonly iconBg: string;
  readonly number: string;
  readonly title: string;
  readonly desc: string;
  readonly features: string[];
}) {
  return (
    <div className="group relative p-8 bg-card rounded-2xl border border-border transition-all duration-500 hover:shadow-2xl hover:shadow-slate-300/20 dark:hover:shadow-slate-900/30 hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-2">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

      <div className="mb-6 inline-flex">
        <span className="text-5xl font-black text-muted/50 group-hover:text-muted transition-colors">
          {number}
        </span>
      </div>

      <div className={`mb-8 inline-flex p-5 rounded-2xl bg-gradient-to-br ${iconBg} shadow-lg group-hover:shadow-xl transition-all duration-500`}>
        {icon}
      </div>

      <h3 className="text-2xl font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors leading-tight">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed mb-6 group-hover:text-foreground transition-colors">
        {desc}
      </p>

      <div className="space-y-2 pt-6 border-t border-border group-hover:border-accent transition-colors">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground group-hover:bg-accent transition-colors flex-shrink-0" />
            {feature}
          </div>
        ))}
      </div>
    </div>
  );
}
