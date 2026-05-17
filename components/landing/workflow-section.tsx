"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import { WORKFLOW_CONTENT } from "@/components/landing/content"
import { SectionReveal } from "@/components/landing/section-reveal"
import { STAGGER_CHILDREN } from "@/components/landing/animation-config"

/**
 * WorkflowSection — Communicates the unified OS-like environment experience.
 * Uses layered visual panels with perspective transforms and z-depth to convey
 * spatial relationships between modules. Staggered depth animation on scroll.
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */
export function WorkflowSection() {
  const shouldReduceMotion = useReducedMotion()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <section
      className="relative px-6 md:px-8 py-20 md:py-28"
      aria-labelledby="workflow-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Text content */}
          <div className="space-y-8">
            <SectionReveal>
              <h2
                id="workflow-heading"
                className="text-3xl font-bold tracking-tight text-app md:text-4xl"
              >
                {WORKFLOW_CONTENT.heading}
              </h2>
            </SectionReveal>

            <SectionReveal delay={0.1}>
              <p className="text-lg text-app-muted leading-relaxed">
                {WORKFLOW_CONTENT.body}
              </p>
            </SectionReveal>

            <SectionReveal delay={0.2}>
              <div className="flex flex-wrap gap-2">
                {WORKFLOW_CONTENT.concepts.map((concept) => (
                  <span
                    key={concept}
                    className="bg-app-elevated border border-app rounded-full px-3 py-1 text-xs text-app-muted"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </SectionReveal>
          </div>

          {/* Right: Layered depth visual */}
          <div className="relative overflow-hidden">
            <DepthVisual shouldReduceMotion={shouldReduceMotion} isMobile={isMobile} />
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * DepthVisual — Layered panels with perspective transforms showing
 * the OS-like spatial environment. Elements exist at distinct z-depth levels
 * and animate in with staggered delays.
 * On mobile: no depth/stagger animations, simple opacity fade only (Req 12.4).
 */
function DepthVisual({
  shouldReduceMotion,
  isMobile,
}: {
  shouldReduceMotion: boolean | null
  isMobile: boolean
}) {
  // Disable depth animations on mobile per requirement 12.4
  if (shouldReduceMotion || isMobile) {
    return (
      <div className="relative w-full aspect-[4/3] min-h-[280px]" style={isMobile ? undefined : { perspective: "1000px" }}>
        <DepthPanels disablePerspective={isMobile} />
      </div>
    )
  }

  return (
    <motion.div
      className="relative w-full aspect-[4/3] min-h-[280px]"
      style={{ perspective: "1000px" }}
      variants={STAGGER_CHILDREN.container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <DepthPanels animated />
    </motion.div>
  )
}

function DepthPanels({ animated = false, disablePerspective = false }: { animated?: boolean; disablePerspective?: boolean }) {
  const Wrapper = animated ? motion.div : "div"

  const layerVariant = (delay: number) =>
    animated
      ? {
          variants: {
            hidden: { opacity: 0, y: 40, rotateX: 8 },
            visible: {
              opacity: 1,
              y: 0,
              rotateX: 0,
              transition: { duration: 0.6, delay, ease: "easeOut" as const },
            },
          },
        }
      : {}

  const getLayerStyle = (transform: string, zIndex: number) => {
    if (disablePerspective || animated) {
      return { zIndex }
    }
    return { transform, zIndex }
  }

  return (
    <>
      {/* Layer 1 (back) — Workspace overview panel */}
      <Wrapper
        className="absolute top-0 left-0 w-[75%] h-[70%] panel-app shadow-lg rounded-2xl overflow-hidden"
        style={{
          willChange: animated ? "transform, opacity" : "auto",
          ...getLayerStyle("perspective(1000px) rotateY(3deg) rotateX(-2deg)", 1),
        }}
        {...layerVariant(0)}
      >
        <div className="p-4 border-b border-app">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-app-elevated border border-app" />
            <div className="w-2 h-2 rounded-full bg-app-elevated border border-app" />
            <div className="w-2 h-2 rounded-full bg-app-elevated border border-app" />
            <div className="ml-3 h-2 w-16 rounded bg-app-elevated opacity-50" />
          </div>
        </div>
        <div className="p-4 space-y-3">
          {/* Sidebar + content layout */}
          <div className="flex gap-3">
            <div className="w-16 space-y-2">
              <div className="h-2 w-full rounded bg-app-elevated opacity-40" />
              <div className="h-2 w-12 rounded bg-app-elevated opacity-40" />
              <div className="h-2 w-14 rounded bg-app-elevated opacity-60" />
              <div className="h-2 w-10 rounded bg-app-elevated opacity-40" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-2.5 w-24 rounded bg-app-elevated" />
              <div className="h-2 w-full rounded bg-app-elevated opacity-50" />
              <div className="h-2 w-[80%] rounded bg-app-elevated opacity-50" />
              <div className="h-2 w-[60%] rounded bg-app-elevated opacity-50" />
            </div>
          </div>
        </div>
      </Wrapper>

      {/* Layer 2 (middle) — Connected note/task panel */}
      <Wrapper
        className="absolute top-[20%] left-[20%] w-[60%] h-[55%] panel-app shadow-xl rounded-2xl overflow-hidden"
        style={{
          willChange: animated ? "transform, opacity" : "auto",
          ...getLayerStyle("perspective(1000px) rotateY(-3deg) rotateX(2deg)", 10),
        }}
        {...layerVariant(0.1)}
      >
        <div className="p-3 border-b border-app">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-app-elevated border border-app" />
            <div className="w-2 h-2 rounded-full bg-app-elevated border border-app" />
            <div className="w-2 h-2 rounded-full bg-app-elevated border border-app" />
            <div className="ml-3 h-2 w-12 rounded bg-app-elevated opacity-50" />
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="h-2.5 w-20 rounded bg-app-elevated" />
          <div className="h-2 w-full rounded bg-app-elevated opacity-50" />
          <div className="h-2 w-[75%] rounded bg-app-elevated opacity-50" />
          {/* Link indicator */}
          <div className="mt-2 flex items-center gap-1.5 pt-1">
            <LinkIcon />
            <div className="h-2 w-14 rounded bg-app-elevated opacity-70" />
          </div>
        </div>
      </Wrapper>

      {/* Layer 3 (front) — Command palette / quick capture */}
      <Wrapper
        className="absolute bottom-[5%] right-0 w-[55%] h-[40%] panel-app shadow-2xl rounded-2xl overflow-hidden"
        style={{
          willChange: animated ? "transform, opacity" : "auto",
          ...getLayerStyle("perspective(1000px) rotateY(-5deg) rotateX(3deg)", 20),
        }}
        {...layerVariant(0.2)}
      >
        <div className="p-3 border-b border-app">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-app-elevated border border-app" />
            <div className="w-2 h-2 rounded-full bg-app-elevated border border-app" />
            <div className="w-2 h-2 rounded-full bg-app-elevated border border-app" />
          </div>
        </div>
        <div className="p-3 space-y-2">
          {/* Command input */}
          <div className="flex items-center gap-2 rounded-lg bg-app-elevated border border-app p-2">
            <CommandIcon />
            <div className="h-2 w-20 rounded bg-app-elevated opacity-60" />
          </div>
          {/* Results */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded bg-app-elevated opacity-50" />
              <div className="h-2 w-16 rounded bg-app-elevated opacity-50" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded bg-app-elevated opacity-50" />
              <div className="h-2 w-20 rounded bg-app-elevated opacity-50" />
            </div>
          </div>
        </div>
      </Wrapper>
    </>
  )
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="w-3 h-3 text-app-muted flex-shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M6.5 9.5l3-3" />
      <path d="M9 6.5l1.5-1.5a2 2 0 0 0-2.83-2.83L6.5 3.5" />
      <path d="M7 9.5L5.5 11a2 2 0 0 0 2.83 2.83L9.5 12.5" />
    </svg>
  )
}

function CommandIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="w-3.5 h-3.5 text-app-muted flex-shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M4 8h8M8 4v8" />
      <rect x="1" y="1" width="14" height="14" rx="3" />
    </svg>
  )
}
