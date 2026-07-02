# Deployment

Home OS has two independently deployable pieces: the **Next.js frontend** (Vercel) and the **.NET microservice backend** (separate infrastructure).

## Frontend (Vercel)

### Deployment trigger

Pushing to `main` triggers a production deploy on Vercel.

### Environment variables

Set these in the Vercel project dashboard (Settings → Environment Variables):

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (public) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site URL (e.g., `https://homeos.app`) |
| `NEXT_PUBLIC_API_GATEWAY_URL` | Yes | API Gateway URL for the target environment |

Google API credentials (Calendar, Contacts, Books) are no longer needed in the frontend. They live in the backend microservices.

### API Gateway URL per environment

| Environment | `NEXT_PUBLIC_API_GATEWAY_URL` |
|-------------|-------------------------------|
| Local | `http://localhost:5000` |
| Staging | `https://api-staging.homeos.app` |
| Production | `https://api.homeos.app` |

### Image domains

`next.config.ts` allows these external image sources:

- `covers.openlibrary.org` (https + http)
- `books.google.com` (https + http)
- `lh3.googleusercontent.com` (https)
- `avatars.githubusercontent.com` (https)

Add new domains to `next.config.ts` → `images.remotePatterns` before using them with `next/image`.

### Build command

```bash
npm run build
```

Vercel runs this automatically. The build will fail if `NEXT_PUBLIC_API_GATEWAY_URL` is not set — the API client validates this at initialization.

## Backend (Microservices)

The backend is a .NET 10 solution in the `home-os-microservice` repository. It deploys independently from the frontend.

### Services

| Service | Responsibility |
|---------|---------------|
| API Gateway | JWT validation, request routing, rate limiting, CORS |
| Auth Service | Supabase Auth wrapper, profile management, account deletion |
| Tasks Service | Task CRUD, priority, due dates |
| Notes Service | Note CRUD, tags, search, pinned notes |
| Calendar Service | Events, Google Calendar OAuth + sync |
| Library Service | Books, reading status, Google Books search |
| Documents Service | Document metadata, Supabase Storage file management |
| Contacts Service | Contacts, favorites, Google Contacts sync |
| Preferences Service | Theme, onboarding, pinned notes, dashboard layout |
| Dashboard Aggregator | Parallel fan-out to domain services, response shaping |

### Backend environment requirements

The backend services need their own environment configuration (Supabase connection string, Google OAuth credentials, JWT signing secret). See the `home-os-microservice` repository for details.

### CORS

The API Gateway must allow the frontend origin:

| Environment | Allowed Origin |
|-------------|----------------|
| Local | `http://localhost:3000` |
| Staging | `https://staging.homeos.app` |
| Production | `https://homeos.app` |

## Local Development Setup

To run the full stack locally:

1. **Start Supabase** (if using local instance):
   ```bash
   npx supabase start
   ```

2. **Start the API Gateway + microservices** (in the `home-os-microservice` repo):
   ```bash
   dotnet run --project src/HomeOS.Gateway
   ```
   Gateway runs on `http://localhost:5000` by default.

3. **Start the frontend**:
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:3000`.

4. **Verify connectivity**: The frontend should be able to reach the Gateway. If `NEXT_PUBLIC_API_GATEWAY_URL` is misconfigured, pages will show empty states (data access functions return empty arrays on failure).

## Health Checks

- Frontend: `http://localhost:3000` loads the landing page
- Gateway: `http://localhost:5000/health` returns 200
- Individual services expose health endpoints via the Gateway

## Rollback

- **Frontend**: Revert to a previous Vercel deployment via the Vercel dashboard (Deployments → Promote)
- **Backend**: Deploy the previous container/build of the affected service

## Monitoring

- Frontend errors surface via Sonner toasts to the user and can be tracked via Vercel Analytics or an error reporting service
- Backend services log to stdout; aggregate with your preferred log collector
- The API client distinguishes `NetworkError` (Gateway unreachable) from `ApiError` (Gateway responded with error) — useful for diagnosing whether issues are network/infrastructure vs. application-level

## Security Notes

- `NEXT_PUBLIC_` variables are bundled into the client — they must not contain secrets
- Google OAuth credentials and Supabase service role keys belong in the backend only
- The frontend never touches the database directly — RLS provides defense-in-depth on the backend
- JWT tokens are short-lived; the API client handles refresh automatically
- The Gateway enforces rate limiting per user/endpoint
