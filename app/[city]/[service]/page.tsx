import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { StickyActionNav } from '@/components/landing/sticky-action-nav';
import { UserTypeProvider } from '@/components/landing/user-type-context';
import { HeroContent } from '@/components/landing/hero-content';
import { fetchSeoData } from '@/lib/seo-data';

// Lazy load below-the-fold sections
const UrgencyStats = dynamic(() => import('@/components/landing/urgency-stats').then(mod => ({ default: mod.UrgencyStats })), {
    loading: () => <div className="min-h-[200px]" />
});
const UserSpecificSections = dynamic(() => import('@/components/landing/user-specific-sections').then(mod => ({ default: mod.UserSpecificSections })), {
    loading: () => <div className="min-h-[400px]" />
});
const CommonFeatures = dynamic(() => import('@/components/landing/common-features').then(mod => ({ default: mod.CommonFeatures })), {
    loading: () => <div className="min-h-[600px]" />
});
const HowItWorks = dynamic(() => import('@/components/landing/how-it-works').then(mod => mod.HowItWorks), {
    loading: () => <div className="min-h-[500px]" />
});
const DirectContact = dynamic(() => import('@/components/landing/direct-contact').then(mod => mod.DirectContact), {
    loading: () => <div className="min-h-[300px]" />
});
const TestimonialCarousel = dynamic(() => import('@/components/landing/testimonial-carousel').then(mod => mod.TestimonialCarousel), {
    loading: () => <div className="min-h-[400px]" />
});
const WhyChooseUs = dynamic(() => import('@/components/landing/why-choose-us').then(mod => mod.WhyChooseUs), {
    loading: () => <div className="min-h-[600px]" />
});
const TechnicianCTA = dynamic(() => import('@/components/landing/technician-cta').then(mod => mod.TechnicianCTA), {
    loading: () => <div className="min-h-[400px]" />
});
const TrustBadges = dynamic(() => import('@/components/landing/trust-badges').then(mod => mod.TrustBadges), {
    loading: () => <div className="min-h-[200px]" />
});
const FAQSection = dynamic(() => import('@/components/landing/faq-section').then(mod => mod.FAQSection), {
    loading: () => <div className="min-h-[600px]" />
});
const ServicesGrid = dynamic(() => import('@/components/landing/services-grid').then(mod => ({ default: mod.ServicesGrid })), {
    loading: () => <div className="min-h-[600px]" />
});

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
        <UserTypeProvider>
            <div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-blue-100 dark:selection:bg-blue-900 pb-20 sm:pb-0">

                {/* --- SITE HEADER --- */}
                <SiteHeader showUserTypeToggle={true} cityName={city.name} />

                <main className="flex-1">

                    {/* --- HERO SECTION --- */}
                    <section className="relative py-12 sm:py-20 lg:py-32 px-4 sm:px-6 overflow-hidden">
                        <div className="relative max-w-6xl mx-auto">
                            <HeroContent cityName={city.name} serviceName={service.name} />
                        </div>
                    </section>

                    {/* --- URGENCY STATS --- */}
                    <UrgencyStats cityName={city.name} />

                    {/* --- USER-SPECIFIC SECTIONS (Residential/Business) --- */}
                    <UserSpecificSections />

                    {/* --- TERRA-TERRA SERVICES GRID --- */}
                    <ServicesGrid />

                    {/* --- HOW IT WORKS --- */}
                    <div className="min-h-[500px]">
                        <HowItWorks />
                    </div>

                    {/* --- TESTIMONIALS --- */}
                    <div className="min-h-[400px]">
                        <TestimonialCarousel />
                    </div>

                    {/* --- WHY CHOOSE US --- */}
                    <div className="min-h-[600px]">
                        <WhyChooseUs />
                    </div>

                    {/* --- TRUST BADGES --- */}
                    <div className="min-h-[200px]">
                        <TrustBadges />
                    </div>

                    {/* --- TECHNICIAN CTA --- */}
                    <div className="min-h-[400px]">
                        <TechnicianCTA />
                    </div>

                    {/* --- FAQ --- */}
                    <div className="min-h-[600px]">
                        <FAQSection />
                    </div>

                    {/* --- DIRECT CONTACT --- */}
                    <div className="min-h-[300px]">
                        <DirectContact />
                    </div>

                    {/* --- COMMON FEATURES --- */}
                    <CommonFeatures />

                </main>

                {/* --- MOBILE THUMB ZONE NAV --- */}
                <StickyActionNav />

                {/* FOOTER PREMIUM */}
                <SiteFooter />
            </div>
        </UserTypeProvider>
    );
}
