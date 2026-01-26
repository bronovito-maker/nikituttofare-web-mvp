'use client';

import Link from 'next/link';
import { Phone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COMPANY_PHONE_LINK } from '@/lib/constants';

export function StickyActionNav() {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 bg-gradient-to-t from-background via-background/95 to-transparent sm:hidden pointer-events-none">
            <div className="flex gap-3 pointer-events-auto max-w-md mx-auto">
                {/* Secondary: Chiama */}
                <Button
                    asChild
                    variant="outline"
                    className="flex-1 h-14 rounded-2xl bg-background/80 backdrop-blur-md border-border shadow-lg active:scale-95 transition-all"
                >
                    <a href={COMPANY_PHONE_LINK} className="flex flex-col items-center justify-center gap-0.5">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">Urgenza</span>
                    </a>
                </Button>

                {/* Primary: AI Diagnosis */}
                <Button
                    asChild
                    className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                >
                    <Link href="/chat" className="flex flex-col items-center justify-center gap-0.5">
                        <Sparkles className="h-5 w-5" />
                        <span className="text-xs font-bold">Avvia Diagnosi AI</span>
                    </Link>
                </Button>
            </div>
        </div>
    );
}
