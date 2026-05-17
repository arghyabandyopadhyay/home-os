# Design Document: Landing Page

## Overview

The landing page is a premium marketing experience rendered at `/` for unauthenticated visitors. It communicates Home OS's philosophy — "A personal operating system for the mind" — through cinematic storytelling, immersive dark-mode visuals, and scroll-driven animations.

The page is a standalone server-rendered route that bypasses the application shell (sidebar, header, command menu). Authenticated users are redirected to `/dashboard` before any HTML is sent. The design prioritizes performance (LCP < 2.5s), accessibility (keyboard navigation, reduced motion support), and emotional resonance over feature enumeration.

**Key design decisions:**
- **Dedicated layout**: The landing page uses its own `layout.tsx` that excludes the app shell, forces dark mode, and sets marketing-specific metadata.
- **Server Component with client islands**: The page structure is a Server Component for fast SSR. Interactive elements (scroll-triggered animations, navbar scroll state, parallax) are isolated client components hydrated progressively.
- **Framer Motion for animations**: All entrance animations use Framer Motion's `motion` components with `whileInView` and `viewport={{ once: true }}` to trigger once on scroll.
- **No external images on initial load**: The UI mockup and visual elements are built with CSS/SVG to avoid image loading delays and maintain the 1.5MB budget.

## Architecture

```mermaid
graph TD
    subgraph "Route: / (root)"
        A[app/page.tsx - Server Component] -->|unauthenticated| B[app/(marketing)/layout.tsx]
        A -->|authenticated| C[redirect /dashboard]
    end

    subgraph "Marketing Layout"
        B --> D[LandingPage Server Component]
        D --> E[LandingNavbar - Client]
        D --> F[HeroSection - Client]
        D --> G[PhilosophySection - Client]
        D --> H[FeatureShowcase - Client]
        D --> I[WorkflowSection - Client]
        D --> J[EmotionalHook - Client]
        D --> K[CTASection - Client]
        D --> L[LandingFooter - Server]
    end

    subgraph "Shared Utilities"
        M[useScrollPosition hook]
        N[useReducedMotion hook]
        O[SectionReveal wrapper]
    end

    E --> M
    F --> N
    F --> O
    G --> O
    H --> O
    I --> O
    J --> O
    K --> O
```

### Routing Strategy

The current `app/page.tsx` checks auth and redirects. The new design restructures this:

1. **`app/page.tsx`** remains a Server Component that checks Supabase auth state:
   - If authenticated → `redirect("/dashboard")`
   - If unauthenticated → renders the `LandingPage` component
2. **`app/(marketing)/layout.tsx`** is NOT used (route groups would complicate the existing layout). Instead, the landing page renders its own full-page layout inline, bypassing the root layout's sidebar/header by using a conditional approach in the root layout OR by rendering the landing page content directly from `app/page.tsx` without the shell.

**Chosen approach**: Modify `app/layout.tsx` to conditionally exclude the app shell when rendering the landing page. This is achieved by checking the pathname or by having `app/page.tsx` render a self-contained full-screen layout that visually overrides the shell. However, the cleanest Next.js pattern is:

- Create a **route group** `app/(marketing)/page.tsx` with its own `layout.tsx` that has no sidebar/header.
- Move the authenticated app pages under `app/(app)/` with the existing layout.

**Simplest approach for this project**: Since the root layout wraps everything with the sidebar/header, and we need the landing page to NOT have those, we use a **route group**:
- `app/(marketing)/layout.tsx` — minimal layout (just html/body, dark mode, no shell)
- `app/(marketing)/page.tsx` — the landing page (auth check + content)
- `app/(app)/layout.tsx` — the existing layout with sidebar/header/command menu
- Move all authenticated routes under `app/(app)/`

This is the architecturally correct approach but involves moving files. A **pragmatic alternative** that avoids restructuring:
- Keep `app/page.tsx` as the entry point with auth check
- When unauthenticated, render a full-viewport landing page component that uses `fixed inset-0` positioning to overlay the shell, or better: conditionally hide the shell in the root layout based on a flag.

**Final decision**: Use the route group approach. It's the correct Next.js pattern and avoids hacks. The landing page gets a clean layout without the app shell.

### File Structure

```
app/
  (marketing)/
    layout.tsx          # Minimal layout: html, body, dark mode, metadata
    page.tsx            # Auth check + LandingPage render
  (app)/
    layout.tsx          # Existing layout with sidebar, header, command menu
    dashboard/page.tsx  # (moved from app/dashboard/)
    notes/...           # (moved from app/notes/)
    ... other app routes
components/
  landing/
    landing-navbar.tsx      # Fixed navbar with scroll-aware styling
    hero-section.tsx        # Hero with headline, CTA, UI mockup
    philosophy-section.tsx  # Problem/solution narrative
    feature-showcase.tsx    # Module ecosystem display
    workflow-section.tsx    # OS experience with depth layers
    emotional-hook.tsx      # Cinematic narrative statement
    cta-section.tsx         # Final call-to-action
    landing-footer.tsx      # Minimal footer
    section-reveal.tsx      # Reusable scroll-triggered animation wrapper
    ui-mockup.tsx           # CSS/SVG-based interface mockup
    use-scroll-position.ts  # Hook for navbar scroll state
```

## Components and Interfaces

### LandingNavbar

```typescript
// components/landing/landing-navbar.tsx
"use client"

type LandingNavbarProps = Record<string, never>  // no props needed

// Internal state:
// - scrolled: boolean (true when window.scrollY > 50)
// Renders: <nav aria-label="Main"> with logo, product name, Log in + Sign up buttons
// Scroll behavior: transparent at top, glassmorphism after 50px scroll
// Links: "Log in" → /login, "Sign up" → /login?mode=signup
```

### SectionReveal

```typescript
// components/landing/section-reveal.tsx
"use client"

type SectionRevealProps = {
  children: React.ReactNode
  className?: string
  delay?: number          // stagger delay in seconds (default 0)
  direction?: "up" | "none"  // translate direction (default "up")
  distance?: number       // translate distance in px (default 30)
  duration?: number       // animation duration in seconds (default 0.6)
}

// Wraps children in a Framer Motion component with:
// - initial: { opacity: 0, y: distance }
// - whileInView: { opacity: 1, y: 0 }
// - viewport: { once: true, amount: 0.2 }
// - transition: { duration, delay, ease: "easeOut" }
// Respects prefers-reduced-motion by rendering children without animation
```

### HeroSection

```typescript
// components/landing/hero-section.tsx
"use client"

type HeroSectionProps = Record<string, never>

// Renders:
// - Primary headline (text-5xl md:text-6xl lg:text-7xl)
// - Supporting copy (text-app-muted, ≤ 200 chars)
// - Primary CTA button (btn-primary-app → /login)
// - Secondary link (link-muted → smooth scroll to #philosophy)
// - UIMockup component with entrance animation
// Layout: min-h-screen on desktop, flex items-center justify-center
```

### UIMockup

```typescript
// components/landing/ui-mockup.tsx
"use client"

type UIMockupProps = Record<string, never>

// Pure CSS/SVG mockup of the Home OS interface
// - Multiple layered panels with offset positioning and shadows
// - Uses panel-app and card-app styling
// - Entrance animation: staggered opacity + translateY on each layer
// - No external images — all built with divs, borders, and gradients
```

### FeatureShowcase

```typescript
// components/landing/feature-showcase.tsx
"use client"

type ModuleData = {
  name: string        // e.g. "Notes"
  label: string       // max 8 words, e.g. "Capture thoughts as they flow"
  description: string // max 20 words
  icon: React.ReactNode
}

// Displays 6 modules in a non-grid organic layout
// Uses connecting visual elements (lines, shared container, overlapping boundaries)
// Each module animates in on scroll with staggered timing
// Semantic: <section> with <ul> containing <li> for each module
```

### WorkflowSection

```typescript
// components/landing/workflow-section.tsx
"use client"

type WorkflowSectionProps = Record<string, never>

// Displays:
// - Section heading about unified workspace
// - Body copy with cross-module interaction example
// - At least 3 concept labels from: command center, keyboard-first,
//   instant capture, connected thinking, spatial computing feel
// - Layered visual elements with z-depth (perspective transforms)
// - Staggered depth animation on scroll
```

### EmotionalHook

```typescript
// components/landing/emotional-hook.tsx
"use client"

type EmotionalHookProps = Record<string, never>

// Renders:
// - Single narrative statement (5-25 words, large cinematic type)
// - Optional secondary sentence (≤ 30 words, muted)
// - Minimal visual: subtle glow/gradient background
// - min-h-[60vh] on desktop, min-h-[50vh] on mobile
// - Content centered vertically and horizontally
// - NO hustle culture language
```

### CTASection

```typescript
// components/landing/cta-section.tsx
"use client"

type CTASectionProps = Record<string, never>

// Renders:
// - Cinematic headline (product-specific emotional language)
// - Primary action button → /login?mode=signup
// - Distinguished visual treatment (gradient bg, glow, or elevated panel)
// - NO generic SaaS language ("Start for free", "Get started", "Try it now")
// - Button: keyboard-navigable, focus indicator, min 44x44 touch target
```

### LandingFooter

```typescript
// components/landing/landing-footer.tsx
// Server Component (no "use client")

type LandingFooterProps = Record<string, never>

// Renders:
// - <footer> landmark with <nav aria-label="Footer">
// - Home OS logo + "© {currentYear} Home OS"
// - Links: /privacy, /terms, /contact
// - Conditional: GitHub + Roadmap links if env vars present
// - text-app-muted, py-8 to py-12
// - Separated from CTA by border-t border-app
```

### useScrollPosition Hook

```typescript
// components/landing/use-scroll-position.ts
"use client"

function useScrollPosition(): number
// Returns current window.scrollY
// Uses passive scroll listener with requestAnimationFrame throttling
// Cleans up on unmount
```

## Data Models

The landing page is entirely static — no database queries, no user data, no API calls. All content is hardcoded in the components.

### Content Constants

```typescript
// components/landing/content.ts

export const HERO_CONTENT = {
  headline: string          // Primary headline text
  subheadline: string       // Supporting copy (≤ 200 chars)
  primaryCTA: {
    label: string           // Button text
    href: string            // "/login"
  }
  secondaryCTA: {
    label: string           // Link text (e.g. "Learn more")
    target: string          // "#philosophy"
  }
}

export const MODULES: ModuleData[] = [
  // 6 modules: Notes, Tasks, Library, Contacts, Reading Room, AI Assistant
  // Each with name, label (≤ 8 words), description (≤ 20 words), icon
]

export const PHILOSOPHY_CONTENT = {
  heading: string
  problem: string
  solution: string
}

export const WORKFLOW_CONTENT = {
  heading: string
  body: string              // Includes cross-module interaction example
  concepts: string[]        // At least 3 from the specified list
}

export const EMOTIONAL_HOOK_CONTENT = {
  narrative: string         // 5-25 words
  secondary?: string        // Optional, ≤ 30 words
}

export const CTA_CONTENT = {
  headline: string          // Product-specific emotional language
  buttonLabel: string       // NOT generic SaaS language
  buttonHref: string        // "/login?mode=signup"
}

// Banned language patterns for content validation
export const BANNED_HUSTLE_WORDS = [
  "hustle", "grind", "10x", "don't miss out",
  "limited time", "act now"
]

export const BANNED_GENERIC_CTA = [
  "start for free", "get started", "try it now"
]
```

### Animation Configuration

```typescript
// components/landing/animation-config.ts

export const SECTION_ANIMATION = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const }
}

export const STAGGER_CHILDREN = {
  container: {
    transition: { staggerChildren: 0.1 }  // 100ms between items
  },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  }
}

export const PARALLAX_CONFIG = {
  rate: 0.2,        // 0.1 to 0.3 relative to scroll
  maxDisplacement: 30  // px
}

export const HOVER_SCALE = {
  whileHover: { scale: 1.03 },
  transition: { duration: 0.18 }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Module content constraints

*For any* module data object in the feature showcase, the label field SHALL contain at most 8 words, the description field SHALL contain at most 20 words, and the icon/visual element SHALL be non-empty.

**Validates: Requirements 5.2**

### Property 2: Banned language exclusion

*For any* text content rendered in the Emotional Hook Section or CTA Section, the text SHALL NOT contain any of the banned hustle-culture words ("hustle", "grind", "10x", "don't miss out", "limited time", "act now") nor any generic SaaS phrases ("Start for free", "Get started", "Try it now") when compared case-insensitively.

**Validates: Requirements 7.5, 8.3**

### Property 3: Section entrance animation configuration

*For any* major section component (Hero, Philosophy, Feature Showcase, Workflow, Emotional Hook, CTA), its Framer Motion entrance animation SHALL use opacity transition from 0 to 1 and vertical translateY from a positive value to 0, with a total duration between 300 and 800 milliseconds, and SHALL trigger only once when 20% of the section enters the viewport.

**Validates: Requirements 11.1, 11.2**

### Property 4: Reduced motion compliance

*For any* animated element on the landing page, when the user's system has `prefers-reduced-motion: reduce` enabled, the element SHALL render in its final visible state immediately without any animation delay or transition.

**Validates: Requirements 11.7**

### Property 5: Interactive element touch targets

*For any* interactive element (button or link) on the landing page when rendered at a viewport width below 1024px, the element SHALL have a minimum clickable area of 44×44 pixels.

**Validates: Requirements 12.7**

## Error Handling

The landing page is a static marketing page with minimal failure modes:

| Scenario | Handling |
|----------|----------|
| Supabase auth check fails (network error) | Treat as unauthenticated — render landing page. The `getUser()` call returns `null` on error, which triggers the landing page path. |
| SVG/CSS mockup rendering issues | All visuals are inline CSS/SVG with no external dependencies. Fallback is the text content which renders without JS. |
| Framer Motion fails to load | The page content is server-rendered. Animations are progressive enhancement — content is visible without JS, just not animated. |
| Image asset fails to load | Use CSS background-color fallback on all image containers. Set explicit width/height to prevent CLS. |
| Environment variables missing (GitHub/Roadmap URLs) | Footer conditionally renders those links only when env vars are present. No error thrown. |
| JavaScript disabled | Above-the-fold content (Navbar + Hero) renders via SSR. Animations don't play but all content is visible. Navigation links work as standard `<a>` tags. |

## Testing Strategy

### Unit Tests (Vitest + Testing Library)

- **Component rendering**: Verify each section component renders required content elements
- **Navbar scroll behavior**: Mock scroll events, verify class changes at 50px threshold
- **Navigation links**: Verify all CTAs point to correct routes with correct query params
- **Accessibility**: Verify semantic landmarks, aria-labels, keyboard navigation
- **Content constraints**: Verify module labels/descriptions meet word count limits
- **Conditional rendering**: Verify footer shows/hides GitHub/Roadmap links based on env vars
- **Metadata**: Verify layout exports correct title, description, and OG tags

### Property-Based Tests (Vitest + fast-check)

The project already has `fast-check` installed. Property tests validate universal invariants:

- **Property 1**: Generate random module data objects → verify word count constraints
- **Property 2**: Generate random text strings → verify banned word detection function correctly identifies violations
- **Property 3**: Extract animation config from section components → verify duration/trigger/transform values are within spec
- **Property 4**: Render components with reduced motion media query → verify no animation classes/styles applied
- **Property 5**: Render interactive elements at mobile viewport → verify computed dimensions ≥ 44×44

**Configuration:**
- Minimum 100 iterations per property test
- Tag format: `Feature: landing-page, Property {N}: {description}`

### Integration Tests

- **Auth routing**: Test that authenticated users get redirected and unauthenticated users see the page
- **Performance budget**: Lighthouse CI checks for LCP, CLS, INP thresholds
- **Responsive layout**: Visual regression at 320px, 375px, 768px, 1024px, 1440px
- **No horizontal overflow**: Automated viewport sweep from 320px to 1024px

### Manual Testing Checklist

- Dark mode visual quality and color consistency
- Animation smoothness at 60fps (Chrome DevTools Performance tab)
- Screen reader navigation flow (VoiceOver/NVDA)
- Keyboard-only navigation through all interactive elements
- Mobile device testing (iOS Safari, Android Chrome)
