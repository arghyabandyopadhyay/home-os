# Home OS — Auth & Data Patterns

## Authentication

Auth is handled entirely by Supabase. The flow is:

1. User visits `/login` → signs in with Google OAuth (or email magic link).
2. Supabase redirects to `/auth/callback` → `app/auth/callback/route.ts` exchanges the code for a session.
3. Middleware (`app/middleware.ts`) guards all protected routes by calling `supabase.auth.getUser()` on every request.
4. Unauthenticated requests to protected routes are redirected to `/login`. Authenticated users hitting `/login` are redirected to `/dashboard`.

The callback handler also supports password recovery flows — if `type=recovery`, it redirects to `/reset-password` after exchanging the code.

### Protected Routes

Defined in `app/middleware.ts`:
- `/dashboard`, `/calendar`, `/notes`, `/tasks`, `/library`, `/contacts`, `/settings`, `/documents`, `/reading-room`

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
| `profiles` | `id` (= auth user id), `email`, `full_name`, `avatar_url`, `auth_provider`, `metadata`, `created_at` |
| `notes` | `id`, `user_id`, `title`, `content`, `tags`, `linked_book_id`, `linked_contact_id`, `created_at`, `updated_at` |
| `tasks` | `id`, `user_id`, `title`, `completed`, `due_date`, `priority` (low/medium/high), `created_at`, `updated_at` |
| `contacts` | `id`, `user_id`, `name`, `email`, `phone`, `role`, `company`, `notes`, `favorite`, `source`, `google_contact_id`, `created_at`, `updated_at` |
| `documents` | `id`, `user_id`, `title`, `file_path`, `file_size`, `tags`, `created_at`, `updated_at` |
| `calendar_events` | `id`, `user_id`, `title`, `description`, `starts_at`, `ends_at`, `all_day`, `location`, `source`, `external_id`, `external_calendar_id`, `html_link`, `created_at`, `updated_at` |
| `calendar_connections` | `id`, `user_id`, `provider`, `calendar_id`, `access_token`, `refresh_token`, `expires_at`, `connected_email`, `scope`, `created_at`, `updated_at` |
| `google_contacts_connections` | `id`, `user_id`, `access_token`, `refresh_token`, `expires_at`, `connected_email`, `scope`, `created_at`, `updated_at` |

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

Supabase Storage buckets are used for:
- Book files (PDFs, EPUBs) — paths stored in the library system
- Document files — paths stored in the `documents` table (`file_path`)

Access files via signed URLs or public bucket URLs depending on bucket policy.

## User Preferences

User preferences (theme, onboarding state, etc.) are accessed via `lib/preferences.ts` and `lib/user-settings.ts`. The `usePreferences()` hook (in `hooks/use-user-preferences.ts`) exposes them throughout the client-side tree.

## API Routes

Route handlers live in `app/api/`. They follow the same auth pattern — create a server Supabase client and call `getUser()` before doing anything. Return `401` if no user is found.

Current API routes:
- `app/api/google-calendar/connect` — initiates Google OAuth for calendar
- `app/api/google-calendar/callback` — handles Google OAuth callback
- `app/api/google-calendar/disconnect` — disconnects Google Calendar
- `app/api/google-calendar/sync` — syncs events from Google Calendar
- `app/api/google-contacts/connect` — initiates Google OAuth for contacts
- `app/api/google-contacts/callback` — handles Google Contacts OAuth callback
- `app/api/google-contacts/sync` — syncs contacts from Google
- `app/api/search-books` — proxies Google Books API search
- `app/api/account/delete` — handles account deletion
