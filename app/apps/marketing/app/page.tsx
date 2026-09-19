import dynamic from 'next/dynamic';
import { getPlansForMarketing } from '@/lib/get-plans-for-marketing';

import { baseUrl, routes } from '@workspace/routes';

import { Hero } from '../components/hero';

const LogosMarquee = dynamic(() =>
  import('../components/logos-marquee').then((m) => m.LogosMarquee)
);
const FeaturesGrid = dynamic(() =>
  import('../components/features-grid').then((m) => m.FeaturesGrid)
);
const FeaturesShowcase = dynamic(() =>
  import('../components/features-showcase').then((m) => m.FeaturesShowcase)
);
const WaveGoodbye = dynamic(() =>
  import('../components/wave-goodbye').then((m) => m.WaveGoodbye)
);
const StatsBar = dynamic(() =>
  import('../components/stats-bar').then((m) => m.StatsBar)
);
const Testimonials = dynamic(() =>
  import('../components/testimonials').then((m) => m.Testimonials)
);
const Pricing = dynamic(() =>
  import('../components/pricing').then((m) => m.Pricing)
);
const Faq = dynamic(() => import('../components/faq').then((m) => m.Faq));
const CtaSection = dynamic(() =>
  import('../components/cta-section').then((m) => m.CtaSection)
);

export const revalidate = 3600;

export default function MarketingPage() {
  const plans = getPlansForMarketing(
    `${baseUrl.dashboard}/auth/sign-up`,
    routes.marketing.contact
  );

  return (
    <>
      <Hero />
      <LogosMarquee />
      <FeaturesGrid />
      <FeaturesShowcase />
      <WaveGoodbye />
      <StatsBar />
      <Testimonials />
      <Pricing plans={plans} />
      <Faq />
      <CtaSection />
    </>
  );
}
