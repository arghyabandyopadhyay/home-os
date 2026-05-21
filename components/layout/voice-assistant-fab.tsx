"use client"

import { useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Microphone } from "@phosphor-icons/react"

import { useIsMobile } from "@/hooks/use-is-mobile"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useLowPerformance } from "@/hooks/use-low-performance"
import { useScrollDirection } from "@/hooks/use-scroll-direction"
import { useVoiceInput } from "@/hooks/use-voice-input"
import { DURATION, EASING } from "@/lib/motion"
import { BOTTOM_NAV_SCROLL_THRESHOLD } from "./bottom-nav"

/**
 * Floating action button for voice assistant, positioned bottom-right
 * just above the bottom nav bar on mobile.
 * Hides in sync with the bottom nav on scroll down.
 * When a transcript is captured, it opens the command menu pre-filled with the query.
 */
export function VoiceAssistantFab() {
  const isMobile = useIsMobile()
  const prefersReducedMotion = useReducedMotion()
  const isLowPerf = useLowPerformance()
  const scrollDirection = useScrollDirection({ threshold: BOTTOM_NAV_SCROLL_THRESHOLD })
  const { isSupported, isListening, transcript, startListening, stopListening, clearTranscript } = useVoiceInput()

  const isScrollHidden = isMobile && scrollDirection === "down"

  // When voice input produces a transcript, open command menu with it
  useEffect(() => {
    if (transcript && !isListening) {
      window.dispatchEvent(
        new CustomEvent("open-command-menu", { detail: { query: transcript } })
      )
      clearTranscript()
    }
  }, [transcript, isListening, clearTranscript])

  const handlePress = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  if (!isMobile || !isSupported) {
    return null
  }

  const scrollTransition =
    prefersReducedMotion || isLowPerf
      ? { duration: 0 }
      : {
          duration: DURATION.normal,
          ease: isScrollHidden ? EASING.exit : EASING.entrance,
        }

  // When bottom nav hides, FAB moves down to sit near the bottom edge instead
  return (
    <motion.button
      type="button"
      aria-label={isListening ? "Stop voice assistant" : "Start voice assistant"}
      onClick={handlePress}
      className={`fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-colors outline-offset-2 focus-visible:outline-2 focus-visible:outline-current ${
        isListening
          ? "bg-red-500 text-white shadow-red-500/30"
          : "bg-app-surface border border-app text-app-muted hover:text-app hover:bg-app-elevated"
      }`}
      style={{
        bottom: "calc(16px + env(safe-area-inset-bottom, 0px) + var(--bottom-nav-height, 64px))",
      }}
      animate={{ y: isScrollHidden ? "var(--bottom-nav-height, 64px)" : 0 }}
      transition={scrollTransition}
    >
      <Microphone
        size={24}
        weight={isListening ? "fill" : "regular"}
        className={isListening ? "animate-pulse" : ""}
        aria-hidden="true"
      />
    </motion.button>
  )
}
