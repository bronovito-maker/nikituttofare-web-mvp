import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { StickyActionNav } from '@/components/landing/sticky-action-nav';
import { FileCheck, FileSpreadsheet, QrCode, CalendarClock, Building2, ShieldCheck, Zap, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default function BusinessPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
            <SiteHeader />

            <main className="flex-1">
                {/* Hero Business */}
                <section className="relative py-20 lg:py-32 px-4 overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                    <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-black uppercase tracking-widest">
                                Partner Horeca & Corporate
                            </div>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-tight">
                                Il Tuo Business <br /> non si Ferma Mai.
                            </h1>
                            <p className="text-xl text-muted-foreground font-medium max-w-xl mx-auto lg:mx-0">
                                Mantieni la tua operatività al massimo con la mia assistenza tecnica H24. Soluzioni proattive e interventi rapidi per Hotel, Ristoranti e Stabilimenti a Rimini e Riccione.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Button asChild size="lg" className="h-14 px-8 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                                    <a href="tel:+393461027447">Chiama Ora H24</a>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-xl font-bold border-2">
                                    <a href="https://wa.me/393461027447" target="_blank" rel="noopener noreferrer">
                                        <MessageCircle className="mr-2 h-5 w-5" />
                                        Contatto Commerciale
                                    </a>
                                </Button>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-border rotate-2">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <Building2 className="h-8 w-8 text-blue-600" />
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-muted-foreground uppercase">Service Level</p>
                                            <p className="text-lg font-black text-emerald-500 tracking-tight">PREMIUM H24</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border/50">
                                            <Zap className="h-4 w-4 text-orange-500" />
                                            <p className="text-sm font-bold">Intervento Garantito in 60 min</p>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border/50">
                                            <ShieldCheck className="h-4 w-4 text-blue-500" />
                                            <p className="text-sm font-bold">Protocollo Privacy & Sicurezza</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* B2B Features Grid */}
                <section className="py-24 px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Soluzioni su Misura per <span className="text-blue-600">Professionisti</span></h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Assistenza tecnica integrata per la gestione intelligente dei tuoi locali.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                                    <FileCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Compliance HACCP</h3>
                                <p className="text-sm text-muted-foreground">Report automatici validi per controlli ASL generati dopo ogni intervento su impianti frigo e idraulici.</p>
                            </div>
                            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                                    <QrCode className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Gestione Asset QR</h3>
                                <p className="text-sm text-muted-foreground">Applichiamo un QR su ogni macchinario per vedere lo storico riparazioni, schede tecniche e manuali in un click.</p>
                            </div>
                            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                                    <FileSpreadsheet className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Fatturazione Agile</h3>
                                <p className="text-sm text-muted-foreground">Unico fornitore, un&apos;unica fattura a fine mese con dettaglio centri di costo per ogni singola struttura.</p>
                            </div>
                            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
                                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6">
                                    <CalendarClock className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Manutenzione H24</h3>
                                <p className="text-sm text-muted-foreground">Piani di intervento programmati per prevenire guasti, ottimizzare i costi e garantire la continuità.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4 bg-blue-600 text-white">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <h2 className="text-3xl sm:text-5xl font-black">Pronto a collaborare?</h2>
                        <p className="text-xl opacity-90">Contattami oggi per un sopralluogo gratuito o per discutere di una convenzione per la tua struttura.</p>
                        <div className="flex justify-center">
                            <Button asChild size="lg" className="h-16 px-10 rounded-2xl bg-white text-blue-600 hover:bg-slate-100 font-black text-xl shadow-2xl">
                                <a href="https://wa.me/393461027447">Parla con Nikita</a>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <StickyActionNav />
            <SiteFooter />
        </div>
    );
}
