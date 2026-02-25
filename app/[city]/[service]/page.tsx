import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { StickyActionNav } from '@/components/landing/sticky-action-nav';
import { HeroContent } from '@/components/landing/hero-content';
import { SmallJobsCallout } from '@/components/landing/small-jobs-callout';
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
const TrustBadges = dynamic(() => import('@/components/landing/trust-badges').then(mod => mod.TrustBadges), {
    loading: () => <div className="min-h-[200px]" />
});
const FAQSection = dynamic(() => import('@/components/landing/faq-section').then(mod => mod.FAQSection), {
    loading: () => <div className="min-h-[600px]" />
});
const RelatedServices = dynamic(() => import('@/components/landing/related-services').then(mod => ({ default: mod.RelatedServices })), {
    loading: () => <div className="min-h-[400px]" />
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
        title: `${service.name} a ${city.name} - Rapido, Onesto e Pulito | NikiTuttoFare`,
        description: `Hai un'urgenza con ${service.name} a ${city.name}? Nikita interviene in tempi brevi con prezzi trasparenti e massima pulizia. Leggi le recensioni a 5 stelle e contattami ora!`,
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
        <div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-blue-100 dark:selection:bg-blue-900 pb-20 sm:pb-0">

            {/* --- SITE HEADER --- */}
            <SiteHeader cityName={city.name} />

            <main className="flex-1">

                {/* --- HERO SECTION --- */}
                <section className="relative py-12 sm:py-20 lg:py-32 px-4 sm:px-6 overflow-hidden">
                    <div className="relative max-w-6xl mx-auto">
                        {/* Deterministic selection of variant and neighborhood based on slugs to avoid duplicate content */}
                        {(() => {
                            const hash = (resolvedParams.city.length + resolvedParams.service.length) % service.variants.length;
                            const neighborhoodHash = (resolvedParams.city.length * 3 + resolvedParams.service.length) % city.neighborhoods.length;
                            return (
                                <HeroContent
                                    cityName={city.name}
                                    serviceName={service.name}
                                />
                            );
                        })()}
                    </div>
                </section>

                {/* --- URGENCY STATS --- */}
                <UrgencyStats cityName={city.name} />

                {/* --- USER-SPECIFIC SECTIONS (Residential/Business) --- */}
                <UserSpecificSections />


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


                {/* --- FAQ --- */}
                <div className="min-h-[600px]">
                    <FAQSection />
                </div>

                {/* --- SMALL JOBS CALLOUT --- */}
                <SmallJobsCallout />

                {/* --- DIRECT CONTACT --- */}
                <div className="min-h-[300px]">
                    <DirectContact />
                </div>

                {/* --- RELATED SERVICES --- */}
                <RelatedServices
                    cityName={city.name}
                    citySlug={city.slug}
                    currentServiceSlug={service.slug}
                />

                {/* --- COMMON FEATURES --- */}
                <CommonFeatures />

            </main>

            {/* --- MOBILE THUMB ZONE NAV --- */}
            <StickyActionNav />

            {/* FOOTER PREMIUM */}
            <SiteFooter />

            {/* --- SCHEMA MARKUP (SEO TECNICA) --- */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": service.schemaType || "HandymanService",
                        "name": `NikiTuttofare - ${service.name} a ${city.name}`,
                        "image": "https://nikituttofare.it/team-photo.png",
                        "@id": `https://nikituttofare.it/${city.slug}/${service.slug}`,
                        "url": `https://nikituttofare.it/${city.slug}/${service.slug}`,
                        "telephone": "3461027447",
                        "priceRange": "€€",
                        "address": {
                            "@type": "PostalAddress",
                            "addressLocality": city.name,
                            "addressRegion": city.province,
                            "addressCountry": "IT"
                        },
                        "areaServed": {
                            "@type": "City",
                            "name": city.name
                        },
                        "provider": {
                            "@type": "LocalBusiness",
                            "name": "NikiTuttofare",
                            "telephone": "3461027447"
                        }
                    })
                }}
            />
        </div>
    );
}
