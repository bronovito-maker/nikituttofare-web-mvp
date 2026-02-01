'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FAQItem {
    question: string;
    answer: string;
}

interface FAQAccordionProps {
    readonly items: FAQItem[];
    readonly title: string;
    readonly subtitle: string;
    readonly sectionClassName?: string;
}

/**
 * Shared FAQ Accordion Component
 * Used by both landing page and technician registration page
 */
export function FAQAccordion({
    items,
    title,
    subtitle,
    sectionClassName = "bg-background"
}: FAQAccordionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className={`py-16 sm:py-24 ${sectionClassName}`}>
            <div className="max-w-3xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
                        {title}
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        {subtitle}
                    </p>
                </div>

                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div
                            key={item.question}
                            className="bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                            >
                                <span className="font-semibold text-foreground pr-4">{item.question}</span>
                                <ChevronDown
                                    className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'
                                    }`}
                            >
                                <div className="px-5 pb-5 text-muted-foreground leading-relaxed">
                                    {item.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
