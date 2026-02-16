'use client';

import Link from 'next/link';
import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COMPANY_PHONE_LINK } from '@/lib/constants';

export function StickyActionNav() {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 bg-gradient-to-t from-background via-background/95 to-transparent sm:hidden pointer-events-none">
            <div className="grid grid-cols-3 gap-2 pointer-events-auto max-w-md mx-auto">
                {/* Personal Call - Primary fallback */}
                <Button
                    asChild
                    variant="outline"
                    className="h-14 rounded-2xl bg-white border-slate-200 shadow-lg active:scale-95 transition-all hover:bg-slate-50 group px-0"
                >
                    <a href="tel:+393461027447" className="flex flex-col items-center justify-center gap-0.5">
                        <Phone className="h-4 w-4 text-slate-900 transition-transform group-active:scale-90" />
                        <span className="text-[10px] font-bold text-slate-900">Chiama</span>
                    </a>
                </Button>

                {/* WhatsApp - Primary chat */}
                <Button
                    asChild
                    className="h-14 rounded-2xl bg-[#25D366] hover:bg-[#20bd5c] text-white shadow-xl shadow-green-500/20 active:scale-95 transition-all border-none px-0"
                >
                    <a href="https://wa.me/393461027447?text=Ciao%20Niki%2C%20ho%20un%20problema%20con%20%5Bscrivi%20qui%20il%20guasto%5D%2C%20puoi%20aiutarmi%3F" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-0.5">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-[10px] font-bold">WhatsApp</span>
                    </a>
                </Button>

                {/* Emergency - High urgency */}
                <Button
                    asChild
                    variant="outline"
                    className="h-14 rounded-2xl bg-black border-red-600/50 shadow-lg active:scale-95 transition-all hover:bg-black group px-0"
                >
                    <a href={COMPANY_PHONE_LINK} className="flex flex-col items-center justify-center gap-0.5">
                        <Phone className="h-4 w-4 text-red-600 animate-pulse transition-transform group-active:scale-90" />
                        <span className="text-[10px] font-bold text-red-600 uppercase">SOS</span>
                    </a>
                </Button>
            </div>
        </div>
    );
}
