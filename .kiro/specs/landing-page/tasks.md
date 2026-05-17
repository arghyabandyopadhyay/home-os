# Implementation Plan: Landing Page

## Overview

Build a premium marketing landing page at `/` for unauthenticated visitors using a route group architecture. The page communicates Home OS's philosophy through cinematic storytelling, scroll-driven Framer Motion animations, and immersive dark-mode visuals. The implementation uses a `(marketing)` route group with a dedicated layout that excludes the app shell, component-per-section architecture in `components/landing/`, shared animation utilities, and static content constants. Authenticated users are redirected to `/dashboard` server-side.

## Tasks

- [x] 1. Route group setup and layout restructuring
  - [x] 1.1 Create the (marketing) route group with dedicated layout
    - Create `app/(marketing)/layout.tsx` with minimal HTML structure
    - Force dark mode by adding `dark` class to `<html>` element
    - Apply `font-mono` to html element for monospace typography
    - Exclude sidebar, header, and command menu components
    - Set SEO metadata: `<title>`, `<meta name="description">` (50-160 chars), Open Graph tags (`og:title`, `og:description`, `og:type`)
    - _Requirements: 1.3, 1.4, 10.1, 10.5_

  - [x] 1.2 Create the (marketing) landing page with auth redirect
    - Create `app/(marketing)/page.tsx` as a Server Component
    - Check Supabase auth state using `getUser()`
    - If authenticated → `redirect("/dashboard")` server-side
    - If unauthenticated → render the `LandingPage` component
    - Set `export const dynamic = "force-dynamic"` for auth check
    - _Requirements: 1.1, 1.2_

  - [x] 1.3 Move existing app routes under (app) route group
    - Create `app/(app)/layout.tsx` with the existing root layout content (sidebar, header, command menu, AppProviders)
    - Move all authenticated routes (dashboard, calendar, notes, tasks, library, contacts, documents, settings, reader) under `app/(app)/`
    - Update the root `app/layout.tsx` to be a minimal shell (html/body only, shared globals.css)
    - Verify middleware matcher paths still work with route groups
    - _Requirements: 1.3_

- [x] 2. Shared animation utilities and content constants
  - [x] 2.1 Create animation configuration constants
    - Create `components/landing/animation-config.ts`
    - Define `SECTION_ANIMATION` with initial/animate/viewport/transition values
    - Define `STAGGER_CHILDREN` container and item variants
    - Define `PARALLAX_CONFIG` with rate (0.2) and maxDisplacement (30px)
    - Define `HOVER_SCALE` with whileHover scale (1.03) and duration (180ms)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 2.2 Create SectionReveal animation wrapper component
    - Create `components/landing/section-reveal.tsx` as a client component
    - Accept props: `children`, `className`, `delay`, `direction`, `distance`, `duration`
    - Use Framer Motion `motion.div` with `whileInView` and `viewport: { once: true, amount: 0.2 }`
    - Implement `prefers-reduced-motion` check — render children without animation when enabled
    - Use fade (opacity 0→1) and vertical translate (y: distance → 0) as default animation
    - _Requirements: 11.1, 11.2, 11.7_

  - [x] 2.3 Create useScrollPosition hook
    - Create `components/landing/use-scroll-position.ts` as a client hook
    - Return current `window.scrollY` value
    - Use passive scroll listener with `requestAnimationFrame` throttling
    - Clean up listener on unmount
    - _Requirements: 2.5, 2.6_

  - [x] 2.4 Create static content constants
    - Create `components/landing/content.ts`
    - Define `HERO_CONTENT` with headline, subheadline (≤200 chars), primaryCTA, secondaryCTA
    - Define `MODULES` array with 6 modules (Notes, Tasks, Library, Contacts, Reading Room, AI Assistant) — each with name, label (≤8 words), description (≤20 words), icon identifier
    - Define `PHILOSOPHY_CONTENT` with heading, problem, solution
    - Define `WORKFLOW_CONTENT` with heading, body (cross-module example), concepts (≥3)
    - Define `EMOTIONAL_HOOK_CONTENT` with narrative (5-25 words), optional secondary (≤30 words)
    - Define `CTA_CONTENT` with headline, buttonLabel, buttonHref
    - Define `BANNED_HUSTLE_WORDS` and `BANNED_GENERIC_CTA` arrays
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 5.1, 5.2, 6.1, 6.2, 7.1, 7.5, 8.1, 8.3_

  - [x] 2.5 Write property test for module content constraints (Property 1)
    - **Property 1: Module content constraints**
    - **Validates: Requirements 5.2**
    - Test file: `__tests__/landing/content-constraints.property.test.ts`
    - Verify each module label ≤ 8 words, description ≤ 20 words, icon non-empty
    - Generate random module data objects and validate constraints

  - [x] 2.6 Write property test for banned language exclusion (Property 2)
    - **Property 2: Banned language exclusion**
    - **Validates: Requirements 7.5, 8.3**
    - Test file: `__tests__/landing/banned-language.property.test.ts`
    - Verify all content constants do not contain banned hustle-culture words or generic SaaS phrases
    - Generate random text strings and verify the detection function correctly identifies violations

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Navbar component
  - [x] 4.1 Implement LandingNavbar component
    - Create `components/landing/landing-navbar.tsx` as a client component
    - Render `<nav aria-label="Main">` with logo, product name (left-aligned), "Log in" button and "Sign up" primary button (right-aligned)
    - "Log in" navigates to `/login`, "Sign up" navigates to `/login?mode=signup`
    - Use `useScrollPosition` hook to detect scroll > 50px
    - At top: fully transparent background, no border
    - After 50px scroll: translucent background with `backdrop-blur-[12px]`, 1px bottom border using `border-app` token, 200ms transition
    - Fixed positioning with sufficient z-index to overlay all content
    - All interactive elements keyboard-navigable with visible focus rings
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 5. Hero section and UI mockup
  - [x] 5.1 Implement HeroSection component
    - Create `components/landing/hero-section.tsx` as a client component
    - Display primary headline with large typography (text-5xl md:text-6xl lg:text-7xl, min 48px desktop / 32px mobile)
    - Display supporting copy (≤200 chars) in `text-app-muted`
    - Primary CTA button using `btn-primary-app` style → `/login`
    - Secondary link using `link-muted` → smooth scroll to `#philosophy`
    - Full viewport height (min-h-screen) on desktop, content-height with min 48px padding on mobile
    - Content centered vertically and horizontally
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7, 3.8_

  - [x] 5.2 Implement UIMockup component
    - Create `components/landing/ui-mockup.tsx` as a client component
    - Build pure CSS/SVG mockup with at least two layered rectangular elements
    - Apply visible depth separation (offset positioning, shadows)
    - Entrance animation: staggered opacity + translateY on each layer (500-1000ms total)
    - No external images — all built with divs, borders, gradients
    - _Requirements: 3.5, 3.6_

- [x] 6. Philosophy and Feature sections
  - [x] 6.1 Implement PhilosophySection component
    - Create `components/landing/philosophy-section.tsx` as a client component
    - Add `id="philosophy"` for smooth scroll target
    - Communicate problem: digital fragmentation across disconnected tools
    - Present solution: one unified environment for all digital thinking
    - Section heading conveying "Your digital life deserves one home" or equivalent
    - Calm, spacious typography with min 32px vertical spacing between text blocks, min 48px vertical padding
    - Scroll-triggered animation: fade + translate with staggered timing (100-150ms between children) at 20% viewport intersection
    - Wrap content in `SectionReveal`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.2 Implement FeatureShowcase component
    - Create `components/landing/feature-showcase.tsx` as a client component
    - Display 6 modules from `MODULES` constant: Notes, Tasks, Library, Contacts, Reading Room, AI Assistant
    - Each module: concise label (≤8 words), brief description (≤20 words), representative icon
    - Present as unified ecosystem using integration technique (connecting lines, overlapping boundaries, shared container, or spatial proximity)
    - NOT a uniform grid of equal-sized cards
    - Scroll-triggered fade animation (300-600ms) per module element
    - Semantic markup: `<section>` with `<ul>` containing `<li>` for each module
    - Text alternatives for visual elements, accessible to screen readers
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 7. Workflow and Emotional Hook sections
  - [x] 7.1 Implement WorkflowSection component
    - Create `components/landing/workflow-section.tsx` as a client component
    - Section heading + body copy describing unified workspace with cross-module interaction example
    - Reference at least 3 concepts: command center, keyboard-first, instant capture, connected thinking, spatial computing feel
    - At least 2 visual elements with overlapping layers or perspective transforms for depth
    - Content at minimum 2 distinct depth levels (z-depth, perspective/3D transforms)
    - Staggered depth animation on scroll (400-1000ms total, 50-150ms between layers) at 20% viewport intersection
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 7.2 Implement EmotionalHook component
    - Create `components/landing/emotional-hook.tsx` as a client component
    - Single narrative statement (5-25 words) reinforcing calm technology / digital clarity themes
    - Large cinematic typography (min 36px desktop, min 24px mobile)
    - min-h-[60vh] desktop, min-h-[50vh] mobile, content centered vertically and horizontally
    - Minimal visuals: subtle glow/gradient background, no illustrations or UI previews
    - Optional secondary sentence (≤30 words) in muted text, smaller font
    - NO hustle culture language
    - Fade animation (400-800ms) on viewport entry
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 8. CTA section and Footer
  - [x] 8.1 Implement CTASection component
    - Create `components/landing/cta-section.tsx` as a client component
    - Cinematic headline (min 36px desktop, min 28px mobile) with product-specific emotional language
    - Primary action button → `/login?mode=signup`
    - NO generic SaaS language ("Start for free", "Get started", "Try it now")
    - Distinguished visual treatment: subtle gradient, elevated panel, or ambient glow
    - Content centered with min 80px vertical padding desktop, min 48px mobile
    - Button: keyboard-navigable, visible focus indicator, min 44x44px touch target
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 8.2 Implement LandingFooter component
    - Create `components/landing/landing-footer.tsx` as a Server Component (no "use client")
    - `<footer>` landmark with `<nav aria-label="Footer">`
    - Home OS logo + "© {currentYear} Home OS"
    - Links: Privacy Policy (`/privacy`), Terms of Service (`/terms`), Contact (`/contact`)
    - Conditional GitHub + Roadmap links if env vars present
    - `text-app-muted` color, py-6 to py-12 vertical padding
    - Separated from CTA by `border-t border-app` or min 32px top margin
    - All links keyboard-navigable with visible focus indicators
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Page assembly and parallax background
  - [x] 10.1 Create ParallaxBackground decorative component
    - Create `components/landing/parallax-background.tsx` as a client component
    - Render decorative background elements (soft glows, gradient orbs)
    - Apply parallax movement at rate 0.1-0.3 relative to scroll speed
    - Max displacement of 30px
    - Disable parallax on mobile (below 768px) for performance
    - Use `pointer-events-none` and `fixed inset-0` positioning
    - _Requirements: 11.4, 12.4_

  - [x] 10.2 Assemble LandingPage with all sections
    - Wire all section components together in `app/(marketing)/page.tsx`
    - Render in order: LandingNavbar, ParallaxBackground, HeroSection, PhilosophySection, FeatureShowcase, WorkflowSection, EmotionalHook, CTASection, LandingFooter
    - Ensure above-the-fold content (Navbar + Hero) renders without client JS for initial text/layout
    - Verify no orphaned or unused imports
    - _Requirements: 1.1, 1.4, 13.4_

- [x] 11. Responsive design and performance
  - [x] 11.1 Implement responsive breakpoint adaptations
    - Verify all sections adapt for mobile (<768px), tablet (768-1024px), desktop (>1024px)
    - Mobile: stack content vertically, min 24px spacing between blocks, min 48px between sections
    - Mobile: reduce heading sizes (min 28px primary, min 20px secondary)
    - Mobile: limit animations to simple opacity fades (no parallax, no stagger, no depth effects)
    - Tablet: single-column text, side-by-side visuals where space permits, min 32px horizontal padding
    - Preserve dark palette, monospace font, and typographic hierarchy across all breakpoints
    - Ensure min 44x44px touch targets on viewports below 1024px
    - No horizontal overflow from 320px to 1024px
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

  - [x] 11.2 Implement performance optimizations
    - Ensure no pure black (#000000) backgrounds, no high-saturation colors (>60% HSL)
    - Apply glassmorphism (backdrop-blur 12-20px, bg alpha 0.7-0.92) to elevated elements
    - Use consistent 8px spacing rhythm throughout
    - Lazy-load below-fold visual elements exceeding 50KB
    - Use WebP/SVG for all visual assets (max 200KB per asset)
    - Ensure total page weight ≤ 1.5MB on initial load
    - Maintain 60fps during scroll animations (no frame > 16ms main-thread)
    - CSS fallbacks for failed visual assets (solid color/gradient, explicit dimensions)
    - _Requirements: 10.2, 10.3, 10.4, 10.6, 13.1, 13.2, 13.3, 13.5, 13.6, 13.7, 13.8, 13.9_

  - [x] 11.3 Write property test for section animation configuration (Property 3)
    - **Property 3: Section entrance animation configuration**
    - **Validates: Requirements 11.1, 11.2**
    - Test file: `__tests__/landing/animation-config.property.test.ts`
    - Verify all section animation configs use opacity 0→1, translateY positive→0, duration 300-800ms, trigger once at 20% viewport

  - [x] 11.4 Write property test for reduced motion compliance (Property 4)
    - **Property 4: Reduced motion compliance**
    - **Validates: Requirements 11.7**
    - Test file: `__tests__/landing/reduced-motion.property.test.ts`
    - Render section components with `prefers-reduced-motion: reduce` media query mocked
    - Verify no animation styles/classes applied, content visible immediately

  - [x] 11.5 Write property test for interactive element touch targets (Property 5)
    - **Property 5: Interactive element touch targets**
    - **Validates: Requirements 12.7**
    - Test file: `__tests__/landing/touch-targets.property.test.ts`
    - Render interactive elements (buttons, links) at mobile viewport width (<1024px)
    - Verify computed clickable area ≥ 44×44 pixels

- [x] 12. Accessibility verification
  - [x] 12.1 Verify accessibility across all landing page components
    - Ensure Navbar uses `<nav aria-label="Main">` with keyboard Tab navigation and focus rings
    - Ensure Footer uses `<footer>` landmark with `<nav aria-label="Footer">`
    - Ensure Feature Showcase uses semantic list markup (`<ul>/<li>`) with text alternatives for icons
    - Ensure all buttons have sufficient contrast, focus indicators, and aria-labels where needed
    - Ensure CTA buttons have min 44x44px touch targets
    - Ensure color alone does not convey meaning
    - _Requirements: 2.8, 5.7, 8.6, 9.6_

  - [x] 12.2 Write unit tests for accessibility landmarks and navigation
    - Test file: `__tests__/landing/accessibility.test.ts`
    - Verify semantic landmarks present (nav, footer, section, main)
    - Verify aria-labels on navigation elements
    - Verify all interactive elements are keyboard-reachable
    - Verify no missing alt text on visual elements
    - _Requirements: 2.8, 5.7, 8.6, 9.6_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The landing page is entirely static — no database queries or API calls needed
- All visual elements are CSS/SVG-based to stay within the 1.5MB page weight budget
- Framer Motion animations are progressive enhancement — content is visible without JS via SSR
- The route group approach (`(marketing)` / `(app)`) is the architecturally correct Next.js pattern for separate layouts
- Task 1.3 (moving routes) is the largest structural change — verify middleware and navigation still work after

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1"] },
    { "id": 1, "tasks": ["1.3", "2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["2.5", "2.6", "4.1"] },
    { "id": 3, "tasks": ["5.1", "5.2"] },
    { "id": 4, "tasks": ["6.1", "6.2"] },
    { "id": 5, "tasks": ["7.1", "7.2"] },
    { "id": 6, "tasks": ["8.1", "8.2"] },
    { "id": 7, "tasks": ["10.1", "10.2"] },
    { "id": 8, "tasks": ["11.1", "11.2"] },
    { "id": 9, "tasks": ["11.3", "11.4", "11.5"] },
    { "id": 10, "tasks": ["12.1", "12.2"] }
  ]
}
```
