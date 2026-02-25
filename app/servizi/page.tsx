import { ServicesGrid } from '@/components/landing/services-grid';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { StickyActionNav } from '@/components/landing/sticky-action-nav';

export const metadata = {
    title: 'Come posso aiutarti | Tutti i Servizi di NikiTuttoFare',
    description: 'Dall\'idraulica all\'elettricità, scopri tutti i piccoli e grandi problemi che posso risolvere per te in Riviera Romagnola.',
};

export default function ServicesPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
            <SiteHeader />

            <main className="flex-1">
                {/* The ServicesGrid already has a clean section wrap and title */}
                <ServicesGrid />

                {/* Additional trust section for the dedicated services page */}
                <section className="py-16 px-4 bg-blue-600 text-white">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <h2 className="text-3xl font-black">Non trovi quello che cerchi?</h2>
                        <p className="text-xl opacity-90">
                            La lista è lunga, ma la mia disponibilità lo è di più. Descrivimi il tuo problema in chat,
                            se posso aiutarti ti darò un preventivo in pochi minuti.
                        </p>
                        <div className="pt-4">
                            <a
                                href="/chat"
                                className="inline-flex h-14 px-10 items-center justify-center rounded-full bg-white text-blue-600 font-bold text-lg hover:scale-105 transition-transform"
                            >
                                Parla con Niki
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <StickyActionNav />
            <SiteFooter />
        </div>
    );
}
