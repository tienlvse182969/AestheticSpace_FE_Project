import { StatsBar } from "../components/StatsBar";
import { WhyChooseUs } from "../components/WhyChooseUs";
import { FeaturesGrid } from "../components/FeaturesGrid";
import { HowItWorks } from "../components/HowItWorks";
import { SpacePreview } from "../components/SpacePreview";
import { TestimonialsSection } from "../components/TestimonialsSection";
import { CTASection } from "../components/CTASection";
import { HeroSection } from "../components/HeroSection";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <WhyChooseUs />
      <FeaturesGrid />
      <HowItWorks />
      <SpacePreview />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
