import dynamic from 'next/dynamic';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { StickyActionNav } from '@/components/landing/sticky-action-nav';
import { UserTypeProvider } from '@/components/landing/user-type-context';
import { HeroContent } from '@/components/landing/hero-content';
import { RecentWorks } from '@/components/landing/recent-works';
import { BioSection } from '@/components/landing/bio-section';

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

// Dynamic imports for below-the-fold components (non-critical)
// Loading fallbacks prevent CLS during hydration
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
const FAQSection = dynamic(() => import('@/components/landing/faq-section').then(mod => mod.FAQSection), {
  loading: () => <div className="min-h-[600px]" />
});
const ServicesGrid = dynamic(() => import('@/components/landing/services-grid').then(mod => ({ default: mod.ServicesGrid })), {
  loading: () => <div className="min-h-[600px]" />
});

export default function Home() {
  return (
    <UserTypeProvider>
      <div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-blue-100 dark:selection:bg-blue-900 pb-20 sm:pb-0">

        {/* --- SITE HEADER --- */}
        <SiteHeader showUserTypeToggle={true} />

        <main className="flex-1">

          {/* --- HERO SECTION --- */}
          <section className="relative py-12 sm:py-20 lg:py-32 px-4 sm:px-6 overflow-hidden">
            <div className="relative max-w-6xl mx-auto">
              <HeroContent />
            </div>
          </section>

          <div id="reviews" className="min-h-[400px]">
            <TestimonialCarousel />
          </div>

          {/* --- RECENT WORKS (AUTHORITY) --- */}
          <div id="works">
            <RecentWorks />
          </div>

          {/* --- BIO SECTION (HUMAN CONNECTION) --- */}
          <div id="about">
            <BioSection />
          </div>

          {/* --- WHY CHOOSE US (TRUST & QUALITY) --- */}
          <div className="min-h-[600px]">
            <WhyChooseUs />
          </div>

          {/* --- USER-SPECIFIC SECTIONS (Residential/Business) --- */}
          <UserSpecificSections />

          {/* --- TERRA-TERRA SERVICES GRID --- */}
          <ServicesGrid />

          {/* --- HOW IT WORKS --- */}
          <div className="min-h-[500px]">
            <HowItWorks />
          </div>

          {/* --- URGENCY STATS (PUSHED LOWER) --- */}
          <UrgencyStats />

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
