import { PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { WHATSAPP_LINK, EMERGENCY_PHONE_LINK, GENERAL_PHONE_LINK } from '@/lib/constants';

export function DirectContact() {
    const whatsappUrl = WHATSAPP_LINK + "?text=Ciao Niki, ho bisogno di aiuto urgente";
    const emergencyTel = EMERGENCY_PHONE_LINK;
    const personalTel = GENERAL_PHONE_LINK;

    return (
        <section className="py-16 sm:py-24 px-4 bg-transparent relative z-10">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight">
                        Parliamo di persona?
                    </h2>
                </div>
                <Card className="
                relative border-0 overflow-hidden transition-all duration-500
                /* LIGHT MODE: PREMIUM WHITE */
                bg-white shadow-[0_20px_50px_rgba(0,0,0,0.06)]
                /* DARK MODE: GLASSMORPHISM */
                dark:bg-[#121212]/80 dark:backdrop-blur-xl dark:border dark:border-white/10 dark:shadow-[0_20px_50px_rgba(0,0,0,0.2)]
            ">
                    {/* Subtle Gradient Glow for Dark Mode */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/5 opacity-0 dark:opacity-100 pointer-events-none" />

                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.07] pointer-events-none transform rotate-12">
                        {/* Stylized Nokia-like Robust Phone SVG */}
                        <svg width="180" height="280" viewBox="0 0 60 100" fill="currentColor" className="text-blue-600 dark:text-blue-400">
                            <rect x="10" y="10" width="40" height="80" rx="5" stroke="currentColor" strokeWidth="2" fill="none" />
                            <rect x="15" y="20" width="30" height="20" rx="2" fill="currentColor" />
                            <rect x="15" y="45" width="30" height="30" fill="none" />
                            <circle cx="20" cy="50" r="2" fill="currentColor" />
                            <circle cx="30" cy="50" r="2" fill="currentColor" />
                            <circle cx="40" cy="50" r="2" fill="currentColor" />
                            <circle cx="20" cy="60" r="2" fill="currentColor" />
                            <circle cx="30" cy="60" r="2" fill="currentColor" />
                            <circle cx="40" cy="60" r="2" fill="currentColor" />
                            <circle cx="20" cy="70" r="2" fill="currentColor" />
                            <circle cx="30" cy="70" r="2" fill="currentColor" />
                            <circle cx="40" cy="70" r="2" fill="currentColor" />
                        </svg>
                    </div>

                    <CardContent className="p-8 md:p-14 text-center md:text-left flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
                        <div className="space-y-6 max-w-xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-full text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                                <PhoneCall className="w-3.5 h-3.5" />
                                Contatto Diretto
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-[#1A1A1B] dark:text-white leading-tight tracking-tight">
                                Hai un&apos;urgenza o preferisci parlare con una persona?
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl font-medium leading-relaxed">
                                Salta l&apos;intelligenza artificiale e mettiti subito in contatto con me. Rispondo personalmente a ogni chiamata.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 w-full sm:w-[320px] shrink-0">
                            {/* Personal Number - Using a distinct style */}
                            <Button asChild size="lg" variant="outline" className="
                            bg-white hover:bg-slate-50 text-slate-900 border-border dark:border-white/10 font-bold h-14 rounded-2xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]
                        ">
                                <Link href={personalTel} className="flex items-center justify-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                        <PhoneCall className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span>Cellulare Personale</span>
                                </Link>
                            </Button>

                            {/* WhatsApp Button */}
                            <Button asChild size="lg" className="
                            bg-[#25D366] hover:bg-[#22c35e] text-white border-0 font-bold h-14 rounded-2xl shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]
                        ">
                                <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3">
                                    <WhatsappIcon className="h-5 w-5 shrink-0" />
                                    <span>WhatsApp Diretto</span>
                                </Link>
                            </Button>

                            {/* Red Number Button - Emergency */}
                            <div className="flex flex-col gap-2 items-center w-full pt-2">
                                <Button asChild variant="destructive" size="lg" className="
                                w-full h-16 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 font-black rounded-2xl shadow-xl shadow-red-500/20 border-0 transition-all hover:scale-[1.02] active:scale-[0.98]
                            ">
                                    <Link href={emergencyTel} className="flex items-center justify-center gap-3">
                                        <PhoneCall className="h-5 w-5 animate-pulse shrink-0 fill-current" />
                                        <span className="uppercase tracking-tight text-lg">Emergenze H24</span>
                                    </Link>
                                </Button>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest px-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    Numero Rosso • Rispondo sempre
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}

function WhatsappIcon(props: Readonly<React.SVGProps<SVGSVGElement>>) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}
