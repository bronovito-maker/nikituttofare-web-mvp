'use client';

import { Shield, Server, Eye, BadgeCheck } from 'lucide-react';

const BADGES = [
    {
        icon: Shield,
        title: 'Dati Protetti',
        subtitle: 'Row Level Security',
    },
    {
        icon: Server,
        title: 'Infrastruttura Sicura',
        subtitle: 'Powered by Supabase',
    },
    {
        icon: Eye,
        title: 'Monitoraggio 24/7',
        subtitle: 'Sentry Error Tracking',
    },
    {
        icon: BadgeCheck,
        title: 'Assicurazione',
        subtitle: 'Copertura fino a 1M€',
    },
];

export function TrustBadges() {
    return (
        <section className="py-8 sm:py-12 bg-card/50 border-y border-border">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-12">
                    {BADGES.map((badge) => {
                        const Icon = badge.icon;
                        return (
                            <div
                                key={badge.title}
                                className="flex items-center gap-3 text-center sm:text-left"
                            >
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{badge.title}</p>
                                    <p className="text-xs text-muted-foreground">{badge.subtitle}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
