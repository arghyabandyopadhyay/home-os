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
| `card-app` | Standard content cards |
| `item-app` | List items with hover state |
| `input-app` | Text inputs and textareas |
| `btn-primary-app` | Primary action buttons |
| `link-muted` | Subtle navigation links |

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

## Animations

Framer Motion is available for transitions. Keep animations subtle:
- Prefer `opacity` and `y` transforms, short durations (150–300ms).
- Do not add animations to every element — reserve them for meaningful state changes (page transitions, modal open/close).

## Accessibility

- All interactive elements must be keyboard-accessible and have visible focus styles.
- Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<header>`, `<button>`, etc.).
- Icon-only buttons must have an `aria-label`.
- Color alone must not convey meaning — pair color with text or icons.
