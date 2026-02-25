'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MessageCircle, Star, Zap, ShieldCheck, Sparkles } from 'lucide-react';
import { BlurText } from '@/components/react-bits/BlurText';

interface HeroContentProps {
  cityName?: string;
  serviceName?: string;
}

export function HeroContent({ cityName, serviceName }: HeroContentProps) {
  // Simplified Content (Residential by default)
  const headline = serviceName && cityName
    ? `Riparazioni e Manutenzione ${serviceName} a ${cityName}`
    : "Riparazioni e Manutenzione a Rimini e Riccione";

  const bullets = [
    { icon: <Zap className="h-5 w-5 text-orange-500" />, text: "Riparazioni Rapide" },
    { icon: <ShieldCheck className="h-5 w-5 text-blue-500" />, text: "Prezzi Trasparenti" },
    { icon: <Sparkles className="h-5 w-5 text-emerald-500" />, text: "Pulizia Garantita" },
  ];

  return (
    <div className="flex flex-col items-center lg:items-start lg:grid lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-16">
      {/* Left Column: Text & CTAs */}
      <div className="w-full text-center lg:text-left space-y-8">
        <div className="space-y-6">
          <BlurText
            text={headline}
            as="h1"
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tighter text-foreground leading-[1.1] text-balance"
            delay={0.05}
          />

          {/* Scan-friendly Bullet Points */}
          <div className="flex flex-col sm:flex-row lg:flex-row gap-3 sm:gap-6 justify-center lg:justify-start">
            {bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-center gap-3 justify-center lg:justify-start group">
                <div className="p-1.5 rounded-lg bg-secondary/50 group-hover:bg-secondary transition-colors">
                  {bullet.icon}
                </div>
                <span className="text-base font-bold text-foreground/90 tracking-tight whitespace-nowrap">
                  {bullet.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Primary Action Row */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button
              asChild
              className="h-16 px-8 text-xl rounded-2xl font-black shadow-xl bg-[#25D366] hover:bg-[#20ba59] text-white shadow-green-500/20 hover:scale-[1.03] active:scale-95 transition-all border-none"
            >
              <a
                href="https://wa.me/393461027447?text=Ciao%20Niki%2C%20ho%20bisogno%20del%20tuo%20aiuto"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <MessageCircle className="mr-2 h-6 w-6" />
                WhatsApp
              </a>
            </Button>

            <Button
              asChild
              className="h-16 px-8 text-xl rounded-2xl font-black shadow-xl bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 hover:scale-[1.03] active:scale-95 transition-all border-none"
            >
              <Link href="/chat" className="flex items-center">
                <Zap className="mr-2 h-6 w-6 fill-current" />
                Parla con Niki
              </Link>
            </Button>
          </div>

          {/* New Photo Placement (per user request: "dopo il titolo ed i tasti CTA") */}
          <div className="relative pt-4 flex justify-center lg:justify-start">
            <div className="relative group w-full max-w-[320px] aspect-[4/3] sm:aspect-video lg:aspect-square">
              {/* Main Photo Container */}
              <div className="absolute inset-0 rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02] border-4 border-white dark:border-slate-800 z-10">
                <Image
                  src="/Gemini_Generated_Image_pezbepezbepezbep.png"
                  alt="Nikita Bronovs - NikiTuttoFare"
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-all duration-700"
                  priority
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
              </div>

              {/* Decorative Back Elements */}
              <div className="absolute inset-2 bg-blue-600/10 rounded-[2.2rem] -rotate-2 group-hover:-rotate-3 transition-transform duration-500" />

              {/* Dynamic Badge Status */}
              <div className="absolute -top-3 -right-3 z-20 px-4 py-2 bg-emerald-500 text-white text-[10px] sm:text-xs font-black rounded-full border-2 border-background shadow-lg flex items-center gap-2 ring-4 ring-emerald-500/10 whitespace-nowrap">
                <span className="block w-2 h-2 bg-white rounded-full animate-pulse" />
                OPERATIVO OGGI SU RIMINI E DINTORNI
              </div>
            </div>
          </div>

          {/* Trust Row */}
          <div className="flex items-center gap-2 justify-center lg:justify-start text-sm font-bold text-muted-foreground/60 uppercase tracking-widest pt-4">
            <span>Recensioni Google</span>
            <div className="flex text-orange-500/80">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Empty or for other visual elements in the future */}
      <div className="hidden lg:block">
        {/* We keep the grid structure for future expansion or balancing spacing */}
      </div>
    </div>
  );
}
