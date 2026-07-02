# Home OS

A calm personal organization platform built with Next.js. Home OS is a quiet space to manage your notes, tasks, calendar, contacts, and reading — without the noise of typical productivity tools.

## Architecture

Home OS uses a microservice backend architecture. The Next.js frontend communicates exclusively through a typed API client to a .NET API Gateway, which routes requests to domain-specific microservices.

```
Frontend (Next.js) → API Client → API Gateway (.NET) → Microservices → Supabase DB
```

Supabase Auth remains the authentication provider — its JWTs are passed as Bearer tokens to the Gateway, which validates them before routing to services.

See [docs/component-design.md](docs/component-design.md) for the full component architecture and [docs/deployment.md](docs/deployment.md) for deployment details.

## Tech Stack

**Frontend:**
- Next.js 16 (App Router) + React 19
- Tailwind CSS v4 + shadcn/ui
- TanStack Query (server state) + Zustand (global state)
- Framer Motion (animations)
- Lucide React + Phosphor Icons
- Sonner (toasts)

**Backend:**
- .NET 10 (ASP.NET Core Minimal APIs)
- API Gateway with JWT validation, rate limiting, request routing
- Domain microservices: Tasks, Notes, Calendar, Library, Documents, Contacts, Preferences, Dashboard Aggregator

**Infrastructure:**
- Supabase (PostgreSQL + RLS + Auth + Storage)
- Vercel (frontend hosting)

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
- The [home-os-microservice](https://github.com/your-org/home-os-microservice) backend running locally (for data access)

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase (auth + session management)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# API Gateway — all data reads/writes go through here
# Local: http://localhost:5000
# Staging: https://api-staging.homeos.app
# Production: https://api.homeos.app
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:5000
```

All variables use the `NEXT_PUBLIC_` prefix since the API client runs in both server and client contexts. Google API credentials live in the backend microservices — they are not needed here.

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

Make sure the API Gateway is running at the URL configured in `NEXT_PUBLIC_API_GATEWAY_URL`.

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
app/                    # Next.js App Router pages
  (app)/                # Protected app shell (layout with sidebar + header)
  (marketing)/          # Public marketing pages (landing, legal)
  auth/callback/        # OAuth callback handler (preserved for code exchange)
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
hooks/
  queries/              # TanStack Query hooks (use-tasks, use-notes, etc.)
  use-api-error-handler.ts  # Error → toast mapping
  use-user-preferences.ts   # User preferences hook
  use-reduced-motion.ts     # Reduced motion detection
  use-low-performance.ts    # Low-performance device detection
lib/
  api-client/           # Typed API client (core, token providers, errors)
  supabase/             # Supabase client helpers (auth only — session, tokens)
  auth/                 # Auth utilities
  motion.ts             # Centralized animation config
  *.ts                  # Domain data access functions (tasks, notes, etc.)
types/                  # TypeScript type definitions
supabase/
  migrations/           # SQL migration files
__tests__/              # Test files (Vitest + fast-check)
docs/                   # Architecture and deployment documentation
```

## Supabase

Supabase is used for **authentication and session management only**. All data reads/writes go through the API Gateway.

```bash
npx supabase start          # Start local Supabase stack
npx supabase db reset       # Reset and re-run all migrations
npx supabase gen types typescript --local > types/database.ts  # Regenerate types
```

## Deployment

See [docs/deployment.md](docs/deployment.md) for the full deployment guide.

**Summary:** The frontend deploys to Vercel. The backend microservices deploy independently. Both environments require `NEXT_PUBLIC_API_GATEWAY_URL` pointing to the correct Gateway instance.

## License

Private project.
