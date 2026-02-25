'use client';

import Link from 'next/link';
import { COMPANY_PHONE, COMPANY_PHONE_LINK } from '@/lib/constants';

export function HandymanFooter() {
    return (
        <footer className="pt-16 pb-32 px-6 bg-[#0a0a0a] border-t border-white/5">
            <div className="max-w-xl mx-auto space-y-12">

                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Navigazione</h4>
                        <nav className="flex flex-col gap-3">
                            <Link href="/" className="text-sm font-bold text-white/60 hover:text-white transition-colors">Homepage</Link>
                            <Link href="/services" className="text-sm font-bold text-white/60 hover:text-white transition-colors">Servizi</Link>
                            <Link href="/about" className="text-sm font-bold text-white/60 hover:text-white transition-colors">Chi siamo</Link>
                        </nav>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Legale</h4>
                        <nav className="flex flex-col gap-3">
                            <Link href="/privacy" className="text-sm font-bold text-white/60 hover:text-white transition-colors">Privacy Policy</Link>
                            <Link href="/terms" className="text-sm font-bold text-white/60 hover:text-white transition-colors">Termini</Link>
                        </nav>
                    </div>
                </div>

                <div className="space-y-6 border-t border-white/5 pt-8 text-center">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Contatti Rapidi</h4>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Emergenze 24/7</p>
                            <a href="tel:+393793394421" className="block text-xl font-black text-white hover:text-emerald-500 transition-colors">
                                ☎️ +39 379 339 4421
                            </a>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">WhatsApp / Chiamate / Foto</p>
                            <a href="tel:+393461027447" className="block text-xl font-black text-white hover:text-emerald-500 transition-colors">
                                📱 +39 346 102 7447
                            </a>
                        </div>

                        <p className="text-xs font-bold text-white/40 leading-relaxed capitalize pt-4">
                            Attivi su: <br />
                            Rimini • Riccione • Cattolica • Misano <br />
                            Bellaria • Santarcangelo • San Marino
                        </p>
                    </div>
                </div>

                <div className="pt-8 text-center border-t border-white/5">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.1em]">
                        © 2026 NikiTuttofare
                    </p>
                </div>
            </div>
        </footer>
    );
}
