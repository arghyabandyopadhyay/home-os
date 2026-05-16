# Home OS — Project Overview

## What This Is

Home OS is a calm personal organization platform. It is NOT a productivity hustle tool, AI assistant, or collaboration platform. The product should feel peaceful, dependable, simple, and emotionally safe.

## Core Modules

| Module | Route | Component Dir | Lib File |
|--------|-------|---------------|----------|
| Dashboard | `/dashboard` | `components/dashboard/` | `lib/dashboard.ts` |
| Notes | `/notes`, `/notes/[id]` | `components/notes/` | `lib/notes.ts` |
| Tasks | `/tasks` | `components/tasks/` | `lib/tasks.ts` |
| Calendar | `/calendar` | — | `lib/calendar.ts`, `lib/google-calendar.ts` |
| Library | `/library`, `/reader/[id]` | `components/library/` | `lib/books.ts` |
| Contacts | `/contacts` | `components/contacts/` | `lib/contacts.ts` |
| Settings | `/settings` | `components/settings/` | `lib/preferences.ts`, `lib/user-settings.ts` |

## Tech Stack

- **Framework**: Next.js 16 (App Router) — read `node_modules/next/dist/docs/` before writing Next.js code
- **React**: 19
- **Database / Auth / Storage**: Supabase (PostgreSQL + RLS + Buckets)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State**: Zustand (global), TanStack Query (server state)
- **Icons**: Lucide React + Phosphor Icons
- **Toasts**: Sonner
- **Animations**: Framer Motion
- **Hosting**: Vercel

## Project Structure

```
app/                    # Next.js App Router pages
  api/                  # Route handlers
  (pages)/              # Page components (server components by default)
components/
  layout/               # Shell: sidebar, header, command menu
  ui/                   # shadcn primitives
  dashboard/            # Dashboard widgets
  notes/                # Notes feature components
  tasks/                # Tasks feature components
  library/              # Library/reader components
  contacts/             # Contacts components
  settings/             # Settings components
  onboarding/           # Onboarding dialog
  providers/            # React context providers
  theme/                # Theme provider
lib/
  supabase/
    client.ts           # Browser Supabase client
    server.ts           # Server Supabase client (async, uses cookies)
  *.ts                  # Feature-specific data access functions
types/
  database.ts           # Auto-generated Supabase types
  *.ts                  # Feature-specific TypeScript types
providers/
  query-provider.tsx    # TanStack Query provider
supabase/
  migrations/           # SQL migration files
```
