"use client"

import { PHILOSOPHY_CONTENT } from "@/components/landing/content"
import { SectionReveal } from "@/components/landing/section-reveal"

export function PhilosophySection() {
  return (
    <section id="philosophy" className="py-16 px-6 md:px-8" aria-labelledby="philosophy-heading">
      <div className="max-w-3xl mx-auto space-y-8">
        <SectionReveal delay={0}>
          <h2
            id="philosophy-heading"
            className="text-3xl md:text-4xl font-bold tracking-tight text-app"
          >
            {PHILOSOPHY_CONTENT.heading}
          </h2>
        </SectionReveal>

        <SectionReveal delay={0.1}>
          <p className="text-lg md:text-xl text-app-muted leading-relaxed">
            {PHILOSOPHY_CONTENT.problem}
          </p>
        </SectionReveal>

        <SectionReveal delay={0.2}>
          <p className="text-lg md:text-xl text-app-muted leading-relaxed">
            {PHILOSOPHY_CONTENT.solution}
          </p>
        </SectionReveal>
      </div>
    </section>
  )
}
