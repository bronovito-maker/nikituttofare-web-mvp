import { Metadata } from 'next';
import Link from 'next/link';

import { RetroGrid } from '@/components/react-bits/RetroGrid';
import { BlurText } from '@/components/react-bits/BlurText';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    MapPin,
    ShieldCheck,
    Zap,
    Users,
    CheckCircle2,
    ArrowRight,
    Star,
    Phone
} from 'lucide-react';

import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export const metadata: Metadata = {
    title: 'Idraulico e Elettricista a Rimini e Riccione | Chi Siamo - NikiTuttoFare',
    description: 'NikiTuttoFare nasce nel 2022 per risolvere le urgenze domestiche in Romagna. Tecnici locali, prezzi chiari e intervento H24. Scopri la nostra storia.',
};

export default function AboutPage() {
    // JSON-LD Structured Data for LocalBusiness (HomeAndConstructionBusiness)
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'HomeAndConstructionBusiness',
        name: 'NikiTuttoFare',
        alternateName: 'NikiTuttoFare Pronto Intervento',
        description: 'Servizio di pronto intervento H24 per emergenze idrauliche ed elettriche a Rimini, Riccione e provincia. Tecnici certificati locali.',
        url: 'https://nikituttofare.it/about',
        logo: 'https://nikituttofare.it/logo.png',
        telephone: '+390000000000', // Placeholder
        priceRange: '$$',
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
                ],
                opens: '00:00',
                closes: '23:59'
            }
        ],
        areaServed: [
            { '@type': 'City', name: 'Rimini' },
            { '@type': 'City', name: 'Riccione' },
            { '@type': 'City', name: 'Cattolica' },
            { '@type': 'City', name: 'Misano Adriatico' },
            { '@type': 'City', name: 'Bellaria-Igea Marina' },
            { '@type': 'City', name: 'Santarcangelo di Romagna' },
            { '@type': 'City', name: 'Verucchio' },
            { '@type': 'City', name: 'Coriano' },
            { '@type': 'City', name: 'Morciano di Romagna' },
            { '@type': 'Country', name: 'San Marino' }
        ],
        geo: {
            '@type': 'GeoCoordinates',
            latitude: '44.0609', // Rimini coordinates
            longitude: '12.5665'
        },
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Rimini',
            addressRegion: 'RN',
            addressCountry: 'IT'
        },
        founders: [
            {
                '@type': 'Person',
                name: 'Fondatore NikiTuttoFare'
            }
        ]
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30 overflow-x-hidden">
            {/* Inject JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <SiteHeader />

            {/* 1. HERO SECTION (Emotional & Local SEO) */}
            <section className="relative min-h-[75vh] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                <RetroGrid className="opacity-30 dark:opacity-20" />

                <div className="relative z-10 max-w-5xl space-y-6 animate-in fade-in zoom-in duration-1000">
                    <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10 backdrop-blur-md px-4 py-1.5 text-sm font-semibold tracking-wide uppercase mb-4 shadow-lg shadow-emerald-500/10">
                        <MapPin className="w-3.5 h-3.5 mr-2" />
                        Pronto Intervento Rimini & Riccione
                    </Badge>

                    {/* H1 Semantic Title */}
                    <div className="space-y-2">
                        <h1 className="sr-only">Il tuo Idraulico ed Elettricista di Fiducia a Rimini</h1>
                        <div className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-[1.1]">
                            <BlurText
                                text="Non siamo il solito call center."
                                className="text-foreground drop-shadow-2xl"
                                delay={0.15}
                            />
                        </div>
                        <p className="text-xl md:text-3xl text-muted-foreground font-medium max-w-3xl mx-auto pt-4">
                            Siamo i tuoi vicini di casa esperti.
                            <br className="hidden md:block" />
                            Nati a Livorno, cresciuti in <span className="text-foreground font-bold underline decoration-blue-500/50 underline-offset-4">Romagna</span>.
                        </p>
                    </div>

                    <div className="pt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            asChild
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 py-7 text-lg shadow-[0_0_40px_rgba(37,99,235,0.3)] transition-all hover:scale-105"
                        >
                            <Link href="/chat">
                                <Zap className="w-5 h-5 mr-2 fill-current" />
                                Ho un&apos;urgenza ORA
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Gradient Fade at bottom */}
                <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
            </section>

            {/* 2. LA NOSTRA STORIA (Trust & Experience) - Two Column Layout */}
            <article className="py-24 px-6 relative">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        {/* Left: Content */}
                        <div className="space-y-8 order-2 md:order-1">
                            <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase text-sm">
                                <span className="w-8 h-[2px] bg-blue-600 dark:bg-blue-500"></span>
                                <span className="ml-2">La nostra Storia</span>
                            </div>

                            <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
                                Nati da un&apos;emergenza a Ferragosto.
                            </h2>

                            <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                                <p>
                                    Era il 15 agosto 2022 a <strong className="text-foreground">Livorno</strong>. Il nostro fondatore si ritrovò con la casa allagata e nessun idraulico disponibile nel raggio di 50km. Solo segreterie telefoniche o call center anonimi che promettevano richiamate mai arrivate.
                                </p>
                                <p className="border-l-4 border-blue-500 pl-6 italic text-foreground/80">
                                    &quot;È possibile che nel 2022 sia così difficile trovare una persona onesta che ti aiuti in un&apos;emergenza?&quot;
                                </p>
                                <p>
                                    Da quella frustrazione è nato <strong className="text-foreground font-semibold">NikiTuttoFare</strong>. Oggi portiamo quella stessa filosofia in Riviera Romagnola: eliminare l&apos;ansia dell&apos;attesa e offrire un volto amico, non un centralino.
                                </p>
                            </div>

                            <div className="flex gap-8 pt-4">
                                <div>
                                    <h4 className="text-3xl font-bold text-foreground">500+</h4>
                                    <p className="text-sm text-muted-foreground uppercase mt-1">Interventi 2024</p>
                                </div>
                                <div>
                                    <h4 className="text-3xl font-bold text-foreground">60min</h4>
                                    <p className="text-sm text-muted-foreground uppercase mt-1">Tempo medio</p>
                                </div>
                            </div>
                        </div>

                        {/* Right: Visual / Image Placeholder */}
                        <div className="order-1 md:order-2 relative h-[500px] rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-blue-900/10 border border-border">
                            {/* Placeholder for Image - In production use next/image */}
                            <div className="absolute inset-0 bg-slate-100 dark:bg-neutral-900 flex items-center justify-center">
                                <div className="text-center space-y-4 opacity-50">
                                    <Users className="w-20 h-20 mx-auto text-slate-400 dark:text-slate-600" />
                                    <p className="text-sm font-mono text-muted-foreground">Team NikiTuttoFare al lavoro</p>
                                </div>
                            </div>

                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                            <div className="absolute bottom-8 left-8 right-8 text-white">
                                <p className="font-medium text-lg">&quot;Ci mettiamo la faccia. Sempre.&quot;</p>
                                <p className="text-sm text-slate-300 mt-1">Il team tecnico operativo</p>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            {/* 3. I NOSTRI VALORI (E-E-A-T) */}
            <section className="py-24 px-6 bg-slate-50 dark:bg-[#0f0f0f] border-y border-border">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Perché Rimini si fida di noi</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                            Non siamo intermediari. Siamo specialisti radicati nel territorio.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Card 1: Velocità */}
                        <Card className="bg-card border-border p-8 hover:bg-accent/5 transition-all duration-300 hover:border-blue-500/30 group">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                                <Zap className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">Tecnologia + Umano</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                La nostra AI filtra le richieste in 30 secondi, ma è un tecnico in carne ed ossa a varcare la tua soglia. Velocità digitale, calore umano.
                            </p>
                        </Card>

                        {/* Card 2: Prezzi Chiari */}
                        <Card className="bg-card border-border p-8 hover:bg-accent/5 transition-all duration-300 hover:border-emerald-500/30 group">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                                <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">Prezzi Chiari 2026</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Nessuno ama le sorprese sul conto. Offriamo stime preventive basate su listini trasparenti e aggiornati. Paghi per il valore, non per l&apos;urgenza.
                            </p>
                        </Card>

                        {/* Card 3: Solo Romagna */}
                        <Card className="bg-card border-border p-8 hover:bg-accent/5 transition-all duration-300 hover:border-amber-500/30 group">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors">
                                <MapPin className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">DNA Romagnolo</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Conosciamo ogni via di Riccione e ogni ZTL di Rimini. Non ti mandiamo un tecnico da Bologna che si perde nel traffico del lungomare.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* 4. SOCIAL PROOF (Trust) */}
            <section className="py-20 px-6 border-b border-border bg-slate-100 dark:bg-[#0d0d0d]">
                <div className="container mx-auto max-w-4xl text-center">
                    <div className="flex justify-center gap-1 mb-6">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                        ))}
                    </div>
                    <blockquote className="text-2xl md:text-3xl font-medium text-foreground italic mb-8">
                        &quot;Finalmente un servizio che risponde subito. Alle 2 di notte mi hanno risolto un problema al quadro elettrico che mi teneva sveglia. Grazie Niki!&quot;
                    </blockquote>
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white text-lg">
                            M
                        </div>
                        <div className="text-left">
                            <p className="text-foreground font-bold">Maria L.</p>
                            <p className="text-muted-foreground text-sm">Cliente a Miramare di Rimini</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. AREE COPERTE (Local SEO Grid) */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="container mx-auto max-w-5xl relative z-10">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-foreground mb-4">Dove Siamo Operativi</h2>
                        <p className="text-muted-foreground">Interveniamo rapidamente in questi comuni della provincia.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['Rimini', 'Riccione', 'Cattolica', 'San Marino'].map((city) => (
                            <div key={city} className="bg-card border border-border rounded-2xl p-6 text-center hover:bg-accent/50 transition-colors group cursor-default">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                <span className="text-foreground font-bold text-lg">{city}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {['Misano Adriatico', 'Bellaria-Igea Marina', 'Santarcangelo', 'Verucchio', 'Coriano', 'Morciano'].map((city) => (
                            <Badge key={city} variant="secondary" className="px-4 py-2 text-muted-foreground font-normal text-sm">
                                {city}
                            </Badge>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-muted-foreground text-sm bg-blue-500/10 inline-block px-4 py-2 rounded-lg border border-blue-500/10">
                            🚀 Stiamo lavorando per espandere il servizio in altre zone della Romagna.
                        </p>
                    </div>
                </div>
            </section>

            {/* 6. CTA FINALE */}
            <section className="py-24 px-6 text-center bg-gradient-to-b from-background to-slate-100 dark:to-[#111]">
                <div className="container mx-auto max-w-3xl space-y-8">
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                        Non aspettare che il danno peggiori.
                    </h2>
                    <p className="text-xl text-muted-foreground">
                        Zero attese al telefono. Descrivi il problema in chat, ricevi una stima e il tecnico parte.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                        <Button
                            asChild
                            size="lg"
                            className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 py-6 text-lg font-bold transition-transform hover:scale-105 shadow-xl"
                        >
                            <Link href="/chat">
                                <Zap className="w-5 h-5 mr-2 fill-background" />
                                Risolvi Ora
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto bg-transparent border-2 border-slate-300 dark:border-slate-700 text-foreground hover:bg-foreground hover:text-background hover:border-foreground rounded-full px-8 py-6 text-lg transition-all"
                        >
                            <Link href="/login">
                                Area Clienti
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Link>
                        </Button>
                    </div>
                    <div className="pt-8 text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>Supporto attivo H24 per emergenze confermate.</span>
                    </div>
                </div>
            </section>

            <SiteFooter />
        </div>
    );
}
