
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, MapPin, Phone, ShieldCheck, Star, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { fetchSeoData } from '@/lib/seo-data';

// Generate all combinations of City + Service
export async function generateStaticParams() {
    const { cities, services } = await fetchSeoData();
    const params = [];

    for (const city of cities) {
        for (const service of services) {
            params.push({
                city: city.slug,
                service: service.slug,
            });
        }
    }
    return params;
}

export async function generateMetadata({ params }: { params: Promise<Readonly<{ city: string; service: string }>> }): Promise<Metadata> {
    const { cities, services } = await fetchSeoData();
    const resolvedParams = await params;
    const city = cities.find((c) => c.slug === resolvedParams.city);
    const service = services.find((s) => s.slug === resolvedParams.service);

    if (!city || !service) return {};

    return {
        title: `${service.name} a ${city.name} | Pronto Intervento in 60 min`,
        description: `Cerchi un ${service.name} a ${city.name}? NikiTuttoFare garantisce uscita immediata, preventivo chiaro e nessuna sorpresa. Chiama ora o scrivi in chat.`,
        alternates: {
            canonical: `https://nikituttofare.it/${city.slug}/${service.slug}`,
        }
    };
}

export default async function ServicePage({ params }: { params: Promise<Readonly<{ city: string; service: string }>> }) {
    const { cities, services } = await fetchSeoData();
    const resolvedParams = await params;
    const city = cities.find((c) => c.slug === resolvedParams.city);
    const service = services.find((s) => s.slug === resolvedParams.service);

    if (!city || !service) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-background selection:bg-orange-500/30">
            {/* Urgent Hero Section */}
            <section className="relative pt-32 pb-20 px-6 min-h-[70vh] flex items-center justify-center overflow-hidden bg-[#0f0f0f]">
                {/* Background Effects */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 blur-[100px] rounded-full animate-pulse" />
                    <div className="absolute inset-0 bg-grid-white/[0.02]" />
                </div>

                <div className="container relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center space-y-8">

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 animate-in fade-in zoom-in duration-500">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                        <span className="font-bold text-sm tracking-wide uppercase">Tecnici Attivi Ora a {city.name}</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] animate-in slide-in-from-bottom-8 duration-700 delay-100">
                        Ti serve un <span className="text-blue-500">{service.name}</span>?
                        <br />
                        <span className="text-white">Arriviamo in 60 minuti.</span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom-8 duration-700 delay-200">
                        Nessun call center. Nessuna attesa.
                        <br />
                        Solo professionisti certificati che operano a <strong className="text-white">{city.name}</strong> e provincia.
                    </p>

                    <Card className="p-6 bg-slate-900/50 border-slate-800 backdrop-blur-md max-w-3xl w-full mt-8 animate-in slide-in-from-bottom-8 duration-700 delay-300">
                        <div className="grid md:grid-cols-3 gap-6 text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <ClockIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-white">Rapido</p>
                                    <p className="text-xs text-slate-400">Intervento in 1h</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-white">Garantito</p>
                                    <p className="text-xs text-slate-400">12 mesi garanzia</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                                    <BadgeEuroIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-white">Onesto</p>
                                    <p className="text-xs text-slate-400">Preventivo prima</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full max-w-md animate-in slide-in-from-bottom-8 duration-700 delay-400">
                        <Button asChild size="lg" className="h-16 w-full rounded-2xl text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-900/20 hover:scale-[1.02] transition-all">
                            <Link href="/chat">
                                <Zap className="w-6 h-6 mr-3 fill-current" />
                                Parla con NikiBot
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-16 w-full rounded-2xl text-xl font-bold bg-white text-slate-900 border-white hover:bg-slate-200 hover:text-slate-900">
                            <a href="tel:+390541000000">
                                <Phone className="w-6 h-6 mr-3 fill-slate-900" />
                                Chiama (+39)
                            </a>
                        </Button>
                    </div>
                    <p className="text-sm text-slate-500 animate-in fade-in duration-1000 delay-500">
                        *L&apos;intelligenza artificiale ti risponde subito, il tecnico arriva dopo.
                    </p>
                </div>
            </section>

            {/* Why Local Section */}
            <section className="py-24 px-6 bg-slate-50 dark:bg-[#111]">
                <div className="container mx-auto max-w-4xl">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider text-sm mb-6">
                        <MapPin className="w-4 h-4" />
                        Perché scegliere noi a {city.name}
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-12">
                        Non chiamare il primo numero che trovi su Google.
                    </h2>

                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                A {city.name} è pieno di &quot;tuttofare&quot; improvvisati. Noi di NikiTuttoFare selezioniamo solo <strong>{service.name.toLowerCase()}</strong> con almeno 5 anni di esperienza e P.IVA verificata.
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Che sia Centro Storico, {city.province === 'RN' ? 'Marina Centro' : 'Periferia'} o nell&apos;entroterra, i nostri furgoni sono già in zona. Questo significa <strong>zero costi di uscita</strong> se accetti il preventivo.
                            </p>
                            <ul className="space-y-3 pt-4">
                                {[
                                    `Tecnici residenti a ${city.name} o limitrofi`,
                                    'Attrezzatura professionale a bordo',
                                    'Pezzi di ricambio originali',
                                    'Ricevuta fiscale immediata'
                                ].map((item, i) => (
                                    <li key={item} className="flex items-center gap-3 font-medium text-foreground">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative h-[400px] rounded-3xl overflow-hidden bg-slate-200 dark:bg-slate-800 shadow-2xl">
                            {/* Placeholder Map/Image */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-slate-400 font-mono text-sm">Mappa Copertura {city.name}</span>
                            </div>
                            <div className="absolute bottom-6 left-6 right-6 bg-white dark:bg-slate-900/90 backdrop-blur p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-lg">
                                <div className="flex items-center gap-4">
                                    <div className="bg-emerald-100 dark:bg-emerald-500/20 p-3 rounded-full">
                                        <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground">Copertura Totale</p>
                                        <p className="text-xs text-muted-foreground">Serviamo tutti i CAP di {city.name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Review/Trust Strip */}
            <section className="py-20 border-y border-border bg-background">
                <div className="container mx-auto max-w-6xl text-center">
                    <div className="flex justify-center gap-1 mb-6">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                        ))}
                    </div>
                    <h3 className="text-2xl font-bold mb-4">&quot;Il miglior {service.name.toLowerCase()} a {city.name} che abbia mai chiamato&quot;</h3>
                    <p className="text-muted-foreground">Basato su oltre 500 interventi in Romagna nel 2024</p>
                </div>
            </section>
        </main>
    );
}

function ClockIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}

function BadgeEuroIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.78" />
            <path d="M12 7v10" />
            <path d="M8.5 13.5A1.5 1.5 0 0 1 10 12h4" />
            <path d="M8.5 10.5A1.5 1.5 0 0 1 10 12" />
        </svg>
    )
}
