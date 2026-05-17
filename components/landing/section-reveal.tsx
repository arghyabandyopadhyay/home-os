"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import type { ReactNode } from "react"

type SectionRevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  direction?: "up" | "none"
  distance?: number
  duration?: number
}

export function SectionReveal({
  children,
  className,
  delay = 0,
  direction = "up",
  distance = 30,
  duration = 0.6,
}: SectionRevealProps) {
  const shouldReduceMotion = useReducedMotion()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  // On mobile: simple opacity fade only (no translateY, no stagger delay)
  // Per requirement 12.4
  if (isMobile) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    )
  }

  const initialY = direction === "up" ? distance : 0

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: initialY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}
