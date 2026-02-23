'use client';

import { Check, X, Calculator } from 'lucide-react';

export function PriceComparison() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-8 max-w-4xl mx-auto">

            {/* Old Way Side */}
            <div className="relative p-6 xs:p-8 rounded-3xl bg-card/90 border border-border shadow-sm scale-95 md:scale-100 filter grayscale md:grayscale-0 hover:grayscale-0 transition-all duration-500">
                <div className="absolute top-4 left-4 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Il solito &quot;pezzo di carta&quot;
                </div>

                {/* Paper Mock */}
                <div className="mt-8 bg-[#fff9c4] text-slate-800 p-6 rounded shadow-sm rotate-1 font-handwriting h-[200px] flex flex-col justify-between font-serif relative">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 absolute -top-3 -right-3 flex items-center justify-center">
                        <X className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="space-y-4">
                        <p className="text-lg leading-tight">Sistemazione tubo che gocciola...</p>
                        <div className="h-0.5 w-full bg-slate-800/20" />
                        <p>Pezzi di ricambio (??)</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold">€ 250,00 ?</p>
                        <p className="text-xs text-slate-600">più IVA (forse)</p>
                    </div>
                </div>

                <ul className="mt-6 space-y-3">
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                        <X className="w-4 h-4 text-red-500" />
                        <span>Prezzo &quot;sparato a caso&quot;</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-muted-foreground">
                        <X className="w-4 h-4 text-red-500" />
                        <span>Nessun listino ufficiale</span>
                    </li>
                </ul>
            </div>

            {/* Niki AI Way Side */}
            <div className="relative p-6 xs:p-8 rounded-3xl bg-gradient-to-br from-card to-blue-50/10 dark:to-blue-950/10 border-2 border-blue-500/20 shadow-2xl shadow-blue-500/5 overflow-hidden">

                <div className="absolute top-0 right-0 p-3 bg-blue-600 rounded-bl-2xl text-white">
                    <Calculator className="w-5 h-5" />
                </div>

                <div className="absolute top-4 left-4 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Preventivo Immediato
                </div>

                {/* Digital Receipt Mock */}
                <div className="mt-8 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                    {/* Item 1 */}
                    <div className="flex justify-between items-start text-sm">
                        <div>
                            <span className="font-semibold text-foreground">Diritto di Chiamata</span>
                            <p className="text-xs text-muted-foreground">Zona Rimini Marina C. • Urgenza</p>
                        </div>
                        <span className="font-mono font-medium">€ 30,00</span>
                    </div>

                    {/* Item 2 */}
                    <div className="flex justify-between items-start text-sm border-t border-dashed border-border pt-3">
                        <div>
                            <span className="font-semibold text-foreground">Manodopera (45 min)</span>
                            <p className="text-xs text-emerald-600 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Tariffa Regionale 2026
                            </p>
                        </div>
                        <span className="font-mono font-medium">€ 45,00</span>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-end border-t border-border pt-3">
                        <span className="text-sm font-bold text-muted-foreground">Totale Stimato</span>
                        <span className="text-2xl font-black text-foreground tracking-tight">€ 75,00</span>
                    </div>
                </div>

                <ul className="mt-6 space-y-3">
                    <li className="flex items-center gap-3 text-sm font-medium text-foreground">
                        <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full"><Check className="w-3 h-3 text-green-600" /></div>
                        <span>Prezzi Chiari Emilia-Romagna</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium text-foreground">
                        <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full"><Check className="w-3 h-3 text-green-600" /></div>
                        <span>Trasparenza totale NikiTuttoFare</span>
                    </li>
                </ul>
            </div>

        </div>
    );
}
