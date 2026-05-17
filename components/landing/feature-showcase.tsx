"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import {
  FileText,
  CheckSquare,
  BookOpen,
  Users,
  BookMarked,
  Sparkles,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { MODULES } from "@/components/landing/content"
import { SectionReveal } from "@/components/landing/section-reveal"
import { STAGGER_CHILDREN } from "@/components/landing/animation-config"

const ICON_MAP: Record<string, LucideIcon> = {
  notebook: FileText,
  "check-square": CheckSquare,
  "book-open": BookOpen,
  users: Users,
  "book-reader": BookMarked,
  sparkles: Sparkles,
}

/**
 * FeatureShowcase displays the 6 Home OS modules as an integrated ecosystem.
 * Uses a hub-and-spoke layout with the AI Assistant centered and larger,
 * surrounded by the other modules at varied sizes with connecting visual lines.
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */
export function FeatureShowcase() {
  const shouldReduceMotion = useReducedMotion()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Disable stagger on mobile per requirement 12.4
  const disableStagger = shouldReduceMotion || isMobile

  // Separate the center module (AI Assistant) from surrounding modules
  const centerModule = MODULES[5] // AI Assistant
  const surroundingModules = MODULES.slice(0, 5)

  return (
    <section
      className="relative px-6 md:px-8 py-20 md:py-28"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-6xl">
        <SectionReveal>
          <h2
            id="features-heading"
            className="mb-16 text-center text-3xl font-bold tracking-tight text-app md:text-4xl"
          >
            Everything lives together
          </h2>
        </SectionReveal>

        {/* Ecosystem container with shared background */}
        <div className="relative">
          {/* Connecting lines SVG - visible on desktop */}
          <svg
            className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
            aria-hidden="true"
          >
            {/* Lines from center to surrounding modules */}
            <line
              x1="50%"
              y1="50%"
              x2="20%"
              y2="20%"
              stroke="var(--home-border)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <line
              x1="50%"
              y1="50%"
              x2="50%"
              y2="12%"
              stroke="var(--home-border)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <line
              x1="50%"
              y1="50%"
              x2="80%"
              y2="20%"
              stroke="var(--home-border)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <line
              x1="50%"
              y1="50%"
              x2="15%"
              y2="75%"
              stroke="var(--home-border)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <line
              x1="50%"
              y1="50%"
              x2="85%"
              y2="75%"
              stroke="var(--home-border)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          </svg>

          <motion.ul
            className="relative grid gap-4 lg:grid-cols-12 lg:grid-rows-3 lg:gap-6"
            variants={disableStagger ? undefined : STAGGER_CHILDREN.container}
            initial={disableStagger ? undefined : "hidden"}
            whileInView={disableStagger ? undefined : "visible"}
            viewport={{ once: true, amount: 0.2 }}
            role="list"
          >
            {/* Top row: 3 modules with varied spans */}
            <ModuleCard
              module={surroundingModules[0]}
              className="lg:col-span-5 lg:row-start-1"
              shouldReduceMotion={disableStagger}
            />
            <ModuleCard
              module={surroundingModules[1]}
              className="lg:col-span-3 lg:row-start-1"
              shouldReduceMotion={disableStagger}
              compact
            />
            <ModuleCard
              module={surroundingModules[2]}
              className="lg:col-span-4 lg:row-start-1"
              shouldReduceMotion={disableStagger}
            />

            {/* Center row: AI Assistant (featured, large) */}
            <ModuleCard
              module={centerModule}
              className="lg:col-span-8 lg:col-start-3 lg:row-start-2"
              shouldReduceMotion={disableStagger}
              featured
            />

            {/* Bottom row: 2 modules with varied spans */}
            <ModuleCard
              module={surroundingModules[3]}
              className="lg:col-span-4 lg:row-start-3"
              shouldReduceMotion={disableStagger}
            />
            <ModuleCard
              module={surroundingModules[4]}
              className="lg:col-span-5 lg:col-start-8 lg:row-start-3"
              shouldReduceMotion={disableStagger}
            />
          </motion.ul>
        </div>
      </div>
    </section>
  )
}

type ModuleCardProps = {
  module: (typeof MODULES)[number]
  className?: string
  featured?: boolean
  compact?: boolean
  shouldReduceMotion: boolean | null
}

function ModuleCard({
  module,
  className = "",
  featured = false,
  compact = false,
  shouldReduceMotion,
}: ModuleCardProps) {
  const Icon = ICON_MAP[module.icon]

  const content = (
    <div
      className={`flex h-full items-start gap-4 ${
        featured ? "flex-col items-center text-center sm:flex-row sm:items-start sm:text-left" : ""
      } ${compact ? "flex-col" : ""}`}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl border border-app bg-app-elevated ${
          featured ? "h-14 w-14" : "h-10 w-10"
        }`}
      >
        {Icon && (
          <Icon
            className={featured ? "h-7 w-7 text-app" : "h-5 w-5 text-app"}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="min-w-0">
        <h3
          className={`font-semibold tracking-tight text-app ${
            featured ? "text-lg" : "text-sm"
          }`}
        >
          {module.label}
        </h3>
        <p
          className={`mt-1 text-app-muted ${
            featured ? "text-sm" : "text-xs"
          } leading-relaxed`}
        >
          {module.description}
        </p>
      </div>
    </div>
  )

  if (shouldReduceMotion) {
    return (
      <li
        className={`card-app p-5 ${featured ? "p-6 lg:p-8" : ""} ${
          compact ? "p-4" : ""
        } ${className}`}
      >
        {content}
      </li>
    )
  }

  return (
    <motion.li
      className={`card-app p-5 ${featured ? "p-6 lg:p-8" : ""} ${
        compact ? "p-4" : ""
      } ${className}`}
      variants={STAGGER_CHILDREN.item}
    >
      {content}
    </motion.li>
  )
}
