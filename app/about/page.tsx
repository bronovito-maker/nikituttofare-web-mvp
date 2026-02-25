import { Metadata } from 'next';
import Link from 'next/link';

import { RetroGrid } from '@/components/react-bits/RetroGrid';
import { BlurText } from '@/components/react-bits/BlurText';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    MapPin,
    ShieldCheck,
    Zap,
    CheckCircle2,
    ArrowRight,
    Star,
    Phone
} from 'lucide-react';

import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export const metadata: Metadata = {
    title: 'Idraulico e Elettricista a Rimini e Riccione | Chi Sono - NikiTuttoFare',
    description: 'NikiTuttoFare nasce nel 2022 per risolvere le urgenze domestiche in Romagna. Tecnico locale, prezzi chiari e intervento H24. Scopri la mia storia.',
};

export default function AboutPage() {
    // JSON-LD Structured Data for LocalBusiness (HomeAndConstructionBusiness)
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'HomeAndConstructionBusiness',
        name: 'NikiTuttoFare',
        alternateName: 'NikiTuttoFare Pronto Intervento',
        description: 'Servizio di pronto intervento H24 per emergenze idrauliche ed elettriche a Rimini, Riccione e provincia. Tecnico certificato locale.',
        url: 'https://nikituttofare.it/about',
        logo: 'https://nikituttofare.it/logo.png',
        telephone: '+393461027447',
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
            latitude: '44.0609',
            longitude: '12.5665'
        },
        address: {
            '@type': 'PostalAddress',
            addressLocality: 'Rimini',
            addressRegion: 'RN',
            addressCountry: 'IT'
        },
        founder: {
            '@type': 'Person',
            name: 'Nikita Bronovs'
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <SiteHeader />

            {/* 1. HERO SECTION (Emotional & Local SEO) */}
            <section className="relative min-h-[60vh] md:min-h-[75vh] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                <RetroGrid className="opacity-30 dark:opacity-20" />

                <div className="relative z-10 max-w-5xl space-y-4 animate-in fade-in zoom-in duration-1000">
                    <div className="space-y-4 py-8 md:py-16">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-tight text-center px-4">
                            Chi Sono
                        </h1>

                        <div className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-[1.1]">
                            <BlurText
                                text="Dimentica i soliti call center."
                                className="text-foreground drop-shadow-2xl"
                                delay={0.15}
                            />
                        </div>
                        <p className="text-xl md:text-3xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed text-balance">
                            Sono il tuo vicino di casa esperto.
                            <br className="hidden md:block" />
                            Nato a Livorno e cresciuto in <span className="text-foreground font-bold underline decoration-blue-500/50 underline-offset-4">Romagna</span>.
                        </p>
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
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

                <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
            </section>

            {/* 2. LA MIA STORIA (Trust & Experience) - Two Column Layout */}
            <article className="py-16 md:py-24 px-4 md:px-6 relative">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Left: Content */}
                        <div className="space-y-8 order-2 md:order-1">
                            <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase text-sm">
                                <span className="w-8 h-[2px] bg-blue-600 dark:bg-blue-500"></span>
                                <span className="ml-2">La mia Storia</span>
                            </div>

                            <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
                                Nato da un&apos;emergenza a Ferragosto.
                            </h2>

                            <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                                <p>
                                    Era il 15 agosto 2022 a <strong className="text-foreground">Livorno</strong>. Mi ritrovai con la casa allagata e nessun idraulico disponibile nel raggio di 50km. Solo segreterie telefoniche o call center anonimi che promettevano richiamate mai arrivate.
                                </p>
                                <p className="border-l-4 border-blue-500 pl-6 italic text-foreground/80">
                                    &quot;È possibile che nel 2022 sia così difficile trovare una persona onesta che ti aiuti in un&apos;emergenza?&quot;
                                </p>
                                <p>
                                    Da quella frustrazione è nato <strong className="text-foreground font-semibold">NikiTuttoFare</strong>. Oggi porto quella stessa filosofia in Riviera Romagnola: eliminare l&apos;ansia dell&apos;attesa e offrire un volto amico, non un centralino.
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

                        {/* Right: Visual / Image Real */}
                        <div className="order-1 md:order-2 relative h-auto aspect-[4/5] md:aspect-[3/4] w-full max-w-sm lg:max-w-md mx-auto rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-blue-900/10 border border-border transition-transform hover:scale-[1.01]">
                            <Image
                                src="/team-photo.png"
                                alt="Nikita Bronovs - NikiTuttoFare"
                                fill
                                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                                sizes="(max-width: 768px) 100vw, 500px"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6 text-white z-20">
                                <p className="font-bold text-xl leading-tight">Nikita Bronovs</p>
                                <p className="text-sm text-white/80 font-normal leading-snug">Il Tuo Tecnico di Fiducia</p>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            {/* 3. I MIEI VALORI (E-E-A-T) */}
            <section className="py-20 md:py-24 px-4 md:px-6 bg-slate-50 dark:bg-[#0f0f0f] border-y border-border">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-black text-foreground">Perché Rimini si fida di me</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                            Non sono un intermediario. Sono un tecnico specializzato radicato nel territorio.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Card 1: Velocità */}
                        <Card className="bg-card border-border p-8 hover:bg-accent/5 transition-all duration-300 hover:border-blue-500/30 group">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                                <Zap className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">Tecnologia + Umano</h3>
                            <p className="text-muted-foreground leading-relaxed italic">
                                &quot;La mia AI filtra le richieste in 30 secondi, ma sono io in carne ed ossa a varcare la tua soglia. Velocità digitale, calore umano.&quot;
                            </p>
                        </Card>

                        {/* Card 2: Prezzi Chiari */}
                        <Card className="bg-card border-border p-8 hover:bg-accent/5 transition-all duration-300 hover:border-emerald-500/30 group">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                                <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">Prezzi Chiari</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Nessuno ama le sorprese sul conto. Offro stime preventive basate su listini trasparenti e aggiornati. Paghi per il valore, non per l&apos;urgenza.
                            </p>
                        </Card>

                        {/* Card 3: Solo Romagna */}
                        <Card className="bg-card border-border p-8 hover:bg-accent/5 transition-all duration-300 hover:border-amber-500/30 group">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors">
                                <MapPin className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">DNA Romagnolo</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Conosco ogni via di Riccione e ogni ZTL di Rimini. Non ti mando un tecnico da fuori che si perde nel traffico. Abito e lavoro qui.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* 4. SOCIAL PROOF (Trust) */}
            <section className="py-20 px-4 md:px-6 border-b border-border bg-slate-100 dark:bg-[#0d0d0d]">
                <div className="container mx-auto max-w-4xl text-center">
                    <div className="flex justify-center gap-1 mb-6">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                        ))}
                    </div>
                    <blockquote className="text-2xl md:text-3xl font-medium text-foreground italic mb-8 text-balance">
                        &quot;Finalmente un servizio che risponde subito. Alle 2 di notte Nikita mi ha risolto un problema al quadro elettrico che mi teneva sveglia. Grazie!&quot;
                    </blockquote>
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white text-lg">
                            M
                        </div>
                        <div className="text-left">
                            <p className="text-foreground font-bold">Maria L.</p>
                            <p className="text-muted-foreground text-sm">Cliente a Rimini</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. CTA FINALE */}
            <section className="py-20 md:py-32 px-4 md:px-6 text-center bg-gradient-to-b from-background to-slate-100 dark:to-[#111]">
                <div className="container mx-auto max-w-3xl space-y-8">
                    <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tight">
                        Risolviamo subito.
                    </h2>
                    <p className="text-xl text-muted-foreground">
                        Zero attese al telefono. Descrivi il problema in chat, ricevi la stima e arrivo.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                        <Button
                            asChild
                            size="lg"
                            className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 rounded-full px-10 py-7 text-xl font-bold transition-all hover:scale-105 shadow-2xl"
                        >
                            <Link href="/chat">
                                <Zap className="w-5 h-5 mr-2 fill-background" />
                                Risolvi Ora
                            </Link>
                        </Button>
                    </div>
                    <div className="pt-8 text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>Supporto diretto H24 Rimini & Riccione</span>
                    </div>
                </div>
            </section>

            <SiteFooter />
        </div>
    );
}
