# Home OS

A calm personal organization platform built with Next.js. Home OS is a quiet space to manage your notes, tasks, calendar, contacts, and reading — without the noise of typical productivity tools.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19
- **Database / Auth / Storage**: Supabase (PostgreSQL + RLS + Buckets)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **State**: Zustand (global), TanStack Query (server state)
- **Icons**: Lucide React + Phosphor Icons
- **Toasts**: Sonner
- **Animations**: Framer Motion
- **Hosting**: Vercel

## Modules

| Module | Route |
|--------|-------|
| Dashboard | `/dashboard` |
| Notes | `/notes`, `/notes/[id]` |
| Tasks | `/tasks` |
| Calendar | `/calendar` |
| Library | `/library`, `/reader/[id]` |
| Contacts | `/contacts` |
| Documents | `/documents`, `/documents/[id]` |
| Settings | `/settings` |
| Landing Page | `/` (public) |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (or local Supabase via CLI)

### Environment Variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REDIRECT_URI=
GOOGLE_BOOKS_API_KEY=
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests (single run) |
| `npm run test:watch` | Run tests in watch mode |

## Testing

Tests use **Vitest** with `@testing-library/react` and **fast-check** for property-based testing. Tests live in `__tests__/` organized by feature.

```bash
npm run test          # single run
npm run test:watch    # watch mode
```

## Project Structure

```
app/                    # Next.js App Router pages & API routes
  (app)/                # Protected app shell (layout with sidebar + header)
  (marketing)/          # Public marketing pages (landing)
  api/                  # Route handlers
  auth/callback/        # OAuth callback handler
components/
  ui/                   # shadcn/ui primitives
  shared/               # Reusable UI (EmptyState, FloatingToolbar, AppModal)
  layout/               # Shell (sidebar, header, command menu)
  landing/              # Landing page components
  auth/                 # Auth components
  dashboard/            # Dashboard widgets
  notes/                # Notes feature
  tasks/                # Tasks feature
  calendar/             # Calendar feature
  library/              # Library/reader feature
  contacts/             # Contacts feature
  documents/            # Documents feature
  settings/             # Settings feature
  providers/            # Context providers
hooks/                  # Custom React hooks
lib/                    # Data access & utility functions
  supabase/             # Supabase client helpers (server & browser)
  auth/                 # Auth utilities
  motion.ts             # Centralized animation config
types/                  # TypeScript type definitions
supabase/
  migrations/           # SQL migration files
__tests__/              # Test files (Vitest + fast-check)
```

## Supabase

```bash
npx supabase start          # Start local Supabase stack
npx supabase db reset       # Reset and re-run all migrations
npx supabase gen types typescript --local > types/database.ts  # Regenerate types
```

## Deployment

The app deploys to Vercel. Pushing to `main` triggers a production deploy. Set environment variables in the Vercel project dashboard.

## License

Private project.
