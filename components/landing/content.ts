/**
 * Static content constants for the Home OS landing page.
 * All copy follows the calm, minimal, emotionally safe philosophy.
 * No hustle culture language. No generic SaaS phrasing.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type HeroContent = {
  headline: string
  subheadline: string
  primaryCTA: { label: string; href: string }
  secondaryCTA: { label: string; target: string }
}

export type ModuleData = {
  name: string
  label: string
  description: string
  icon: string
}

export type PhilosophyContent = {
  heading: string
  problem: string
  solution: string
}

export type WorkflowContent = {
  heading: string
  body: string
  concepts: string[]
}

export type EmotionalHookContent = {
  narrative: string
  secondary?: string
}

export type CTAContent = {
  headline: string
  buttonLabel: string
  buttonHref: string
}

// ─── Hero ────────────────────────────────────────────────────────────────────

/**
 * Hero section content.
 * Validates: Requirements 3.1, 3.2
 */
export const HERO_CONTENT: HeroContent = {
  headline: "A quiet home for your digital mind",
  subheadline:
    "One calm space where notes, tasks, reading, and contacts live together. No clutter, no context switching — just clarity.",
  primaryCTA: {
    label: "Enter Home OS",
    href: "/login",
  },
  secondaryCTA: {
    label: "Learn more",
    target: "#philosophy",
  },
}

// ─── Modules ─────────────────────────────────────────────────────────────────

/**
 * The six core modules presented as an integrated ecosystem.
 * Each label ≤ 8 words, each description ≤ 20 words.
 * Validates: Requirements 5.1, 5.2
 */
export const MODULES: ModuleData[] = [
  {
    name: "Notes",
    label: "Capture thoughts as they arrive",
    description:
      "A distraction-free writing space for ideas, reflections, and plans that deserve room to breathe.",
    icon: "notebook",
  },
  {
    name: "Tasks",
    label: "See what matters today",
    description:
      "Simple task tracking without the overwhelm. Focus on what feels right, not what feels urgent.",
    icon: "check-square",
  },
  {
    name: "Library",
    label: "Your personal reading collection",
    description:
      "Organize books and documents in one place. Track progress at your own pace.",
    icon: "book-open",
  },
  {
    name: "Contacts",
    label: "People you care about, remembered",
    description:
      "Keep meaningful connections close. Notes, context, and history for the people in your life.",
    icon: "users",
  },
  {
    name: "Reading Room",
    label: "A focused space for deep reading",
    description:
      "Read without distractions. Highlight, annotate, and return to passages that resonate.",
    icon: "book-reader",
  },
  {
    name: "AI Assistant",
    label: "Gentle help when you need it",
    description:
      "A quiet companion that helps you think, organize, and find connections across your space.",
    icon: "sparkles",
  },
]

// ─── Philosophy ──────────────────────────────────────────────────────────────

/**
 * Philosophy section content: problem and solution framing.
 * Validates: Requirements 4.1, 4.2, 4.3
 */
export const PHILOSOPHY_CONTENT: PhilosophyContent = {
  heading: "Your digital life deserves one home",
  problem:
    "Modern life scatters your thinking across dozens of disconnected apps. Notes in one place, tasks in another, reading somewhere else. Every switch costs you focus and fragments your attention.",
  solution:
    "Home OS brings everything into a single, calm environment. Your notes, tasks, reading, and contacts live side by side — connected, searchable, and always within reach. One space for all your thinking.",
}

// ─── Workflow ─────────────────────────────────────────────────────────────────

/**
 * Workflow section content describing the unified OS experience.
 * Validates: Requirements 6.1, 6.2
 */
export const WORKFLOW_CONTENT: WorkflowContent = {
  heading: "An environment, not a collection of apps",
  body: "Capture a thought in Notes, turn it into a Task, link it to a Contact, and reference a passage from your Library — all without leaving your flow. Information moves between modules like rooms in a home, not tabs in a browser.",
  concepts: [
    "Command center",
    "Keyboard-first interaction",
    "Instant capture",
    "Connected thinking",
    "Spatial computing feel",
  ],
}

// ─── Emotional Hook ──────────────────────────────────────────────────────────

/**
 * Emotional hook section: calm narrative reinforcement.
 * Narrative: 5–25 words. Secondary: ≤ 30 words.
 * Validates: Requirements 7.1, 7.5
 */
export const EMOTIONAL_HOOK_CONTENT: EmotionalHookContent = {
  narrative: "Finally, a place where your mind can rest.",
  secondary:
    "Not another tool demanding your attention. A quiet space that holds your thinking and lets you focus on what matters.",
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

/**
 * Final call-to-action section content.
 * Uses product-specific emotional language — no generic SaaS phrasing.
 * Validates: Requirements 8.1, 8.3
 */
export const CTA_CONTENT: CTAContent = {
  headline: "Build your quiet corner of the internet",
  buttonLabel: "Create your Home",
  buttonHref: "/login?mode=signup",
}

// ─── Banned Language ─────────────────────────────────────────────────────────

/**
 * Words and phrases that must never appear in landing page content.
 * These represent hustle culture, urgency tactics, and fear-based marketing.
 * Validates: Requirements 7.5
 */
export const BANNED_HUSTLE_WORDS: string[] = [
  "hustle",
  "grind",
  "10x",
  "don't miss out",
  "limited time",
  "act now",
]

/**
 * Generic SaaS call-to-action phrases that must never be used.
 * Home OS uses product-specific, emotionally resonant language instead.
 * Validates: Requirements 8.3
 */
export const BANNED_GENERIC_CTA: string[] = [
  "start for free",
  "get started",
  "try it now",
]
