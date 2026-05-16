# Home OS — Auth & Data Patterns

## Authentication

Auth is handled entirely by Supabase. The flow is:

1. User visits `/login` → signs in with Google OAuth (or email magic link).
2. Supabase redirects to `/auth/callback` → `app/auth/callback/route.ts` exchanges the code for a session.
3. Middleware (`app/middleware.ts`) guards all protected routes by calling `supabase.auth.getUser()` on every request.
4. Unauthenticated requests to protected routes are redirected to `/login`. Authenticated users hitting `/login` are redirected to `/dashboard`.

### Protected Routes

Defined in `app/middleware.ts`:
- `/dashboard`, `/calendar`, `/notes`, `/tasks`, `/library`, `/contacts`, `/reading-room`

To protect a new route, add it to both the `protectedRoutes` array and the `matcher` config in middleware.

### Getting the Current User

**Server components / lib functions:**
```ts
import { createClient } from "@/lib/supabase/server"

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return null // or redirect
```

**Client components:**
```ts
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
```

Never trust `getSession()` for authorization — always use `getUser()` which validates the JWT server-side.

## Database

PostgreSQL via Supabase. All tables have Row Level Security (RLS) enabled — queries automatically scope to the authenticated user.

### Schema (current tables)

| Table | Key columns |
|---|---|
| `profiles` | `id` (= auth user id), `email`, `created_at` |
| `notes` | `id`, `user_id`, `title`, `content`, `created_at`, `updated_at` |
| `tasks` | `id`, `user_id`, `title`, `completed`, `due_date`, `created_at` |
| `books` | `id`, `user_id`, `title`, `author`, `status`, `progress`, `cover_url`, `file_path`, `updated_at` |
| `contacts` | `id`, `user_id`, `name`, `email`, `role`, `company`, `favorite`, `updated_at` |

Generated TypeScript types are in `types/database.ts`. Regenerate after schema changes with:
```bash
npx supabase gen types typescript --local > types/database.ts
```

### Migrations

SQL migrations live in `supabase/migrations/`. Always create a new migration file for schema changes — never edit existing ones.

### Query Patterns

Always filter by `user_id` even though RLS enforces it — it makes intent explicit and avoids surprises if RLS is ever misconfigured:

```ts
const { data } = await supabase
  .from("tasks")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
```

For count-only queries, use `{ count: "exact", head: true }` to avoid fetching rows:
```ts
const { count } = await supabase
  .from("tasks")
  .select("id", { count: "exact", head: true })
  .eq("user_id", user.id)
```

## File Storage

Supabase Storage buckets are used for book files (PDFs, EPUBs) and cover images. File paths are stored in the `books` table (`file_path`, `cover_url`). Access files via signed URLs or public bucket URLs depending on bucket policy.

## User Preferences

User preferences (theme, onboarding state, etc.) are stored in a `user_settings` table and accessed via `lib/preferences.ts` and `lib/user-settings.ts`. The `UserPreferencesProvider` in `components/providers/user-preferences-provider.tsx` exposes them via the `usePreferences()` hook throughout the client-side tree.

## API Routes

Route handlers live in `app/api/`. They follow the same auth pattern — create a server Supabase client and call `getUser()` before doing anything. Return `401` if no user is found.

Current API routes:
- `app/api/google-calendar/connect` — initiates Google OAuth for calendar
- `app/api/google-calendar/callback` — handles Google OAuth callback
- `app/api/google-calendar/sync` — syncs events from Google Calendar
- `app/api/search-books` — proxies Google Books API search
