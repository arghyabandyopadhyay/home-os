import type { Variants, Transition } from "framer-motion"

/**
 * Motion system configuration for the Home OS app shell.
 *
 * All animations follow these constraints:
 * - Duration: 150-300ms for reveals, 150-200ms for hover
 * - Easing: ease-out for entrances, ease-in for exits
 * - Only animate transform and opacity (no layout-triggering properties)
 * - No spring/bounce physics
 * - No rotation > 10°, no displacement > 30px
 * - Scale: 1.02-1.05 for hover
 * - Opacity shift: ≤ 0.1 for hover
 *
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.6, 17.2
 */

// ─── Duration Constants (in seconds for Framer Motion) ───────────────────────

export const DURATION = {
  fast: 0.15, // 150ms
  normal: 0.2, // 200ms
  slow: 0.3, // 300ms
} as const

// ─── Easing Constants ────────────────────────────────────────────────────────

export const EASING = {
  entrance: [0, 0, 0.2, 1] as const, // ease-out cubic-bezier
  exit: [0.4, 0, 1, 1] as const, // ease-in cubic-bezier
} as const

// ─── Transition Presets ──────────────────────────────────────────────────────

/** Entrance transition: ease-out, 200ms */
export const transitionEntrance: Transition = {
  duration: DURATION.normal,
  ease: EASING.entrance,
}

/** Fast entrance transition: ease-out, 150ms */
export const transitionEntranceFast: Transition = {
  duration: DURATION.fast,
  ease: EASING.entrance,
}

/** Slow entrance transition: ease-out, 300ms */
export const transitionEntranceSlow: Transition = {
  duration: DURATION.slow,
  ease: EASING.entrance,
}

/** Exit transition: ease-in, 150ms */
export const transitionExit: Transition = {
  duration: DURATION.fast,
  ease: EASING.exit,
}

/** Hover transition: ease-out, 150ms */
export const transitionHover: Transition = {
  duration: DURATION.fast,
  ease: EASING.entrance,
}

// ─── Page / Section Reveal ───────────────────────────────────────────────────

/**
 * Fade-in reveal for page sections.
 * Opacity 0→1, optional subtle y-translate (≤20px), 200ms ease-out.
 */
export const fadeReveal: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.entrance,
    },
  },
}

/**
 * Simple opacity-only fade for minimal reveals.
 * Opacity 0→1, 200ms ease-out.
 */
export const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASING.entrance,
    },
  },
}

/**
 * Staggered children container + item variants.
 * Container staggers children by 60ms.
 * Items fade in with subtle y-translate.
 */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.entrance,
    },
  },
}

// ─── Hover Animations ────────────────────────────────────────────────────────

/**
 * Hover scale + opacity shift for interactive cards.
 * Scale: 1.02, opacity shift: 0.95→1 (shift of 0.05), 150ms ease-out.
 * Use with motion.div whileHover prop.
 */
export const hoverCard = {
  whileHover: { scale: 1.02, opacity: 1 },
  initial: { opacity: 0.95 },
  transition: transitionHover,
} as const

/**
 * Hover scale for buttons.
 * Scale: 1.03, 150ms ease-out.
 */
export const hoverButton = {
  whileHover: { scale: 1.03 },
  transition: transitionHover,
} as const

/**
 * Subtle hover lift for list items.
 * Scale: 1.01, 150ms ease-out.
 */
export const hoverItem = {
  whileHover: { scale: 1.01 },
  transition: transitionHover,
} as const

// ─── Modal / Overlay ─────────────────────────────────────────────────────────

/**
 * Modal overlay backdrop animation.
 * Fade-in with backdrop blur (handled via CSS class).
 * Duration: 150ms entrance, 100ms exit.
 */
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATION.fast,
      ease: EASING.entrance,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.1,
      ease: EASING.exit,
    },
  },
}

/**
 * Modal content animation.
 * Fade + subtle scale (0.96→1), 200ms ease-out entrance, 150ms ease-in exit.
 */
export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASING.entrance,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: {
      duration: DURATION.fast,
      ease: EASING.exit,
    },
  },
}

// ─── Page Transition ─────────────────────────────────────────────────────────

/**
 * Page-level transition for route changes.
 * Opacity 0→1, 250ms ease-out.
 */
export const pageTransition: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: EASING.entrance,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: DURATION.fast,
      ease: EASING.exit,
    },
  },
}

// ─── Motion Constraints (for validation / testing) ───────────────────────────

/**
 * Exported constraints for property-based testing.
 * These define the bounds that all motion configs must satisfy.
 */
export const MOTION_CONSTRAINTS = {
  duration: {
    fadeReveal: { min: 150, max: 300 },
    hover: { min: 150, max: 200 },
    overlay: { min: 100, max: 200 },
  },
  hoverScale: { min: 1.02, max: 1.05 },
  hoverOpacityShift: { max: 0.1 },
  displacement: { max: 30 },
  rotation: { max: 10 },
  backdropBlur: { overlay: { min: 4, max: 12 } },
  easing: {
    entrance: "ease-out",
    exit: "ease-in",
  },
  bannedEasings: ["spring", "bounce"],
  animatableProperties: ["transform", "opacity"],
} as const

// ─── Reduced Motion Helper ───────────────────────────────────────────────────

/**
 * Returns static (no-animation) variants for reduced motion preference.
 * Elements appear in their final state immediately.
 */
export const reducedMotionVariants: Variants = {
  hidden: { opacity: 1, y: 0, scale: 1 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 1, y: 0, scale: 1 },
}
