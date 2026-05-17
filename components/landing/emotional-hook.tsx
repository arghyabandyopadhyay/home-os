"use client"

import { EMOTIONAL_HOOK_CONTENT } from "@/components/landing/content"
import { SectionReveal } from "@/components/landing/section-reveal"

export function EmotionalHook() {
  return (
    <section
      className="relative min-h-[50vh] lg:min-h-[60vh] flex items-center justify-center px-6 md:px-8"
      aria-label="Emotional narrative"
    >
      {/* Subtle radial glow background */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.05)_0%,_transparent_70%)]"
        aria-hidden="true"
      />

      <SectionReveal duration={0.7} direction="up">
        <div className="relative text-center max-w-4xl mx-auto">
          <p className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight text-app">
            {EMOTIONAL_HOOK_CONTENT.narrative}
          </p>

          {EMOTIONAL_HOOK_CONTENT.secondary && (
            <p className="text-base md:text-lg text-app-muted mt-6">
              {EMOTIONAL_HOOK_CONTENT.secondary}
            </p>
          )}
        </div>
      </SectionReveal>
    </section>
  )
}
