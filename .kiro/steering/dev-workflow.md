# Home OS — Dev Workflow

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Start production server | `npm run start` |
| Lint | `npm run lint` |
| Run tests (single run) | `npm run test` |
| Run tests (watch mode) | `npm run test:watch` |

The test runner is **Vitest** with `@testing-library/react`, `jsdom`, and `fast-check` for property-based tests. Config is in `vitest.config.ts` with setup in `vitest.setup.ts`. Tests live in `__tests__/`.

## Environment Variables

Required in `.env.local` (never commit this file):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REDIRECT_URI=
GOOGLE_BOOKS_API_KEY=
```

Optional (falls back to calendar credentials if not set):
```
GOOGLE_CONTACTS_CLIENT_ID=
GOOGLE_CONTACTS_CLIENT_SECRET=
```

`NEXT_PUBLIC_` variables are exposed to the browser. Keep secrets (Google OAuth credentials, service role keys) in non-prefixed variables and access them only in server-side code.

## Adding a New Feature Module

Follow this checklist when adding a new section to the app:

1. **Type** — add a `types/<feature>.ts` file with the row type.
2. **Lib** — add a `lib/<feature>.ts` file with all data access functions (server-side, using `@/lib/supabase/server`).
3. **Migration** — add a SQL file in `supabase/migrations/` to create the table with RLS policies.
4. **Page** — add `app/(app)/<feature>/page.tsx` as a Server Component. Fetch data here, pass as props.
5. **Components** — add `components/<feature>/` directory with client components for interactivity.
6. **Sidebar** — add the route to the `items` array in `components/layout/sidebar.tsx`.
7. **Middleware** — add the route to `protectedRoutes` and `matcher` in `app/middleware.ts`.
8. **Types** — regenerate `types/database.ts` after the migration runs.

## shadcn Components

Add new shadcn primitives with:
```bash
npx shadcn add <component-name>
```

They land in `components/ui/`. Do not edit generated shadcn files directly — extend them via wrapper components instead.

## Supabase Local Dev

```bash
npx supabase start          # start local Supabase stack
npx supabase db reset       # reset and re-run all migrations
npx supabase gen types typescript --local > types/database.ts
```

## Git Conventions

- Branch from `main` for all changes.
- Branch names: `feat/<short-description>`, `fix/<short-description>`.
- Keep commits focused — one logical change per commit.
- Never commit `.env.local` or any file containing secrets.

## Deployment

The app deploys to **Vercel**. Pushing to `main` triggers a production deploy. Environment variables must be set in the Vercel project dashboard — they are not read from `.env.local` in production.

Image domains allowed by `next.config.ts`:
- `covers.openlibrary.org` (https + http)
- `books.google.com` (https + http)
- `lh3.googleusercontent.com` (https)
- `avatars.githubusercontent.com` (https)

Add new external image domains to `next.config.ts` → `images.remotePatterns` before using `next/image` with them.
