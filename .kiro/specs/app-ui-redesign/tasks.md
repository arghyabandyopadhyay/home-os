# Implementation Plan: App UI Redesign

## Overview

This plan transforms the Home OS internal application into a cohesive, immersive experience by enhancing design tokens, upgrading component classes, introducing shared layout components (PageShell, EmptyState, AppModal, FloatingToolbar), redesigning the sidebar and dashboard, enhancing the command menu, implementing the motion system, and updating all module pages. The implementation is additive — extending existing CSS tokens and component classes rather than replacing the architecture.

## Tasks

- [x] 1. Enhance design tokens and component classes in globals.css
  - [x] 1.1 Add new design tokens and update existing component classes
    - Add motion constraint tokens (duration, easing) as CSS custom properties
    - Update `card-app` class: add `backdrop-filter: blur(16px)`, update background to `color-mix(in srgb, var(--home-surface) 70%, transparent)`, add `box-shadow: 0 10px 30px rgba(0,0,0,0.08)` (light) / `0 10px 30px rgba(0,0,0,0.45)` (dark), add hover transition (border opacity 10%→20%, bg opacity 70%→100%, 150-300ms ease)
    - Update `panel-app` class: ensure `backdrop-filter: blur(16px)` and 92% opacity background
    - Update `item-app` class: ensure hover transition completes within 150ms
    - Update `input-app` class: add `focus-visible:ring-0`, focus background shift with 3:1 contrast, border opacity ≤10% at rest
    - Add `stat-card` class: border-radius 1rem, border-app, bg-app-surface, p-4, value text-2xl font-bold, label text-sm text-app-muted
    - Add radial gradient overlay utility for card ambient top-lighting
    - Add `prefers-reduced-motion` overrides to disable hover transitions
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 9.5_

  - [x] 1.2 Write property tests for design token constraints
    - **Property 1: Color token constraint validation**
    - **Validates: Requirements 2.2**

  - [x] 1.3 Write property test for border-radius minimum
    - **Property 3: Content container border-radius minimum**
    - **Validates: Requirements 4.3**

  - [x] 1.4 Write property test for motion system parameter bounds
    - **Property 7: Motion system parameter bounds**
    - **Validates: Requirements 9.1, 9.2, 9.4**

  - [x] 1.5 Write property test for motion easing direction correctness
    - **Property 8: Motion easing direction correctness**
    - **Validates: Requirements 9.6**

  - [x] 1.6 Write property test for animation property constraints
    - **Property 19: Animation uses only non-layout-triggering properties**
    - **Validates: Requirements 17.2**

- [x] 2. Create shared layout components
  - [x] 2.1 Create PageShell component
    - Create `components/layout/page-shell.tsx`
    - Accept props: `title`, `description?`, `actions?`, `children`
    - Render `panel-app` header with title (text-4xl font-bold tracking-tight), optional description (text-app-muted), optional actions (right-aligned)
    - Content area constrained to `max-w-6xl` with `px-6 py-10` padding
    - Use semantic HTML (`header`, `main`, `section`)
    - _Requirements: 1.2, 11.1, 11.2, 11.3, 11.4, 12.1_

  - [x] 2.2 Create EmptyState component
    - Create `components/shared/empty-state.tsx`
    - Accept props: `module`, `icon`, `heading`, `body`, `actionLabel`, `onAction`
    - Render centered content with icon (48px, text-app-muted), heading, body, and single `btn-primary-app` CTA
    - Minimum 64px padding from container edges
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 2.3 Write property test for empty state content validation
    - **Property 9: Empty state content validation**
    - **Validates: Requirements 10.1, 10.4**

  - [x] 2.4 Create AppModal component
    - Create `components/shared/app-modal.tsx`
    - Wrap shadcn Dialog primitive
    - Accept props: `open`, `onOpenChange`, `size?` (sm: max-w-md, md: max-w-lg), `children`
    - Apply backdrop blur 16px on overlay, `panel-app` glassmorphism on content
    - Animate open/close with opacity + scale, 150-300ms
    - Internal padding 1.5rem
    - _Requirements: 4.1, 9.3, 12.2_

  - [x] 2.5 Create FloatingToolbar component
    - Create `components/shared/floating-toolbar.tsx`
    - Accept props: `children`, `position?` (bottom | top)
    - Render `rounded-2xl` with `border-app` and `bg-app-surface`
    - Horizontal button row with `gap-2`
    - Fixed/sticky positioning within content area
    - Ensure all icon-only buttons have `aria-label`
    - _Requirements: 12.3, 16.5_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Redesign Sidebar
  - [x] 4.1 Update Sidebar component with glassmorphism and new interaction patterns
    - Update `components/layout/sidebar.tsx`
    - Apply `backdrop-filter: blur(16px)` with 85-95% background opacity
    - Remove visible right border (rely on translucent surface contrast)
    - Active state: `bg-app-elevated` + 2px left border accent (no solid filled blocks)
    - Hover: background opacity 0% → `bg-app-elevated`, 150-200ms ease
    - Fixed width: 272px
    - Navigation items: `space-y-2` gap, 12px vertical padding each
    - Brand: monospace font, font-semibold, 1.25-1.5rem size
    - Tagline: `text-sm text-app-muted`
    - Mobile: slide-out overlay below 768px via menu button
    - Ensure keyboard navigability and semantic `<nav>` element
    - _Requirements: 4.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 16.2, 16.4, 17.5_

  - [x] 4.2 Write unit tests for Sidebar active state and responsive behavior
    - Test active state updates on route change
    - Test mobile overlay behavior below 768px
    - Test keyboard navigation
    - _Requirements: 7.3, 7.7, 17.5_

- [x] 5. Redesign Dashboard with Quick Capture
  - [x] 5.1 Update Dashboard page with redesigned layout
    - Update `app/(app)/dashboard/page.tsx`
    - Wrap in PageShell component
    - Time-aware greeting (morning 0-11, afternoon 12-16, evening 17-23) with user's first name, date, contextual subtitle
    - Quick Capture widget at top of content area
    - Activity sections: focus tasks (max 8), pinned/recent notes (max 6), currently reading (max 3), favorite contacts (max 4)
    - Single-column or asymmetric grid (max 3 columns at widest breakpoint)
    - Order: tasks by due date ascending (overdue first), notes/books by updated_at descending
    - Empty state messages for empty sections (not hidden, not blank)
    - No numeric analytics charts or percentage dashboards
    - Stat cards using new `stat-card` class
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 5.2 Write property test for time-aware greeting correctness
    - **Property 5: Time-aware greeting correctness**
    - **Validates: Requirements 8.4**

  - [x] 5.3 Write property test for dashboard section item limits
    - **Property 4: Dashboard section item limits**
    - **Validates: Requirements 8.1**

  - [x] 5.4 Write property test for dashboard section ordering
    - **Property 6: Dashboard section ordering**
    - **Validates: Requirements 8.6**

- [x] 6. Enhance Command Menu
  - [x] 6.1 Update Command Menu with glassmorphism and enhanced UX
    - Update `components/layout/command-menu.tsx`
    - Apply `panel-app` glassmorphism: `backdrop-blur-2xl`, `border-white/10`, `shadow-2xl`, `rounded-2xl`
    - Blur-in entrance animation (150-300ms), fade-out exit (150-300ms)
    - When search empty: show "Quick actions" group (New note, New task) and "Go to" group (all nav destinations with icons)
    - Debounced search (≤500ms after last keystroke)
    - Results grouped by category with heading labels and icons
    - Max 5 results per category
    - Keyboard navigation with visible focus indicator
    - "No results" empty state when search returns zero matches
    - Dismiss on Escape or backdrop click
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

  - [x] 6.2 Write property test for command menu result category limits
    - **Property 13: Command menu result category limits**
    - **Validates: Requirements 14.3**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Update Module Pages to use PageShell and new component system
  - [x] 8.1 Update Notes module pages
    - Update `app/(app)/notes/page.tsx` and `app/(app)/notes/[id]/page.tsx`
    - Wrap in PageShell with title, description, and action buttons
    - Use `card-app` for content cards, `item-app` for list items, `input-app` for inputs
    - Add EmptyState component when no notes exist
    - Limit displayed items to 5 per section with progressive disclosure
    - Apply `text-app-muted` for secondary metadata
    - _Requirements: 11.1, 11.2, 11.3, 11.5, 13.3, 13.4_

  - [x] 8.2 Update Tasks module page
    - Update `app/(app)/tasks/page.tsx`
    - Wrap in PageShell with title, description, and action buttons
    - Use `card-app` for content cards, `item-app` for task list items
    - Add EmptyState component when no tasks exist
    - Limit displayed items to 5 per section with progressive disclosure
    - _Requirements: 11.1, 11.2, 11.3, 11.5, 13.3_

  - [x] 8.3 Update Calendar module page
    - Update `app/(app)/calendar/page.tsx`
    - Wrap in PageShell with title, description, and action buttons
    - Use `card-app` for event cards
    - Add EmptyState component when no events exist
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 8.4 Update Library module page
    - Update `app/(app)/library/page.tsx`
    - Wrap in PageShell with title, description, and action buttons
    - Use `card-app` for book cards, `item-app` for list items
    - Add EmptyState component when no books exist
    - Limit displayed items to 5 per section
    - _Requirements: 11.1, 11.2, 11.3, 11.5, 13.3_

  - [x] 8.5 Update Documents module pages
    - Update `app/(app)/documents/page.tsx` and `app/(app)/documents/[id]/page.tsx`
    - Wrap in PageShell with title, description, and action buttons
    - Use `card-app` for document cards, `item-app` for list items
    - Add EmptyState component when no documents exist
    - Allocate ≥70% viewport width to editor on screens ≥1024px
    - _Requirements: 11.1, 11.2, 11.3, 11.5, 13.6, 13.7_

  - [x] 8.6 Update Contacts module page
    - Update `app/(app)/contacts/page.tsx`
    - Wrap in PageShell with title, description, and action buttons
    - Use `card-app` for contact cards, `item-app` for list items
    - Add EmptyState component when no contacts exist
    - Limit displayed items to 5 per section
    - _Requirements: 11.1, 11.2, 11.3, 11.5, 13.3_

  - [x] 8.7 Update Settings module page
    - Update `app/(app)/settings/page.tsx`
    - Wrap in PageShell with title and description
    - Use `card-app` for settings sections, `input-app` for form inputs
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 9. Implement motion system and reduced-motion support
  - [x] 9.1 Add Framer Motion page transitions and hover animations
    - Create motion utility wrapper or hook for consistent animation configs
    - Implement fade transitions (opacity 0→1, 150-300ms) for page/section reveals
    - Implement hover scale (1.02-1.05) + opacity shift (≤0.1) on interactive cards/buttons (150-200ms)
    - Implement modal/overlay backdrop blur (4-12px) with fade-in (100-200ms)
    - Use ease-out for entrances, ease-in for exits
    - Only animate `transform` and `opacity` (no layout-triggering properties)
    - No spring/bounce, no rotation >10°, no displacement >30px
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6, 17.2_

  - [x] 9.2 Implement prefers-reduced-motion support
    - Detect `prefers-reduced-motion: reduce` via CSS media query and JS hook
    - Disable all animations and transitions (except focus indicators)
    - Display elements in final state immediately
    - Ensure card hover transitions are disabled
    - _Requirements: 5.6, 9.5, 17.7_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Accessibility and performance validation
  - [x] 11.1 Ensure accessibility compliance across all redesigned components
    - Verify minimum contrast ratio 4.5:1 for normal text, 3:1 for large text on all surfaces including glassmorphism
    - Verify visible focus indicators (2px outline or equivalent, 3:1 contrast against adjacent colors) on all interactive elements
    - Verify semantic HTML usage (nav, main, section, header, button)
    - Verify all icon-only elements have descriptive `aria-label`
    - Verify keyboard navigability with logical tab order
    - Add solid fallback background where glassmorphism reduces contrast below threshold
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [x] 11.2 Write property test for text contrast ratio compliance
    - **Property 15: Text contrast ratio compliance**
    - **Validates: Requirements 16.1, 16.6**

  - [x] 11.3 Write property test for focus indicator contrast
    - **Property 16: Focus indicator contrast**
    - **Validates: Requirements 6.3, 16.3**

  - [x] 11.4 Write property test for icon-only accessible labels
    - **Property 17: Icon-only elements have accessible labels**
    - **Validates: Requirements 16.5**

  - [x] 11.5 Write property test for maximum simultaneous blur layers
    - **Property 18: Maximum simultaneous blur layers**
    - **Validates: Requirements 17.1**

  - [x] 11.6 Write property test for interactive element touch targets
    - **Property 20: Interactive element minimum touch target**
    - **Validates: Requirements 17.4**

- [x] 12. Performance optimization and graceful degradation
  - [x] 12.1 Implement low-memory and unsupported browser fallbacks
    - Detect `navigator.deviceMemory ≤ 4` or no `backdrop-filter` support
    - Disable all backdrop-blur effects and use solid backgrounds
    - Limit box-shadow to single layer
    - Ensure content remains accessible at all viewport widths (375px to 2560px)
    - No horizontal overflow or overlapping elements
    - _Requirements: 17.1, 17.4, 17.6_

  - [x] 12.2 Verify landing page preservation
    - Confirm no files modified in `app/(marketing)/` or `components/landing/`
    - Confirm no existing CSS custom property values changed for landing page context
    - Scope any new token overrides to `app/(app)/` route group
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 12.3 Write property test for landing page token preservation
    - **Property 14: Landing page token preservation**
    - **Validates: Requirements 15.3**

- [x] 13. Cognitive load and content constraints validation
  - [x] 13.1 Write property test for cognitive load section limit
    - **Property 10: Cognitive load section limit**
    - **Validates: Requirements 13.1**

  - [x] 13.2 Write property test for spacing minimums
    - **Property 11: Spacing minimums**
    - **Validates: Requirements 13.2**

  - [x] 13.3 Write property test for list display item limits
    - **Property 12: List display item limits**
    - **Validates: Requirements 13.3**

  - [x] 13.4 Write property test for typography scale ratio
    - **Property 2: Typography scale ratio**
    - **Validates: Requirements 3.5**

- [x] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific rendering scenarios and edge cases
- The implementation is additive — existing component classes are enhanced, not replaced
- All changes are scoped to the `(app)` route group; the `(marketing)` route group remains untouched
- TypeScript with React 19 / Next.js 16 App Router is used throughout
- Framer Motion handles animations; Vitest + fast-check handle testing

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "1.6", "2.1", "2.2", "2.4", "2.5"] },
    { "id": 2, "tasks": ["2.3", "4.1", "6.1"] },
    { "id": 3, "tasks": ["4.2", "5.1", "6.2"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4", "8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7"] },
    { "id": 5, "tasks": ["9.1", "9.2"] },
    { "id": 6, "tasks": ["11.1", "12.1", "12.2"] },
    { "id": 7, "tasks": ["11.2", "11.3", "11.4", "11.5", "11.6", "12.3", "13.1", "13.2", "13.3", "13.4"] }
  ]
}
```
