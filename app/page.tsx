import dynamic from 'next/dynamic';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { StickyActionNav } from '@/components/landing/sticky-action-nav';
import { UrgencyStats } from '@/components/landing/urgency-stats';
import { UserTypeProvider } from '@/components/landing/user-type-context';
import { HeroContent } from '@/components/landing/hero-content';
import { UserSpecificSections } from '@/components/landing/user-specific-sections';
import { CommonFeatures } from '@/components/landing/common-features';
import { RetroGridWrapper } from '@/components/landing/retro-grid-wrapper';

// Dynamic imports for below-the-fold components (non-critical)
const HowItWorks = dynamic(() => import('@/components/landing/how-it-works').then(mod => mod.HowItWorks));
const DirectContact = dynamic(() => import('@/components/landing/direct-contact').then(mod => mod.DirectContact));
const TestimonialCarousel = dynamic(() => import('@/components/landing/testimonial-carousel').then(mod => mod.TestimonialCarousel));
const WhyChooseUs = dynamic(() => import('@/components/landing/why-choose-us').then(mod => mod.WhyChooseUs));
const TechnicianCTA = dynamic(() => import('@/components/landing/technician-cta').then(mod => mod.TechnicianCTA));
const TrustBadges = dynamic(() => import('@/components/landing/trust-badges').then(mod => mod.TrustBadges));
const FAQSection = dynamic(() => import('@/components/landing/faq-section').then(mod => mod.FAQSection));

export default function Home() {
  return (
    <UserTypeProvider>
      <div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-blue-100 dark:selection:bg-blue-900 pb-20 sm:pb-0">

        {/* --- SITE HEADER --- */}
        <SiteHeader showUserTypeToggle={true} />

        <main className="flex-1">

          {/* --- HERO SECTION --- */}
          <section className="relative py-12 sm:py-20 lg:py-32 px-4 sm:px-6 overflow-hidden">
            <RetroGridWrapper className="absolute inset-0 z-0 opacity-20" />
            <div className="relative z-10 max-w-6xl mx-auto">
              <HeroContent />
            </div>
          </section>

          {/* --- URGENCY STATS --- */}
          <UrgencyStats />

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
