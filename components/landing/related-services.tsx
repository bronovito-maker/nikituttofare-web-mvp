import Link from 'next/link';
import { SEO_SERVICES } from '@/lib/seo-data';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface RelatedServicesProps {
    cityName: string;
    citySlug: string;
    currentServiceSlug: string;
}

export function RelatedServices({ cityName, citySlug, currentServiceSlug }: RelatedServicesProps) {
    // Filter out the current service
    const otherServices = SEO_SERVICES.filter(service => service.slug !== currentServiceSlug);

    return (
        <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/50 border-y border-border">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-4">
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tighter">
                            Altri servizi a <span className="text-orange-500">{cityName}</span>
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                            Nikita è il punto di riferimento a {cityName} per ogni piccola e grande riparazione domestica. Scopri cos&apos;altro possiamo fare per te.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {otherServices.map((service) => (
                        <Link
                            key={service.slug}
                            href={`/${citySlug}/${service.slug}`}
                            className="group block p-6 bg-card hover:bg-orange-500 transition-all duration-300 rounded-2xl border border-border hover:border-orange-400 hover:shadow-xl hover:shadow-orange-500/10"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                                    {getServiceEmoji(service.slug)}
                                </span>
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>
                            <h3 className="text-xl font-bold group-hover:text-white transition-colors">
                                {service.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-2 group-hover:text-white/80 line-clamp-2">
                                Assistenza rapida e professionale a {cityName}.
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

function getServiceEmoji(slug: string): string {
    const emojis: Record<string, string> = {
        'idraulico': '🚰',
        'elettricista': '⚡',
        'fabbro': '🔑',
        'tapparellista': '🪟',
        'condizionamento': '❄️',
        'caldaie': '🔥',
        'spurgo': '🚜',
        'antennista': '📡'
    };
    return emojis[slug] || '⚒️';
}
