import { LandingNavbar } from "@/components/landing/landing-navbar"
import { ParallaxBackground } from "@/components/landing/parallax-background"
import { HeroSection } from "@/components/landing/hero-section"
import { PhilosophySection } from "@/components/landing/philosophy-section"
import { FeatureShowcase } from "@/components/landing/feature-showcase"
import { WorkflowSection } from "@/components/landing/workflow-section"
import { EmotionalHook } from "@/components/landing/emotional-hook"
import { CTASection } from "@/components/landing/cta-section"
import { LandingFooter } from "@/components/landing/landing-footer"

export function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      <LandingNavbar />
      <ParallaxBackground />
      <main className="bg-app text-app">
        <HeroSection />
        <PhilosophySection />
        <FeatureShowcase />
        <WorkflowSection />
        <EmotionalHook />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  )
}
