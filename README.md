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
| Contacts | `/contacts`, `/contact` |
| Documents | `/documents`, `/documents/[id]` |
| Settings | `/settings` |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (or local Supabase via CLI)

### Environment Variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
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

## Project Structure

```
app/            # Next.js App Router pages & API routes
components/     # React components organized by feature
  ui/           # shadcn/ui primitives
  layout/       # Shell (sidebar, header, command menu)
  notes/        # Notes feature
  tasks/        # Tasks feature
  calendar/     # Calendar feature
  library/      # Library/reader feature
  contacts/     # Contacts feature
  settings/     # Settings feature
lib/            # Data access & utility functions
  supabase/     # Supabase client helpers (server & browser)
types/          # TypeScript type definitions
supabase/
  migrations/   # SQL migration files
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
