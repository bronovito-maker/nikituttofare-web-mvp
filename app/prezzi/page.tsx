import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { StickyActionNav } from '@/components/landing/sticky-action-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote, Wrench, Zap, KeyRound, Paintbrush, Hammer, ThermometerSnowflake, Truck, Building, Clock, ArrowRight, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Listino Prezzi Ufficiale | NikiTuttoFare',
    description: 'Tariffario ufficiale diviso per categorie per gli interventi di idraulica, elettricità, fabbro e altro. Prezzi trasparenti e onesti.',
};

const priceCategories = [
    {
        title: "Idraulica",
        icon: Wrench,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        items: [
            { name: "Disotturazione Semplice", price: "50€ - 80€" },
            { name: "Disotturazione Complessa (WC/Colonne)", price: "100€ - 200€" },
            { name: "Rubinetteria / Cassetta WC", price: "50€ - 150€" },
            { name: "Caldaia (Manutenzione/Fumi)", price: "85€ - 130€" },
        ]
    },
    {
        title: "Elettricità",
        icon: Zap,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        items: [
            { name: "Ricerca Guasto", price: "50€ - 80€ / ora" },
            { name: "Salvavita (Sostituzione)", price: "120€ - 160€" },
            { name: "Punto Luce (Aggiunta/Modifica)", price: "50€ cad." },
        ]
    },
    {
        title: "Fabbro & Tapparellista",
        icon: KeyRound,
        color: "text-slate-500",
        bgColor: "bg-slate-500/10",
        items: [
            { name: "Apertura Porta (No Scasso)", price: "80€ - 120€" },
            { name: "Apertura Porta (Scasso/Notte)", price: "200€ - 500€" },
            { name: "Cambio Serratura", price: "80€ - 400€ (var. per modello)" },
            { name: "Sostituzione Cinghia Tapparella", price: "50€ - 80€" },
            { name: "Riparazione Tapparella Motore", price: "150€ - 250€" },
        ]
    },
    {
        title: "Imbiancatura",
        icon: Paintbrush,
        color: "text-indigo-500",
        bgColor: "bg-indigo-500/10",
        items: [
            { name: "Tinteggiatura Bianca (Semplice)", price: "8€ - 12€ / mq" },
            { name: "Tinteggiatura Colore / Effetti", price: "15€ - 25€ / mq" },
            { name: "Trattamento Antimuffa (Stanza)", price: "+50€ - 100€" },
        ]
    },
    {
        title: "Falegnameria & Montaggio",
        icon: Hammer,
        color: "text-amber-600",
        bgColor: "bg-amber-600/10",
        items: [
            { name: "Montaggio Mobile / IKEA", price: "25€ - 45€ / ora" },
            { name: "Montaggio Cucina", price: "250€ - 600€" },
            { name: "Registrazione Porte / Finestre", price: "40€ - 70€" },
        ]
    },
    {
        title: "Clima",
        icon: ThermometerSnowflake,
        color: "text-cyan-500",
        bgColor: "bg-cyan-500/10",
        items: [
            { name: "Pulizia/Sanificazione Split", price: "25€ - 100€ per split" },
            { name: "Ricarica Gas Condizionatore", price: "60€ - 140€" },
        ]
    },
    {
        title: "Altro & Edilizia",
        icon: Building,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        items: [
            { name: "Tuttofare Generico", price: "25€ - 50€ / ora" },
            { name: "Demolizione (Tramezzi/Pavimenti)", price: "15€ - 25€ / mq" },
            { name: "Rifacimento Bagno (Completo)", price: "3.500€ - 6.000€" },
            { name: "Piccola Muratura / Riparazione Tetto", price: "A preventivo" },
        ]
    }
];

export default function PrezziPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
            <SiteHeader />

            <main className="flex-1 pb-20">
                {/* Hero Section */}
                <section className="bg-muted border-b border-border py-12 px-4 text-center">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2">
                            <Banknote className="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
                            Listino Prezzi Ufficiale 2026
                        </h1>
                        <p className="text-xl text-muted-foreground font-medium">
                            Trasparenza al 100%. Tutti i prezzi sono <span className="text-foreground font-bold">IVA ESCLUSA</span>.
                        </p>

                        {/* Reminder card */}
                        <div className="mt-8 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 sm:p-6 text-left max-w-2xl mx-auto shadow-sm">
                            <div className="flex gap-4">
                                <div className="mt-1 flex-shrink-0 text-amber-600 dark:text-amber-500">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-amber-900 dark:text-amber-400 text-lg">Nota Bene</h3>
                                    <p className="text-amber-800/80 dark:text-amber-500/80 mt-1">
                                        I nostri prezzi riflettono la qualità e la rapidità di un servizio H24 fornito da professionisti certificati. Non sono i &quot;più bassi&quot;, ma garantiamo la massima efficienza e durata dell&apos;intervento.
                                    </p>
                                    <p className="font-bold mt-3 text-amber-900 dark:text-amber-300 text-lg border-t border-amber-200/50 dark:border-amber-900/50 pt-3">
                                        Il prezzo finale viene stabilito dopo visione del lavoro.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">

                    {/* Chiusura & Uscita Section */}
                    <section className="space-y-6">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight flex items-center gap-3">
                            <Truck className="w-8 h-8 text-blue-600" />
                            1. Chiamata & Uscita <span className="text-base font-normal text-muted-foreground ml-auto hidden sm:inline-block">(Sempre applicabile)</span>
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="border-border shadow-sm">
                                <CardContent className="p-6">
                                    <div className="text-sm font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Diurna Feriale Urbana</div>
                                    <div className="text-3xl font-black text-foreground">30€ - 50€</div>
                                </CardContent>
                            </Card>
                            <Card className="border-border shadow-sm">
                                <CardContent className="p-6">
                                    <div className="text-sm font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Extra-Urbana {'>'} 15km</div>
                                    <div className="text-3xl font-black text-foreground">50€ - 70€</div>
                                </CardContent>
                            </Card>
                            <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 sm:col-span-2 lg:col-span-1 shadow-sm relative overflow-hidden group">
                                <CardContent className="p-6 relative z-10">
                                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider">Supplemento Obbligatorio</div>
                                    <div className="text-xs text-blue-700/70 dark:text-blue-300/70 mb-2 font-medium">Horeca / Notturna / Urgenza / Festivi</div>
                                    <div className="text-3xl font-black text-blue-900 dark:text-blue-100">+80€ - 150€</div>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    <div className="w-full h-px bg-border"></div>

                    {/* Categorie Intervento */}
                    <section className="space-y-8">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">2. Categorie Intervento</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                            {priceCategories.map((category, idx) => {
                                const Icon = category.icon;
                                return (
                                    <Card key={idx} className="flex flex-col border-border/60 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="flex flex-row items-center gap-4 pb-4 border-b border-border/30 bg-muted/20">
                                            <div className={`p-3 rounded-xl ${category.bgColor} ${category.color}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <CardTitle className="text-xl">{category.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0 flex-1 flex flex-col">
                                            <ul className="divide-y divide-border/50 flex-1">
                                                {category.items.map((item, idxi) => (
                                                    <li key={idxi} className="flex justify-between items-center p-4 sm:px-6 hover:bg-muted/30 transition-colors">
                                                        <span className="font-medium text-muted-foreground text-sm sm:text-base pr-4">{item.name}</span>
                                                        <span className="font-bold text-foreground whitespace-nowrap">{item.price}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="p-4 sm:px-6 border-t border-border/30 bg-muted/10 mt-auto">
                                                <Link
                                                    href="/chat"
                                                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors hover:text-white hover:bg-blue-600 ${category.color} bg-white dark:bg-card border border-border hover:border-blue-600`}
                                                >
                                                    Richiedi Preventivo Rapido
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* Final CTA */}
                <section className="py-16 px-4 bg-blue-600 text-white mt-8">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">Vuoi sapere il prezzo esatto?</h2>
                        <p className="text-xl opacity-90 max-w-2xl mx-auto">
                            Mandaci una foto su WhatsApp o spiegaci il problema in chat.
                            Ti daremo un preventivo specifico in meno di 5 minuti.
                        </p>
                        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                href="/chat"
                                className="inline-flex h-14 px-8 items-center justify-center rounded-full bg-white text-blue-600 font-bold text-lg hover:scale-105 transition-transform w-full sm:w-auto shadow-xl shadow-blue-900/20"
                            >
                                <MessageSquare className="w-5 h-5 mr-2" />
                                Vai alla Chat
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <StickyActionNav />
            <SiteFooter />
        </div>
    );
}
