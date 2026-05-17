"use client"

import Link from "next/link"
import { HERO_CONTENT } from "@/components/landing/content"
import { SectionReveal } from "@/components/landing/section-reveal"
import { UIMockup } from "@/components/landing/ui-mockup"

export function HeroSection() {
  return (
    <section
      className="relative flex items-center justify-center py-12 lg:min-h-screen"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 md:px-8 text-center">
        <SectionReveal>
          <h2
            id="hero-heading"
            className="text-5xl font-bold tracking-tight text-app md:text-6xl lg:text-7xl"
          >
            {HERO_CONTENT.headline}
          </h2>
        </SectionReveal>

        <SectionReveal delay={0.1}>
          <p className="mt-6 max-w-2xl text-lg text-app-muted md:text-xl">
            {HERO_CONTENT.subheadline}
          </p>
        </SectionReveal>

        <SectionReveal delay={0.2}>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href={HERO_CONTENT.primaryCTA.href}
              className="btn-primary-app inline-flex min-h-[44px] items-center rounded-xl px-6 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {HERO_CONTENT.primaryCTA.label}
            </Link>

            <a
              href={HERO_CONTENT.secondaryCTA.target}
              className="link-muted inline-flex min-h-[44px] items-center rounded-md px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={(e) => {
                e.preventDefault()
                document
                  .querySelector(HERO_CONTENT.secondaryCTA.target)
                  ?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              {HERO_CONTENT.secondaryCTA.label}
            </a>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.3} distance={40}>
          <div className="mt-16 w-full max-w-4xl overflow-hidden" aria-hidden="true">
            <UIMockup />
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}
