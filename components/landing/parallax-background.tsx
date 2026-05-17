"use client"

import { useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"

import { PARALLAX_CONFIG } from "@/components/landing/animation-config"
import { useScrollPosition } from "@/components/landing/use-scroll-position"

/**
 * Decorative parallax background with soft gradient orbs.
 * Applies subtle vertical movement as the user scrolls.
 * Disabled on mobile (<768px) and when reduced motion is preferred.
 *
 * Validates: Requirements 11.4, 12.4
 */
export function ParallaxBackground() {
  const scrollY = useScrollPosition()
  const shouldReduceMotion = useReducedMotion()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const parallaxEnabled = !isMobile && !shouldReduceMotion

  // Calculate offsets for each orb at slightly different rates
  const offset1 = parallaxEnabled
    ? Math.min(scrollY * PARALLAX_CONFIG.rate, PARALLAX_CONFIG.maxDisplacement)
    : 0
  const offset2 = parallaxEnabled
    ? Math.min(scrollY * (PARALLAX_CONFIG.rate * 0.7), PARALLAX_CONFIG.maxDisplacement)
    : 0
  const offset3 = parallaxEnabled
    ? Math.min(scrollY * (PARALLAX_CONFIG.rate * 1.3), PARALLAX_CONFIG.maxDisplacement)
    : 0

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Top-left blue glow */}
      <div
        className="absolute -top-24 -left-24 w-[350px] h-[350px] rounded-full bg-blue-500/5 blur-[100px]"
        style={{
          willChange: parallaxEnabled ? "transform" : "auto",
          transform: parallaxEnabled ? `translateY(${offset1}px)` : undefined,
        }}
      />

      {/* Center-right purple glow */}
      <div
        className="absolute top-1/3 -right-16 w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[100px]"
        style={{
          willChange: parallaxEnabled ? "transform" : "auto",
          transform: parallaxEnabled ? `translateY(${offset2}px)` : undefined,
        }}
      />

      {/* Bottom-left indigo glow */}
      <div
        className="absolute bottom-1/4 left-1/4 w-[250px] h-[250px] rounded-full bg-indigo-500/[0.03] blur-[100px]"
        style={{
          willChange: parallaxEnabled ? "transform" : "auto",
          transform: parallaxEnabled ? `translateY(${offset3}px)` : undefined,
        }}
      />
    </div>
  )
}
