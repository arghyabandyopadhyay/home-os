# Component Design

This document describes the frontend component architecture after the API migration. All data access flows through a typed API client to the .NET API Gateway — there are no direct Supabase database queries from the frontend.

## Data Flow Overview

```
Server Components → lib/*.ts (data access) → API Client → API Gateway → Microservices
Client Components → TanStack Query Hooks → API Client → API Gateway → Microservices
```

Supabase is used **only** for authentication (session management, token retrieval). The `lib/supabase/server.ts` and `lib/supabase/client.ts` files remain for auth operations.

## API Client (`lib/api-client/`)

The centralized HTTP client for all Gateway communication.

```
lib/api-client/
  index.ts              # Exports createServerApiClient(), createClientApiClient()
  core.ts               # Core fetch logic, URL construction, error parsing, timeout
  server-token.ts       # Server-side token provider (extracts JWT from cookie session)
  client-token.ts       # Client-side token provider (extracts JWT from browser session)
  errors.ts             # ApiError, NetworkError types and constructors
  types.ts              # RequestOptions, MutationOptions, ApiClient, TokenProvider
```

### Key behaviors:

- Constructs URLs from `NEXT_PUBLIC_API_GATEWAY_URL` + path + query params
- Attaches `Authorization: Bearer <token>` to every request
- Sets `Content-Type: application/json` when a body is present
- Enforces 30-second timeout (configurable per-request; 120s for file uploads)
- Handles 401 → refresh token → retry once
- Parses non-2xx responses into typed `ApiError` (including 422 field errors, 429 retry-after)
- Network failures produce `NetworkError` (structurally distinct from `ApiError`)
- Throws at initialization if `NEXT_PUBLIC_API_GATEWAY_URL` is unset

### Error type hierarchy:

```typescript
type ApiClientError = ApiError | NetworkError

type ApiError = {
  type: "api"
  status: number
  code: ApiErrorCode
  message: string
  fields?: FieldError[]    // 422 validation details
  retryAfter?: number      // 429 retry delay
}

type NetworkError = {
  type: "network"
  message: string
  cause?: unknown
}
```

## Token Providers

Two token providers extract JWTs from Supabase Auth sessions:

| Provider | File | Context | How it works |
|----------|------|---------|--------------|
| Server | `server-token.ts` | Server components, `lib/*.ts` | Reads JWT from cookie-based Supabase session |
| Client | `client-token.ts` | Client components, query hooks | Reads JWT from browser Supabase session |

Both implement the same `TokenProvider` interface:

```typescript
type TokenProvider = {
  getToken: () => Promise<string | null>
  refreshToken: () => Promise<string | null>
}
```

## Data Access Layer (`lib/*.ts`)

Each domain has a data access file that wraps API client calls. Function signatures are unchanged from pre-migration — consuming components required no changes.

| File | Domain | Example functions |
|------|--------|-------------------|
| `lib/tasks.ts` | Tasks | `getTasks()`, `createTask()`, `updateTask()`, `deleteTask()` |
| `lib/notes.ts` | Notes | `getNotes()`, `getNote()`, `createNote()`, `updateNote()`, `deleteNote()` |
| `lib/books.ts` | Library | `getBooks()`, `getBook()`, `addBook()`, `updateBook()`, `removeBook()` |
| `lib/calendar.ts` | Calendar | `getCalendarEvents()`, `getCalendarConnection()` |
| `lib/contacts.ts` | Contacts | `getContacts()`, `createContact()`, `updateContact()`, `deleteContact()` |
| `lib/documents.ts` | Documents | `getDocuments()`, `uploadDocument()`, `updateDocument()`, `deleteDocument()` |
| `lib/preferences.ts` | Preferences | `getPreferences()`, `updatePreferences()` |
| `lib/dashboard.ts` | Dashboard | `getDashboard()` |
| `lib/google-calendar.ts` | Calendar integration | `connectGoogleCalendar()`, `disconnectGoogleCalendar()`, `syncGoogleCalendar()` |
| `lib/google-contacts.ts` | Contacts integration | `connectGoogleContacts()`, `syncGoogleContacts()` |
| `lib/google-books.ts` | Book search | `searchBooks()` |

### Error handling pattern:

All server-side data access functions return empty/default values on failure (never throw):

```typescript
export async function getTasks(): Promise<Task[]> {
  const api = await createServerApiClient()
  try {
    return await api.get<Task[]>("/tasks")
  } catch {
    return []
  }
}
```

## TanStack Query Hooks (`hooks/queries/`)

Client components use dedicated query/mutation hooks for data access, caching, and cache invalidation.

| Hook file | Functions |
|-----------|-----------|
| `use-tasks.ts` | `useTasks()`, `useCreateTask()`, `useUpdateTask()`, `useDeleteTask()` |
| `use-notes.ts` | `useNotes()`, `useNote()`, `useCreateNote()`, `useUpdateNote()`, `useDeleteNote()` |
| `use-contacts.ts` | `useContacts()`, `useCreateContact()`, `useUpdateContact()`, `useDeleteContact()` |
| `use-documents.ts` | `useDocuments()`, `useUploadDocument()`, `useUpdateDocument()`, `useDeleteDocument()` |
| `use-calendar.ts` | `useCalendarEvents()`, `useCalendarConnection()`, `useConnectGoogleCalendar()`, `useDisconnectGoogleCalendar()`, `useSyncGoogleCalendar()` |
| `use-books.ts` | `useBooks()`, `useBook()`, `useAddBook()`, `useUpdateBook()`, `useRemoveBook()`, `useSearchBooks()` |
| `use-preferences.ts` | `usePreferences()`, `useUpdatePreferences()` |
| `use-dashboard.ts` | `useDashboard()` |
| `use-account.ts` | `useDeleteAccount()` |

### Cache invalidation:

Successful mutations invalidate the corresponding resource's query keys, causing subscribed queries to refetch automatically.

### Query configuration:

- Queries retry once on failure (`retry: 1`)
- Mutations do not auto-retry (user re-triggers)
- No stale time override (uses TanStack Query defaults)

## Error Handling Hook (`hooks/use-api-error-handler.ts`)

Maps `ApiClientError` to Sonner toast notifications:

| Error type | Behavior |
|------------|----------|
| `NetworkError` | Toast: "Connection problem" |
| `RATE_LIMITED` | Toast with retry-after duration |
| `UNAUTHORIZED` | No toast (middleware handles redirect) |
| `VALIDATION_ERROR` | Toast: "Invalid input" (forms handle field errors inline) |
| Other `ApiError` | Toast: "Something went wrong" |

## Gateway API Endpoints

The frontend calls these Gateway paths:

| Domain | Endpoints |
|--------|-----------|
| Tasks | `GET/POST /tasks`, `PATCH/DELETE /tasks/:id` |
| Notes | `GET/POST /notes`, `GET/PATCH/DELETE /notes/:id` |
| Library | `GET/POST /library`, `GET/PATCH/DELETE /library/:id`, `GET /library/search` |
| Calendar | `GET /calendar/events`, `GET /calendar/connection`, `POST /calendar/connect`, `POST /calendar/disconnect`, `POST /calendar/sync` |
| Contacts | `GET/POST /contacts`, `PATCH/DELETE /contacts/:id`, `POST /contacts/google/connect`, `POST /contacts/google/sync` |
| Documents | `GET/POST /documents`, `PATCH/DELETE /documents/:id` |
| Preferences | `GET/PATCH /preferences` |
| Dashboard | `GET /dashboard` |
| Account | `DELETE /account` |

## What Was Removed

The entire `app/api/` directory was deleted. All route handlers that previously proxied to Supabase or external APIs are now handled by the microservices:

- `app/api/google-calendar/*` → Calendar Service
- `app/api/google-contacts/*` → Contacts Service
- `app/api/search-books` → Library Service
- `app/api/account/delete` → Auth Service

## What Was Preserved

- `app/auth/callback/route.ts` — OAuth code exchange (Supabase Auth flow)
- `lib/supabase/client.ts` — Browser auth client (login, logout, session)
- `lib/supabase/server.ts` — Server auth client (token extraction for API client)
- `app/middleware.ts` — Route protection (unchanged)
