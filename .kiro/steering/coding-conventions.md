# Home OS — Coding Conventions

## TypeScript

- Strict mode is enabled. No `any`, no `!` non-null assertions unless unavoidable.
- Use the generated `Database` type from `types/database.ts` for all Supabase queries.
- Feature-specific types live in `types/*.ts` (e.g. `types/task.ts`, `types/note.ts`). Add new types there, not inline.
- Prefer `type` over `interface` for object shapes.

## File & Component Naming

- React components: PascalCase files and exports (`NoteEditor.tsx`, `export function NoteEditor`).
- Utility/lib files: camelCase (`lib/notes.ts`, `lib/date.ts`).
- One primary export per file. Co-locate small helper components in the same file only if they are never used elsewhere.

## Server vs Client Components

- Pages in `app/` are **Server Components by default**. Keep them that way — fetch data at the top, pass props down.
- Add `"use client"` only when the component needs browser APIs, event handlers, or React state/effects.
- Never call `createClient` from `@/lib/supabase/server` inside a `"use client"` component. Use `@/lib/supabase/client` there instead.

## Data Fetching Patterns

- **Server components / Route Handlers**: use `createClient()` from `@/lib/supabase/server` (async, cookie-based).
- **Client components**: use `createClient()` from `@/lib/supabase/client` (browser client).
- **Do not** import the bare `supabase` singleton from `lib/supabase.ts` — it has no auth context. Use the SSR-aware clients above.
- All data access logic belongs in `lib/*.ts`, not inside components.

## Optimistic UI

- Client components that mutate data (tasks, notes, contacts) should apply optimistic state updates immediately, then sync to Supabase in the background.
- On error, show a `toast.error(...)` via Sonner and revert state if needed.
- See `components/tasks/tasks-list.tsx` for the canonical pattern.

## Path Aliases

- Always use `@/` for imports (maps to the repo root). Never use relative `../../` paths.

## Linting & Formatting

- ESLint config is in `eslint.config.mjs`. Run `npm run lint` before committing.
- No Prettier config — keep formatting consistent with what ESLint enforces.

## Next.js Version Note

This project uses **Next.js 16** with the App Router. APIs and conventions may differ from your training data. Read `node_modules/next/dist/docs/` before writing any Next.js-specific code. Heed deprecation notices.
