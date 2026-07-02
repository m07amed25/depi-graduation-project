"use client";

import { Suspense } from "react";
import { MotionConfig } from "motion/react";
import { HeroSection } from "./HeroSection";
import { StatsSection } from "./StatsSection";
import { FeaturesSection } from "./FeaturesSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { CtaSection } from "./CtaSection";
import { ParallaxSection } from "./ParallaxSection";

export function LandingContent() {
  return (
    <MotionConfig reducedMotion="user">
      <HeroSection />
      <ParallaxSection speed={-0.3}>
        <Suspense fallback={null}><StatsSection /></Suspense>
      </ParallaxSection>
      <ParallaxSection speed={0.15}>
        <FeaturesSection />
      </ParallaxSection>
      <ParallaxSection speed={-0.2}>
        <HowItWorksSection />
      </ParallaxSection>
      <ParallaxSection speed={0.25}>
        <Suspense fallback={null}><CtaSection /></Suspense>
      </ParallaxSection>
    </MotionConfig>
  );
}
