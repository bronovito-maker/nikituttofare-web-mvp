import { HandymanHero } from '@/components/landing/handyman-hero';
import { HandymanMidSection } from '@/components/landing/handyman-mid-section';
import { HandymanFooter } from '@/components/landing/handyman-footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Riparazioni Casa Rimini - Tuttofare Niki',
    description: 'Risolvo tutto ciò che in casa non funziona. Interventi rapidi a Rimini, Riccione e dintorni. Un solo intervento, più problemi risolti.',
};

export default function HandymanPage() {
    return (
        <main className="bg-[#0a0a0a] min-h-screen">
            <HandymanHero />
            <HandymanMidSection />
            <HandymanFooter />
        </main>
    );
}
