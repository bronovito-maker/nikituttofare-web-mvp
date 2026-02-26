'use client';

import { Zap, ShieldCheck, FileCheck, Smartphone, Star as StarIcon } from 'lucide-react';
import { BenefitsGrid, type BenefitItem } from '@/components/ui/benefits-grid';

const BENEFITS: readonly BenefitItem[] = [
    {
        icon: FileCheck,
        title: 'Onestà Certificata',
        description: 'Uso il listino prezzi ufficiale per garantirti la massima trasparenza. Niente prezzi inventati sul momento: sai sempre quanto spendi prima di iniziare.',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
    },
    {
        icon: ShieldCheck,
        title: 'Pulizia e Rispetto',
        description: 'Entro in casa tua con il massimo rispetto. Al termine di ogni intervento, lascio tutto pulito e ordinato. La tua casa merita cura, non disordine.',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
    {
        icon: Zap,
        title: 'Velocità Locale',
        description: 'Conoscendo bene Rimini, Riccione e dintorni, riesco a garantirti un intervento entro 2 ore per le emergenze. Sono il tuo vicino di casa esperto di fiducia.',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
    },
];

export function WhyChooseUs() {
    return (
        <div className="relative">
            <BenefitsGrid
                items={BENEFITS}
                title={
                    <div className="flex flex-col items-center gap-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-full">
                            <StarIcon className="w-3 h-3 text-blue-600 fill-blue-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400">Artigiano 4.0</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
                            Perché affidarti a me?
                        </h2>
                    </div>
                }
                subtitle="Dimentica i soliti call center. Per ogni guasto in casa, hai un professionista romagnolo che ci mette la faccia."
            />
        </div>
    );
}
