'use client';

import { COMPANY_PHONE, COMPANY_PHONE_LINK } from '@/lib/constants';

export function SiteFooter() {
    return (
        <footer className="py-12 lg:py-16 bg-card border-t border-border text-center mb-20 sm:mb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
                <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em]">Supporto Totale</p>
                    <a
                        href={COMPANY_PHONE_LINK}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-bold text-xl transition-colors"
                    >
                        📞 +39 {COMPANY_PHONE}
                    </a>
                </div>
                <div className="pt-8 border-t border-border text-muted-foreground text-sm space-y-2">
                    <p>© 2026 NikiTuttofare • Powered by Gemini AI</p>
                    <p className="text-xs">
                        Attivi su: Rimini • Riccione • Cattolica • Misano • Bellaria • Santarcangelo • San Marino
                    </p>
                </div>
            </div>
        </footer>
    );
}
