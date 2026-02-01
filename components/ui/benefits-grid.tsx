'use client';

import { LucideIcon } from 'lucide-react';

export interface BenefitItem {
    readonly icon: LucideIcon;
    readonly title: string;
    readonly description: string;
    readonly color: string;
    readonly bgColor: string;
}

interface BenefitsGridProps {
    readonly items: readonly BenefitItem[];
    readonly title: React.ReactNode;
    readonly subtitle: string;
    readonly sectionClassName?: string;
}

/**
 * Shared Benefits Grid Component
 * Used by WhyChooseUs and TechnicianBenefits
 */
export function BenefitsGrid({
    items,
    title,
    subtitle,
    sectionClassName = "bg-background"
}: BenefitsGridProps) {
    return (
        <section className={`py-16 sm:py-24 ${sectionClassName}`}>
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
                        {title}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        {subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((benefit) => {
                        const Icon = benefit.icon;
                        return (
                            <div
                                key={benefit.title}
                                className="group p-6 bg-card rounded-2xl border border-border hover:border-accent transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${benefit.bgColor} mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className={`w-6 h-6 ${benefit.color}`} />
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-2">{benefit.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
