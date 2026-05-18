# Home OS — Project Overview

## What This Is

Home OS is a calm personal organization platform. It is NOT a productivity hustle tool, AI assistant, or collaboration platform. The product should feel peaceful, dependable, simple, and emotionally safe.

## Core Modules

| Module | Route | Component Dir | Lib File |
|--------|-------|---------------|----------|
| Dashboard | `/dashboard` | `components/dashboard/` | `lib/dashboard.ts` |
| Notes | `/notes`, `/notes/[id]` | `components/notes/` | `lib/notes.ts`, `lib/notes-utils.ts` |
| Tasks | `/tasks` | `components/tasks/` | `lib/tasks.ts`, `lib/tasks-helpers.ts` |
| Calendar | `/calendar` | `components/calendar/` | `lib/calendar.ts`, `lib/google-calendar.ts` |
| Library | `/library`, `/reader/[id]` | `components/library/` | `lib/books.ts`, `lib/google-books.ts` |
| Documents | `/documents`, `/documents/[id]` | `components/documents/` | `lib/documents.ts`, `lib/documents-utils.ts` |
| Contacts | `/contacts` | `components/contacts/` | `lib/contacts.ts`, `lib/contacts-utils.ts`, `lib/google-contacts.ts` |
| Settings | `/settings` | `components/settings/` | `lib/preferences.ts`, `lib/user-settings.ts` |

## Tech Stack

- **Framework**: Next.js 16 (App Router) — read `node_modules/next/dist/docs/` before writing Next.js code
- **React**: 19
- **Database / Auth / Storage**: Supabase (PostgreSQL + RLS + Buckets)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State**: Zustand (global), TanStack Query (server state)
- **Icons**: Lucide React + Phosphor Icons (`@phosphor-icons/react`)
- **Toasts**: Sonner
- **Animations**: Framer Motion
- **Testing**: Vitest + Testing Library + fast-check (property-based)
- **Hosting**: Vercel

## Project Structure

```
app/                    # Next.js App Router pages
  api/                  # Route handlers
  (app)/                # Protected app shell (layout with sidebar + header)
  (marketing)/          # Public marketing pages
  auth/callback/        # OAuth callback handler
components/
  layout/               # Shell: sidebar, header, command menu, app-providers
  ui/                   # shadcn primitives
  shared/               # Reusable UI primitives (EmptyState, FloatingToolbar, AppModal)
  auth/                 # Auth-related components
  calendar/             # Calendar feature components
  dashboard/            # Dashboard widgets
  documents/            # Documents feature components
  notes/                # Notes feature components
  tasks/                # Tasks feature components
  library/              # Library/reader components
  contacts/             # Contacts components
  settings/             # Settings components
  landing/              # Landing page components
  legal/                # Legal pages (privacy, terms)
  onboarding/           # Onboarding dialog
  providers/            # React context providers (incl. LowPerformanceDetector)
  theme/                # Theme provider
hooks/
  use-user-preferences.ts  # User preferences hook
  use-reduced-motion.ts    # Reduced motion detection + Framer Motion helpers
  use-low-performance.ts   # Low-performance device detection
lib/
  supabase/
    client.ts           # Browser Supabase client
    server.ts           # Server Supabase client (async, uses cookies)
  auth/                 # Auth utility functions
  motion.ts             # Centralized Framer Motion config (variants, transitions, constraints)
  *.ts                  # Feature-specific data access functions
types/
  database.ts           # Auto-generated Supabase types
  book.ts               # Book types
  calendar.ts           # Calendar types
  contact.ts            # Contact types
  document.ts           # Document types
  note.ts               # Note types
  task.ts               # Task types
  user-preferences.ts   # User preferences types
providers/
  query-provider.tsx    # TanStack Query provider
supabase/
  migrations/           # SQL migration files
__tests__/              # Test files (Vitest + Testing Library)
scripts/                # Utility scripts
```
