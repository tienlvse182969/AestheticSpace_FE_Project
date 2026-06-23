import { StatsBar } from "../components/homepage/StatsBar";
import { WhyChooseUs } from "../components/homepage/WhyChooseUs";
import { FeaturesGrid } from "../components/homepage/FeaturesGrid";
import { HowItWorks } from "../components/homepage/HowItWorks";
import { SpacePreview } from "../components/homepage/SpacePreview";
import { TestimonialsSection } from "../components/homepage/TestimonialsSection";
import { CTASection } from "../components/homepage/CTASection";
import { HeroSection } from "../components/homepage/HeroSection";

export function HomePage() {
  return (
    <>
      <HeroSection />
      {/* <StatsBar /> */}
      <WhyChooseUs />
      <FeaturesGrid />
      <SpacePreview />
      {/* <TestimonialsSection /> */}
      <HowItWorks />
      <CTASection />
    </>
  );
}
