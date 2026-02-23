'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle2, Star, Users } from 'lucide-react';

interface StatCounterProps {
    readonly end: number;
    readonly suffix?: string;
    readonly prefix?: string;
    readonly duration?: number;
}

function StatCounter({ end, suffix = '', prefix = '', duration = 2000 }: StatCounterProps) {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(easeOutQuart * end));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [isVisible, end, duration]);

    return (
        <span ref={ref} className="tabular-nums">
            {prefix}{count.toLocaleString('it-IT')}{suffix}
        </span>
    );
}

const STATS = [
    {
        icon: CheckCircle2,
        value: 2926,
        suffix: '+',
        label: 'Interventi Completati',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
    },
    {
        icon: Clock,
        value: 45,
        suffix: ' min',
        label: 'Tempo Medio Arrivo',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
    {
        icon: Star,
        value: 4.9,
        suffix: '★',
        label: 'Rating Medio',
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        isDecimal: true,
    },
    {
        icon: Users,
        value: 1,
        suffix: '',
        label: "Pronto all'Intervento",
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        pulse: true,
    },
];

const START_DATE = new Date('2026-02-08T22:00:00Z');
const BASE_INTERVENTIONS = 69;
const HOURS_INCREMENT = 12;

interface UrgencyStatsProps {
    readonly cityName?: string;
}

export function UrgencyStats({ cityName }: UrgencyStatsProps) {
    const [stats, setStats] = useState(STATS);

    useEffect(() => {
        const updateDynamicStats = () => {
            const now = new Date();
            const diffMs = now.getTime() - START_DATE.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            const increment = Math.max(0, Math.floor(diffHours / HOURS_INCREMENT));
            const currentInterventions = BASE_INTERVENTIONS + increment;

            setStats(prev => prev.map(s => {
                if (s.label === 'Interventi Completati' || s.label.startsWith('Interventi a')) {
                    return {
                        ...s,
                        value: currentInterventions,
                        label: cityName ? `Interventi a ${cityName}` : 'Interventi Completati'
                    };
                }
                return s;
            }));
        };

        updateDynamicStats();
        // Check every hour to keep it fresh
        const interval = setInterval(updateDynamicStats, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, [cityName]);

    return (
        <div className="w-full py-10 sm:py-16">
            <div className="max-w-6xl mx-auto px-4 space-y-8 sm:space-y-12">
                {/* Nikita Live Status Bar - Personal & Friendly */}
                <div className="relative group overflow-hidden bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/50 rounded-3xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-shrink-0">
                                <span className="relative flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 shadow-sm border-2 border-white dark:border-slate-900"></span>
                                </span>
                            </div>
                            <p className="text-emerald-900 dark:text-emerald-100 font-bold text-base sm:text-lg leading-tight text-center md:text-left">
                                Nikita è operativo: <span className="font-medium opacity-90">oggi sono tra Rimini e Riccione. Scrivimi ora per un intervento rapido!</span>
                            </p>
                        </div>

                        <button
                            onClick={() => document.getElementById('chat-trigger')?.click()}
                            className="w-full md:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                        >
                            Controlla disponibilità
                        </button>
                    </div>

                    {/* Subtle design element */}
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CheckCircle2 className="w-32 h-32 text-emerald-600" />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={stat.label}
                                className="group relative bg-card rounded-2xl border border-border p-4 sm:p-6 text-center transition-all duration-300 hover:shadow-lg hover:border-accent hover:-translate-y-1"
                            >
                                {/* Pulse effect for online technicians */}
                                {stat.pulse && (
                                    <div className="absolute top-3 right-3">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                        </span>
                                    </div>
                                )}

                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${stat.bgColor} mb-3 group-hover:scale-110 transition-transform`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>

                                <div className="text-2xl sm:text-3xl font-black text-foreground mb-1">
                                    {stat.isDecimal ? (
                                        <span className="tabular-nums">{stat.value}{stat.suffix}</span>
                                    ) : (
                                        <StatCounter end={stat.value} suffix={stat.suffix} />
                                    )}
                                </div>

                                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                                    {stat.label}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
