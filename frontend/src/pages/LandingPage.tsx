import { LandingNavbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Features, HowItWorks, Pricing, Faq, Cta, Footer } from '@/components/landing/Sections';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <LandingNavbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Faq />
      <Cta />
      <Footer />
    </div>
  );
}
