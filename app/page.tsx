'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Clock, Star, ArrowRight } from 'lucide-react';
import { RetroGrid } from '@/components/react-bits/RetroGrid';
import { BlurText } from '@/components/react-bits/BlurText';
import { ClientAnimationWrapper } from '@/components/ui/client-animation-wrapper';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 text-slate-900 font-sans selection:bg-blue-100">
      
      {/* --- NAVBAR STICKY GLASSMORPHISM --- */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/30 bg-white/75 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="relative h-9 sm:h-11 w-9 sm:w-11 overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow flex-shrink-0">
              <Image src="/logo_ntf.png" alt="NTF Logo" fill className="object-cover" /> 
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none">
                Niki<span className="text-blue-600">Tuttofare</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">Pronto Intervento H24</span>
            </div>
          </div>

          {/* Right Actions - Mobile optimized */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
            <div className="hidden lg:flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-emerald-200/50 hover:bg-emerald-100 transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="hidden xl:inline">Tecnici disponibili ora</span>
            </div>
            <Button size="sm" className="hidden sm:flex font-semibold text-xs sm:text-sm text-slate-700 hover:text-slate-900 bg-transparent hover:bg-slate-100">
              Come Funziona
            </Button>
            <Button asChild size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm rounded-full px-4 sm:px-6 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all hover:scale-105">
              <Link href="/login">Area Riservata</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        
        {/* --- HERO SECTION --- */}
        <section className="relative py-16 sm:py-24 lg:py-40 px-4 sm:px-6 overflow-hidden">
          <RetroGrid className="absolute inset-0 z-0 opacity-20" />
          
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 lg:space-y-10">
            
            {/* Badge Premium */}
            <div className="inline-flex items-center justify-center">
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-[0.1em] sm:tracking-[0.12em] shadow-sm hover:shadow-md transition-shadow">
                ✓ H24 • Rimini & Riccione
              </span>
            </div>
            
            {/* Main Title con BlurText - Mobile optimized */}
            <div className="space-y-3 sm:space-y-6">
              <BlurText 
                text="Manutenzione d'Emergenza" 
                className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9] px-2"
                delay={0.05}
              />
              <BlurText 
                text="Semplice e Sicura." 
                className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 leading-[0.9] px-2"
                delay={0.25}
              />
            </div>
            
            <ClientAnimationWrapper delay={0.4} duration={0.8}>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal tracking-tight px-2">
                La piattaforma premium per <span className="font-semibold text-slate-900">Hotel e Privati</span>.<br className="hidden sm:block" />
                <span className="text-slate-500">Preventivi garantiti dall'AI, intervento in 60 minuti.</span>
              </p>
            </ClientAnimationWrapper>

            {/* CTA Group - Mobile Optimized */}
            <ClientAnimationWrapper delay={0.6} duration={0.8}>
              <div className="pt-6 sm:pt-8 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-center">
                <Button asChild className="h-12 sm:h-14 lg:h-16 px-6 sm:px-8 lg:px-10 text-base sm:text-lg rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold shadow-lg sm:shadow-xl shadow-orange-200/50 transition-all duration-300 hover:scale-105 sm:hover:scale-110 hover:-translate-y-1 group border border-orange-400/20 w-full sm:w-auto">
                  <Link href="/chat" className="flex items-center justify-center">
                    Richiedi Intervento 
                    <ArrowRight className="ml-2 sm:ml-3 h-4 sm:h-5 w-4 sm:w-5 transition-transform duration-300 group-hover:translate-x-1 sm:group-hover:translate-x-2" />
                  </Link>
                </Button>
                <div className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-7 py-3 sm:py-4 bg-white/80 backdrop-blur-sm rounded-full shadow-md sm:shadow-lg border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:shadow-xl transition-all">
                  <ShieldCheck className="w-4 sm:w-5 h-4 sm:h-5 text-green-600 flex-shrink-0" />
                  <span>Nessun costo anticipato</span>
                </div>
              </div>
            </ClientAnimationWrapper>

          </div>
        </section>

        {/* --- SOCIAL PROOF (Scrollable) --- */}
        <section className="py-12 sm:py-16 border-y border-slate-200/30 bg-gradient-to-b from-white via-slate-50/50 to-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-6 sm:space-y-8">
            <div className="space-y-1.5 sm:space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.1em] sm:tracking-[0.15em]">Trusted by</p>
              <h3 className="text-sm sm:text-base font-semibold text-slate-600 px-2 leading-relaxed">I migliori Hotel e B&B della Riviera Romagnola scelgono NikiTuttofare</h3>
            </div>

            {/* Scrollable Container */}
            <div className="flex overflow-x-auto scrollbar-hide gap-4 sm:gap-6 pb-4 sm:pb-0 px-4 sm:px-0 sm:justify-center sm:flex-wrap">
              {/* Hotel Cards - Scrollable on mobile, static on larger screens */}
              {[
                { emoji: '🏨', name: 'SAVOIA HOTEL', category: 'Luxury' },
                { emoji: '🏨', name: 'BALTIC SUITES', category: 'Design' },
                { emoji: '🏖️', name: 'RIVIERA RESIDENCE', category: 'Beachfront' },
                { emoji: '⭐', name: 'GRAND HOTEL', category: 'Premium' },
              ].map((hotel, idx) => (
                <div 
                  key={idx} 
                  className="flex-shrink-0 sm:flex-shrink group px-5 sm:px-6 py-3 sm:py-4 bg-white rounded-xl border border-slate-200/40 hover:border-slate-300 hover:shadow-md transition-all duration-300 hover:bg-gradient-to-br hover:from-slate-50 hover:to-white cursor-pointer grayscale hover:grayscale-0 opacity-70 hover:opacity-100"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-xl">{hotel.emoji}</span>
                    <div className="text-left">
                      <p className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors whitespace-nowrap">
                        {hotel.name}
                      </p>
                      <p className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors">
                        {hotel.category}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- FEATURES SECTION (Premium Grid) --- */}
        <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-gradient-to-b from-white to-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 lg:mb-20 space-y-4 sm:space-y-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900">
                Perché noi non come gli altri.
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-600 font-light leading-relaxed px-2">
                Abbiamo eliminato la complessità. Zero sorprese, zero chiamate inutili. Solo velocità e trasparenza.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
              <PremiumFeatureCard 
                icon={<Clock className="w-6 sm:w-7 h-6 sm:h-7 text-white" />}
                iconBg="from-blue-600 to-blue-500"
                number="01"
                title="60 Minuti Garantiti"
                desc="La nostra rete locale è ottimizzata per velocità. Quando clicchi, partiamo. Punto."
                features={["Tecnici locali", "GPS Real-time", "Tracking App"]}
              />
              <PremiumFeatureCard 
                icon={<Star className="w-6 sm:w-7 h-6 sm:h-7 text-white" />}
                iconBg="from-purple-600 to-purple-500"
                number="02"
                title="Prezzi Certificati AI"
                desc="Carica una foto. La nostra IA analizza e ti dà un range garantito. Basta truffe."
                features={["Foto Analysis", "Range Prezzo", "Garanzia Scritta"]}
              />
              <PremiumFeatureCard 
                icon={<ShieldCheck className="w-6 sm:w-7 h-6 sm:h-7 text-white" />}
                iconBg="from-green-600 to-green-500"
                number="03"
                title="Garanzia Totale"
                desc="Ogni lavoro è assicurato. Se qualcosa è storto, rimborsiamo e rifacciamo."
                features={["Assicurazione", "Reso Garantito", "Support 24/7"]}
              />
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER PREMIUM */}
      <footer className="py-10 sm:py-12 lg:py-16 bg-gradient-to-b from-slate-50 to-white border-t border-slate-200/30 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
          <div className="space-y-1.5 sm:space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.1em]">Supporto Totale</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-900 px-2">
              Chat 24/7 • Email • Telefono 
            </p>
          </div>
          <div className="pt-6 sm:pt-8 border-t border-slate-200/50 text-slate-500 text-xs sm:text-sm space-y-1 sm:space-y-2">
            <p>© 2024 NikiTuttofare • Pronto Intervento Professionale</p>
            <p className="text-xs">Rimini & Riccione • Idraulici • Elettricisti • Fabbri</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Componente Card Premium "Apple Level" - Mobile Optimized
function PremiumFeatureCard({ 
  icon, 
  iconBg, 
  number,
  title, 
  desc,
  features
}: { 
  icon: any, 
  iconBg: string, 
  number: string,
  title: string, 
  desc: string,
  features: string[]
}) {
  return (
    <div className="group relative p-6 sm:p-8 lg:p-10 bg-white rounded-2xl border border-slate-200/50 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-300/20 hover:border-slate-300 hover:-translate-y-2">
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
      
      {/* Number Badge */}
      <div className="mb-4 sm:mb-6 inline-flex">
        <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-200 group-hover:text-slate-300 transition-colors">
          {number}
        </span>
      </div>

      {/* Icon */}
      <div className={`mb-6 sm:mb-8 inline-flex p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${iconBg} shadow-lg shadow-slate-200 group-hover:shadow-xl group-hover:shadow-slate-300/30 transition-all duration-500`}>
        {icon}
      </div>

      {/* Content */}
      <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-3 group-hover:text-slate-950 transition-colors leading-tight">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-4 sm:mb-6 group-hover:text-slate-700 transition-colors">
        {desc}
      </p>

      {/* Feature List */}
      <div className="space-y-1.5 sm:space-y-2 pt-4 sm:pt-6 border-t border-slate-100 group-hover:border-slate-200 transition-colors">
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 group-hover:text-slate-600 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-slate-500 transition-colors flex-shrink-0" />
            {feature}
          </div>
        ))}
      </div>
    </div>
  );
}

// Old component removed
// function ModernFeatureCard(...) { }
