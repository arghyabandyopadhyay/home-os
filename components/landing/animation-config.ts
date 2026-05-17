import type { Variants } from "framer-motion"

/**
 * Section entrance animation configuration.
 * Used by SectionReveal and individual section components for scroll-triggered animations.
 * Validates: Requirements 11.1, 11.2
 */
export const SECTION_ANIMATION = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
}

/**
 * Staggered children animation variants for groups of related elements.
 * Container variant staggers its children by 100ms.
 * Item variant fades in and translates upward.
 * Validates: Requirements 11.3
 */
export const STAGGER_CHILDREN: {
  container: Variants
  item: Variants
} = {
  container: {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  },
}

/**
 * Parallax configuration for background decorative elements.
 * Rate: movement speed relative to scroll (0.1–0.3 range).
 * MaxDisplacement: maximum pixel offset to prevent excessive movement.
 * Validates: Requirements 11.4
 */
export const PARALLAX_CONFIG = {
  rate: 0.2,
  maxDisplacement: 30,
} as const

/**
 * Hover scale animation for interactive cards and buttons.
 * Scale: 1.03 (within the 1.02–1.05 spec range).
 * Duration: 180ms (within the 150–200ms spec range).
 * Validates: Requirements 11.5
 */
export const HOVER_SCALE = {
  whileHover: { scale: 1.03 },
  transition: { duration: 0.18 },
} as const
