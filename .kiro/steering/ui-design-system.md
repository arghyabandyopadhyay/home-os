# Home OS — UI & Design System

## Design Philosophy

Home OS should feel **calm, minimal, and emotionally safe**. Avoid busy layouts, aggressive colors, heavy shadows, or anything that feels like a productivity dashboard. Every screen should feel like a quiet place to think.

## CSS Architecture

Tailwind CSS v4 is used with a custom design token layer defined in `app/globals.css`. There is no `tailwind.config.js` — configuration is done via `@theme` in the CSS file.

### App-Specific Utility Classes

Always prefer these semantic classes over raw Tailwind colors:

| Class | Use for |
|---|---|
| `bg-app` | Page/screen background |
| `bg-app-surface` | Cards, panels, sidebars |
| `bg-app-elevated` | Hover states, inputs, nested surfaces |
| `text-app` | Primary text |
| `text-app-muted` | Secondary/hint text |
| `border-app` | All borders |

### Component Classes

These are defined in `@layer components` in `globals.css`:

| Class | Use for |
|---|---|
| `panel-app` | Large frosted-glass panels (e.g. dashboard header) |
| `card-app` | Standard content cards (glassmorphism + hover) |
| `item-app` | List items with hover state |
| `input-app` | Text inputs and textareas |
| `btn-primary-app` | Primary action buttons |
| `link-muted` | Subtle navigation links |
| `stat-card` | Stat/metric display cards |
| `card-ambient-light` | Adds subtle radial gradient top-lighting to cards |

**Do not** use raw Tailwind background/text color classes (`bg-white`, `text-gray-500`, etc.) for structural UI. Use the semantic classes above so light/dark mode works automatically.

## shadcn/ui

- Components are in `components/ui/`. Add new shadcn components with `npx shadcn add <component>`.
- The icon library is **Phosphor** (configured in `components.json`), but the codebase also uses **Lucide React** — both are acceptable.
- Style is `radix-lyra` with `neutral` base color and CSS variables enabled.

## Dark Mode

- Dark mode is toggled by adding the `.dark` class to `<html>`.
- All `--home-*` CSS variables have both `:root` (light) and `.dark` overrides in `globals.css`.
- Never hardcode light or dark colors. Always use the semantic token classes.

## Typography

- The entire app uses a **monospace font** (`font-mono` applied to `html` in globals).
- Headings use `font-semibold` or `font-bold` with `tracking-tight`.
- Body text is regular weight. Muted text uses `text-app-muted`.

## Layout & Spacing

- Max content width: `max-w-6xl` with `px-6 py-10` padding.
- Section spacing: `space-y-8` between major dashboard sections.
- Card internal padding: `p-6` for cards, `p-4` for list items.
- Border radius: use Tailwind's `rounded-xl` (items), `rounded-2xl` (cards), `rounded-3xl` (panels). Avoid `rounded-full` except for avatars/badges.

## Shared Components

Reusable UI primitives live in `components/shared/`:

| Component | Use for |
|---|---|
| `EmptyState` | Zero-data states in any module (icon + heading + body + CTA) |
| `FloatingToolbar` | Sticky contextual action bars (has `role="toolbar"`) |
| `AppModal` | Standard modal dialog (uses Radix Dialog + `panel-app` styling) |

Use these instead of building one-off equivalents per feature.

## Animations & Motion System

Framer Motion is available for transitions. A centralized motion config lives in `lib/motion.ts`.

### Constraints (enforced by property tests)

- Duration: 150–300ms for reveals, 150–200ms for hover
- Easing: `ease-out` for entrances, `ease-in` for exits
- Only animate `transform` and `opacity` — no layout-triggering properties
- No spring/bounce physics
- Displacement ≤ 30px, rotation ≤ 10°
- Hover scale: 1.02–1.05, hover opacity shift ≤ 0.1

### CSS Motion Tokens

Defined in `globals.css` as custom properties:

```
--motion-duration-fast: 150ms
--motion-duration-normal: 200ms
--motion-duration-slow: 300ms
--motion-easing-entrance: ease-out
--motion-easing-exit: ease-in
```

Use these in component-class transitions rather than hardcoding values.

### Usage

Import presets from `lib/motion.ts`:
```ts
import { fadeReveal, staggerContainer, staggerItem, transitionEntrance } from "@/lib/motion"
```

For JS-driven animations, use the `useReducedMotion()` hook from `hooks/use-reduced-motion.ts` to skip animations when the user prefers reduced motion.

## Performance Detection

The app detects low-performance devices and degrades gracefully:

- **Hook**: `useLowPerformance()` in `hooks/use-low-performance.ts` — detects low RAM (≤ 4 GB) or missing `backdrop-filter` support.
- **Provider**: `LowPerformanceDetector` in `components/providers/` — adds `.low-perf` class to `<html>`.
- **CSS fallbacks**: `globals.css` includes `html.low-perf` rules that disable backdrop-blur and use solid backgrounds.

When `.low-perf` is active, avoid adding new backdrop-blur effects.

## Reduced Motion

- CSS: `@media (prefers-reduced-motion: reduce)` in `globals.css` disables all CSS transitions/animations globally (except focus indicators).
- JS: `useReducedMotion()` hook returns `true` when OS-level reduced motion is enabled. Use it to set Framer Motion duration to 0.
- Helper functions `getMotionTransition()` and `getMotionProps()` in the same file handle the pattern.

## Accessibility

- All interactive elements must be keyboard-accessible and have visible focus styles.
- Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<header>`, `<button>`, etc.).
- Icon-only buttons must have an `aria-label`.
- Color alone must not convey meaning — pair color with text or icons.
- Navigation links use `aria-current="page"` for the active route.
- Icons in navigation use `aria-hidden="true"`.
- The `FloatingToolbar` component uses `role="toolbar"` with an `aria-label`.
