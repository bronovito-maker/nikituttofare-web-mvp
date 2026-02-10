
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, MapPin, ShieldCheck, Zap, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RetroGrid } from '@/components/react-bits/RetroGrid';
import { fetchSeoData } from '@/lib/seo-data';

// Force static generation for these paths
export async function generateStaticParams() {
    const { cities } = await fetchSeoData();
    return cities.map((city) => ({
        city: city.slug,
    }));
}

export async function generateMetadata({ params }: { params: Promise<Readonly<{ city: string }>> }): Promise<Metadata> {
    const { cities } = await fetchSeoData();
    const resolvedParams = await params;
    const city = cities.find((c) => c.slug === resolvedParams.city);

    if (!city) return {};

    return {
        title: `Idraulico, Elettricista e Fabbro a ${city.name} | NikiTuttoFare`,
        description: `Cerchi un professionista a ${city.name}? Intervento rapido in 60 minuti per emergenze idrauliche, elettriche e serrature. Prezzi chiari e zero sorprese.`,
        alternates: {
            canonical: `https://nikituttofare.it/${city.slug}`,
        }
    };
}

export default async function CityPage({ params }: { params: Promise<Readonly<{ city: string }>> }) {
    const { cities, services } = await fetchSeoData();
    const resolvedParams = await params;
    const city = cities.find((c) => c.slug === resolvedParams.city);

    if (!city) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-background overflow-hidden selection:bg-blue-500/30">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 min-h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <RetroGrid />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
                </div>

                <div className="container relative z-10 max-w-4xl mx-auto text-center space-y-8">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 px-4 py-2 text-sm uppercase tracking-wider mb-4 animate-in fade-in zoom-in duration-700">
                        <MapPin className="w-4 h-4 mr-2" />
                        Servizio Attivo a {city.name} ({city.province})
                    </Badge>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-foreground tracking-tight leading-[1.1] animate-in slide-in-from-bottom-8 duration-700 delay-100">
                        Il tuo Tecnico di Fiducia a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 animate-gradient-x">{city.name}</span>.
                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom-8 duration-700 delay-200">
                        Pronto intervento H24 per emergenze e riparazioni.
                        Arriviamo in <strong className="text-foreground">60 minuti</strong> ovunque a {city.name}.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-in slide-in-from-bottom-8 duration-700 delay-300">
                        <Button asChild size="lg" className="h-14 px-8 rounded-full text-lg font-bold bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-105 transition-all duration-300">
                            <Link href="/chat">
                                <Zap className="w-5 h-5 mr-2 fill-current" />
                                Richiedi Intervento
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg font-medium border-border hover:bg-accent/50 backdrop-blur-sm">
                            <a href="tel:+390541000000"> {/* Placeholder Phone */}
                                <Phone className="w-5 h-5 mr-2" />
                                Chiama Ora
                            </a>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-24 px-6 bg-slate-50 dark:bg-[#0f0f0f] border-t border-border">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-foreground mb-4">Cosa possiamo fare a {city.name}?</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Seleziona il servizio di cui hai bisogno. I nostri tecnici sono locali e conoscono bene la zona.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {services.map((service) => (
                            <Link
                                key={service.slug}
                                href={`/${city.slug}/${service.slug}`}
                                className="group block"
                            >
                                <Card className="h-full p-6 border-border hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-950/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                                            <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors duration-300" />
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {service.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-2 italic flex-1">
                                        &quot;{service.examples}&quot;
                                    </p>
                                    <p className="text-[10px] uppercase tracking-widest text-blue-600/50 dark:text-blue-400/50 mt-4 font-bold">
                                        Disponibile a {city.name}
                                    </p>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Us / Trust Section (Reused/Simplified) */}
            <section className="py-24 px-6">
                <div className="container mx-auto max-w-4xl text-center space-y-12">
                    <div className="grid md:grid-cols-3 gap-8 text-left">
                        <div className="space-y-4">
                            <ShieldCheck className="w-10 h-10 text-emerald-500" />
                            <h4 className="text-xl font-bold">Garanzia 100%</h4>
                            <p className="text-muted-foreground text-sm">Se non ripariamo, non paghi. Tutti gli interventi sono garantiti per 12 mesi.</p>
                        </div>
                        <div className="space-y-4">
                            <MapPin className="w-10 h-10 text-indigo-500" />
                            <h4 className="text-xl font-bold">Tecnici Locali</h4>
                            <p className="text-muted-foreground text-sm">Siamo di qui. Conosciamo i quartieri di {city.name} e arriviamo prima.</p>
                        </div>
                        <div className="space-y-4">
                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">Visione 2026</Badge>
                            <h4 className="text-xl font-bold">Zero Attese</h4>
                            <p className="text-muted-foreground text-sm">La nostra AI gestisce la chiamata. Il tecnico parte subito.</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
