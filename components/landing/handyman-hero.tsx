'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Shield, CheckCircle, Star } from 'lucide-react';
import { COMPANY_PHONE_LINK } from '@/lib/constants';

const ANNOYING_CHIPS = [
    { icon: '🚪', label: 'Porte che non chiudono' },
    { icon: '💧', label: 'Perdite e rubinetti' },
    { icon: '⚡', label: 'Prese e luci' },
    { icon: '🪟', label: 'Tapparelle e infissi' },
    { icon: '🛠️', label: 'Mobili e cucina' },
    { icon: '🔧', label: 'Piccole riparazioni' },
];

export function HandymanHero() {
    const getWhatsappLink = (problem?: string) => {
        const text = problem
            ? `Ciao Niki, sono a [zona]. Problema: ${problem}. Ti mando foto. Puoi passare oggi?`
            : `Ciao Niki, sono a [zona]. Ho alcuni problemi in casa da risolvere. Ti mando foto. Puoi passare oggi?`;
        return `https://wa.me/393461027447?text=${encodeURIComponent(text)}`;
    };

    return (
        <section className="relative min-h-[100dvh] flex flex-col bg-[#0a0a0a] text-white overflow-x-hidden font-sans pb-12">
            {/* 1) MICRO TRUST BAR */}
            <div className="w-full py-2.5 bg-white/5 border-b border-white/5 flex justify-center items-center gap-2 px-4 sticky top-0 z-50 backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-emerald-500">
                    Disponibile oggi • Rimini e dintorni
                </span>
            </div>

            <div className="flex-1 flex flex-col items-center px-6 py-8 md:py-16 max-w-xl mx-auto w-full space-y-8 md:space-y-12">

                {/* 2) MAIN HEADLINE */}
                <div className="space-y-3 text-center">
                    <h1 className="text-[2.5rem] md:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.1] uppercase">
                        Riparo tutto ciò che <br />
                        <span className="text-emerald-500">in casa non funziona</span>
                    </h1>
                    <p className="text-lg md:text-xl font-bold text-white/50 tracking-tight">
                        Interventi rapidi a Rimini, Riccione e dintorni
                    </p>
                </div>

                {/* 3) RELIEF STATEMENT */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-2.5 rounded-full text-center">
                    <p className="text-emerald-500 font-bold text-sm md:text-base tracking-wide uppercase">
                        Un solo intervento. Più problemi risolti.
                    </p>
                </div>

                {/* 4) CORE VALUE PILLS */}
                <div className="w-full space-y-4">
                    <div className="grid grid-cols-1 gap-2.5 w-full">
                        {[
                            "Intervento rapido (anche oggi)",
                            "Diritto di chiamata da €30",
                            "Oltre 100+ lavori completati"
                        ].map((text, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-white/[0.03] p-4 rounded-2xl border border-white/10">
                                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                <span className="font-bold text-base md:text-lg">{text}</span>
                            </div>
                        ))}
                    </div>

                    {/* MICRO PROOF */}
                    <div className="flex items-center justify-center gap-2 py-1">
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            ))}
                        </div>
                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">
                            Recensioni 4.9 ⭐ (Google) • Rimini / Riccione
                        </p>
                    </div>
                </div>

                {/* 5) PROBLEM RECOGNITION CHIPS */}
                <div className="w-full space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-center">Qual è il tuo problema?</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {ANNOYING_CHIPS.map((chip, idx) => (
                            <a
                                key={idx}
                                href={getWhatsappLink(chip.label)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-full border border-white/5 transition-all cursor-pointer active:scale-95 group"
                            >
                                <span className="text-lg group-hover:scale-110 transition-transform">{chip.icon}</span>
                                <span className="text-[12px] font-bold whitespace-nowrap opacity-80 group-hover:opacity-100">{chip.label}</span>
                            </a>
                        ))}
                    </div>
                </div>

                {/* 6) HUMAN PROOF */}
                <div className="flex flex-col items-center space-y-3">
                    <div className="relative group">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl bg-white/5">
                            <Image
                                src="/team-photo.png"
                                alt="Nikita - NikiTuttoFare"
                                width={80}
                                height={80}
                                className="object-cover"
                            />
                        </div>
                        <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a0a]" />
                    </div>
                    <div className="text-center">
                        <p className="font-black text-xl tracking-tight">Nikita</p>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Il tuo tuttofare di fiducia</p>
                    </div>
                </div>

                {/* 7) & 8) ACTIONS */}
                <div className="space-y-4 w-full pt-2">
                    <Button
                        asChild
                        className="w-full h-16 text-lg font-black rounded-full transition-all active:scale-95 bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                    >
                        <a
                            href={getWhatsappLink()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="w-6 h-6 fill-current" />
                            WHATSAPP — mandami una foto
                        </a>
                    </Button>

                    <Button
                        asChild
                        variant="outline"
                        className="w-full h-16 text-base font-bold rounded-full transition-all active:scale-95 border-white/10 bg-transparent hover:bg-white/5 text-white"
                    >
                        <a href={COMPANY_PHONE_LINK} className="flex items-center justify-center gap-2">
                            <Phone className="w-5 h-5" />
                            Chiama ora
                        </a>
                    </Button>
                </div>

                {/* 11) MOBILE STICKY ACTION BAR */}
                <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 md:hidden">
                    <div className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 flex gap-2.5 shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
                        <Button
                            asChild
                            className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition-all active:scale-95"
                        >
                            <a
                                href={getWhatsappLink()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5"
                            >
                                <MessageCircle className="w-4 h-4 fill-current" />
                                WhatsApp
                            </a>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="flex-1 h-12 border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-sm rounded-xl transition-all active:scale-95"
                        >
                            <a href={COMPANY_PHONE_LINK} className="flex items-center justify-center gap-1.5">
                                <Phone className="w-4 h-4" />
                                Chiama
                            </a>
                        </Button>
                    </div>
                </div>

            </div>

            {/* Decorative Background Elements */}
            <div className="absolute top-1/4 -left-32 w-80 h-80 bg-emerald-500/[0.03] rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-blue-500/[0.03] rounded-full blur-[120px] -z-10" />
        </section>
    );
}
