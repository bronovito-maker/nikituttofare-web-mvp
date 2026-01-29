import { Metadata } from 'next';
import Link from 'next/link';
import { fetchSeoData } from '@/lib/seo-data';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { MapPin, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Zone Coperte - NikiTuttoFare | Idraulico e Elettricista in Romagna',
    description: 'Indice completo delle zone coperte da NikiTuttoFare. Trova il tecnico più vicino a te a Rimini, Riccione e dintorni.',
};

export default async function ZoneIndexPage() {
    const { cities, services } = await fetchSeoData();

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <SiteHeader />

            <main className="container mx-auto px-4 py-16 max-w-7xl">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Dove Siamo Operativi
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        La nostra rete di tecnici specializzati copre capillarmente la provincia di Rimini e la Repubblica di San Marino.
                    </p>
                </div>

                <div className="grid gap-12">
                    {cities.map((city) => (
                        <Card key={city.slug} className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="border-b border-border bg-muted/30 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-bold">
                                                {city.name}
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">
                                                {city.province}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/${city.slug}`}
                                        className="hidden sm:inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                                    >
                                        Vedi pagina città <ArrowRight className="ml-1 w-4 h-4" />
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {services.map((service) => (
                                        <Link
                                            key={`${city.slug}-${service.slug}`}
                                            href={`/${city.slug}/${service.slug}`}
                                            className="group flex items-center justify-between p-3 rounded-lg border border-border hover:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
                                        >
                                            <span className="text-sm font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                {service.name}
                                            </span>
                                            <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
