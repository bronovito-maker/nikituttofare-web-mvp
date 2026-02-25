'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COMPANY_PHONE_LINK } from '@/lib/constants';

export function StickyActionNav() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Se lo scroll è maggiore di 100px, mostra la barra
            if (window.scrollY > 100) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        // Controllo iniziale
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 bg-gradient-to-t from-background via-background/95 to-transparent sm:hidden pointer-events-none transition-all duration-500 ease-in-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
            <div className="grid grid-cols-2 gap-3 pointer-events-auto max-w-sm mx-auto">
                {/* Personal Call - Primary contact */}
                <Button
                    asChild
                    variant="outline"
                    className="h-16 rounded-2xl bg-white border-slate-200 shadow-xl active:scale-95 transition-all hover:bg-slate-50 group px-0 border-2"
                >
                    <a href="tel:+393461027447" className="flex flex-col items-center justify-center gap-1">
                        <span className="text-2xl transition-transform group-active:scale-90">📞</span>
                        <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Chiama</span>
                    </a>
                </Button>

                {/* WhatsApp - Primary chat */}
                <Button
                    asChild
                    className="h-16 rounded-2xl bg-[#25D366] hover:bg-[#20bd5c] text-white shadow-xl shadow-green-500/20 active:scale-95 transition-all border-none px-0"
                >
                    <a href="https://wa.me/393461027447?text=Ciao%20Niki%2C%20ho%20un%20problema%20con%20%5Bscrivi%20qui%20il%20guasto%5D%2C%20puoi%20aiutarmi%3F" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-1">
                        <span className="text-2xl">💬</span>
                        <span className="text-xs font-black uppercase tracking-tight">WhatsApp</span>
                    </a>
                </Button>
            </div>
        </div>
    );
}
