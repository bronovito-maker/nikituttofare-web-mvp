import Link from 'next/link';
import { ArrowLeft, Users, Zap, CreditCard, Calendar, ArrowRight, ShieldCheck, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TechnicianCTA } from '@/components/landing/technician-cta';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export const metadata = {
    title: 'Opportunità per Professionisti | Collabora con NikiTuttoFare',
    description: 'Sei un idraulico, elettricista o tuttofare? Scopri come NikiTuttoFare può aiutarti a far crescere la tua attività in Riviera Romagnola.',
};

export default function TechnicianLandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <SiteHeader />

            <main className="flex-1">
                {/* Re-use the high-impact CTA component as the main Hero for this page */}
                <TechnicianCTA />

                <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900/20">
                    <div className="max-w-4xl mx-auto space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Perché scegliere NikiTuttoFare?</h2>
                            <p className="text-lg text-muted-foreground">Oltre 100 artigiani hanno già scelto di semplificare il proprio lavoro.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold">Pagamenti Garantiti</h3>
                                <p className="text-muted-foreground">Dimentica i solleciti. NikiTuttoFare assicura pagamenti puntuali per ogni intervento completato con successo.</p>
                            </div>

                            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600">
                                    <BadgeCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold">Clienti Pre-Qualificati</h3>
                                <p className="text-muted-foreground">L&apos;AI di Niki analizza ogni richiesta prima di inviartela. Ricevi solo i lavori che sei pronto a risolvere.</p>
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white rounded-[3rem] p-10 md:p-16 text-center space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-10">
                                <Users className="w-32 h-32" />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black leading-tight relative z-10">Pronto a fare sul serio?</h2>
                            <p className="text-xl text-slate-300 max-w-2xl mx-auto relative z-10">
                                La registrazione richiede solo 2 minuti. Una volta verificato il tuo profilo, potrai iniziare ad accettare i lavori nella tua zona.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                                <Button asChild size="lg" className="h-14 px-10 text-lg font-bold rounded-full bg-white text-slate-900 hover:bg-slate-100">
                                    <Link href="/technician/register">
                                        Registrati Ora
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="h-14 px-10 text-lg font-bold rounded-full border-white/20 text-white hover:bg-white/10">
                                    <Link href="/technician/login">
                                        Accedi al Dashboard
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
