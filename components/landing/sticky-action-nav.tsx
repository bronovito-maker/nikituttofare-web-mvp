'use client';

import Link from 'next/link';
import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COMPANY_PHONE_LINK } from '@/lib/constants';

export function StickyActionNav() {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 bg-gradient-to-t from-background via-background/95 to-transparent sm:hidden pointer-events-none">
            <div className="flex gap-3 pointer-events-auto max-w-md mx-auto">
                {/* Secondary: Emergenza */}
                <Button
                    asChild
                    variant="outline"
                    className="flex-1 h-14 rounded-2xl bg-black border-red-600/50 shadow-lg active:scale-95 transition-all hover:bg-black group"
                >
                    <a href={COMPANY_PHONE_LINK} className="flex flex-col items-center justify-center gap-0.5">
                        <Phone className="h-5 w-5 text-red-600 transition-transform group-active:scale-90" />
                        <span className="text-xs font-bold text-red-600">Emergenza</span>
                    </a>
                </Button>

                {/* Primary: WhatsApp */}
                <Button
                    asChild
                    className="flex-[2] h-14 rounded-2xl bg-[#25D366] hover:bg-[#20bd5c] text-white shadow-xl shadow-green-500/20 active:scale-95 transition-all border-none"
                >
                    <a href="https://wa.me/393461027447?text=Ciao%20Niki%2C%20ho%20un%20problema%20con%20%5Bscrivi%20qui%20il%20guasto%5D%2C%20puoi%20aiutarmi%3F" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-0.5">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-xs font-bold">WhatsApp</span>
                    </a>
                </Button>
            </div>
        </div>
    );
}
