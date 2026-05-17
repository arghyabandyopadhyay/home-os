"use client"

import Link from "next/link"
import { CTA_CONTENT } from "@/components/landing/content"
import { SectionReveal } from "@/components/landing/section-reveal"

export function CTASection() {
  return (
    <section
      className="relative py-12 lg:py-20"
      aria-labelledby="cta-heading"
    >
      {/* Subtle gradient background for distinguished visual treatment */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent"
        aria-hidden="true"
      />

      <div className="relative flex items-center justify-center text-center">
        <div className="mx-auto max-w-3xl px-6 md:px-8">
          <SectionReveal>
            <h2
              id="cta-heading"
              className="text-3xl font-bold tracking-tight text-app md:text-4xl lg:text-5xl"
            >
              {CTA_CONTENT.headline}
            </h2>
          </SectionReveal>

          <SectionReveal delay={0.15}>
            <div className="mt-8">
              <Link
                href={CTA_CONTENT.buttonHref}
                className="btn-primary-app inline-flex min-h-[44px] min-w-[44px] items-center px-8 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {CTA_CONTENT.buttonLabel}
              </Link>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  )
}
