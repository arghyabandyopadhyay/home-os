import { describe, it, expect, vi, beforeEach } from "vitest"
import * as fc from "fast-check"

/**
 * Property 3: Middleware route protection is consistent
 * Validates: Requirements 4.2, 4.4, 8.4
 *
 * For any path in the protected routes list and any session state (valid user or null),
 * the middleware SHALL redirect to `/login` if and only if `getUser()` returns null,
 * and SHALL allow access (return next response) if and only if `getUser()` returns
 * a valid user object.
 *
 * Additionally, for the `/login` path:
 * - If user exists → redirect to `/dashboard`
 * - If no user → allow (no redirect)
 *
 * Tags: Feature: oauth-authentication, Property 3: Middleware route protection is consistent
 */

// --- Mock setup for @supabase/ssr ---

const mockGetUser = vi.fn()

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}))

// Mock NextResponse and NextRequest from next/server
vi.mock("next/server", () => {
  class MockNextResponse {
    cookies: { set: ReturnType<typeof vi.fn> }
    headers: Map<string, string>
    status: number

    constructor() {
      this.cookies = { set: vi.fn() }
      this.headers = new Map()
      this.status = 200
    }

    static next() {
      return new MockNextResponse()
    }

    static redirect(url: URL) {
      const response = new MockNextResponse()
      ;(response as Record<string, unknown>).__redirectUrl = url.pathname
      ;(response as Record<string, unknown>).__isRedirect = true
      return response
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: class {},
  }
})

// --- Types ---

type MiddlewareResponse = {
  __isRedirect?: boolean
  __redirectUrl?: string
}

type MockUser = {
  id: string
  email: string
  app_metadata: Record<string, unknown>
  user_metadata: Record<string, unknown>
}

// --- Constants matching the middleware ---

const PROTECTED_ROUTES = [
  "/dashboard",
  "/calendar",
  "/notes",
  "/tasks",
  "/library",
  "/contacts",
  "/settings",
  "/documents",
  "/reading-room",
]

// --- Generators ---

/** Generate a random sub-path segment (e.g., "/abc123", "/some-id/edit") */
const subPathArb = fc.oneof(
  fc.constant(""),
  fc.stringMatching(/^\/[a-z0-9-]{1,20}$/).map((s) => s),
  fc.stringMatching(/^\/[a-z0-9-]{1,10}\/[a-z0-9-]{1,10}$/).map((s) => s)
)

/** Generate a random protected route path with optional sub-paths */
const protectedPathArb = fc
  .tuple(fc.constantFrom(...PROTECTED_ROUTES), subPathArb)
  .map(([route, sub]) => `${route}${sub}`)

/** Generate a valid mock user object */
const validUserArb: fc.Arbitrary<MockUser> = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  app_metadata: fc.constant({ provider: "google" }),
  user_metadata: fc.constant({ full_name: "Test User" }),
})

/** Generate a session state: either a valid user or null */
const sessionStateArb = fc.oneof(
  validUserArb.map((user) => ({ user, isAuthenticated: true })),
  fc.constant({ user: null as MockUser | null, isAuthenticated: false })
)

// --- Helper to invoke middleware ---

async function invokeMiddleware(
  pathname: string,
  user: MockUser | null
): Promise<MiddlewareResponse> {
  // Configure mock to return the user state
  mockGetUser.mockResolvedValueOnce({
    data: { user },
  })

  // Create a mock request with the given pathname
  const mockRequest = {
    nextUrl: {
      pathname,
    },
    url: `http://localhost:3000${pathname}`,
    cookies: {
      getAll: () => [],
    },
  }

  // Import and call the middleware
  const { middleware } = await import("@/app/middleware")
  const response = await middleware(mockRequest as never)
  return response as unknown as MiddlewareResponse
}

// --- Tests ---

describe("Feature: oauth-authentication, Property 3: Middleware route protection is consistent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset module registry to ensure fresh middleware import each time
    vi.resetModules()
    // Re-apply mocks after reset
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: () => ({
        auth: {
          getUser: mockGetUser,
        },
      }),
    }))
    vi.doMock("next/server", () => {
      class MockNextResponse {
        cookies: { set: ReturnType<typeof vi.fn> }
        headers: Map<string, string>
        status: number

        constructor() {
          this.cookies = { set: vi.fn() }
          this.headers = new Map()
          this.status = 200
        }

        static next() {
          return new MockNextResponse()
        }

        static redirect(url: URL) {
          const response = new MockNextResponse()
          ;(response as Record<string, unknown>).__redirectUrl = url.pathname
          ;(response as Record<string, unknown>).__isRedirect = true
          return response
        }
      }

      return {
        NextResponse: MockNextResponse,
        NextRequest: class {},
      }
    })
  })

  it("protected path + no user → redirect to /login", async () => {
    await fc.assert(
      fc.asyncProperty(protectedPathArb, async (path) => {
        mockGetUser.mockResolvedValueOnce({ data: { user: null } })

        const mockRequest = {
          nextUrl: { pathname: path },
          url: `http://localhost:3000${path}`,
          cookies: { getAll: () => [] },
        }

        const { middleware } = await import("@/app/middleware")
        const response = (await middleware(
          mockRequest as never
        )) as unknown as MiddlewareResponse

        expect(response.__isRedirect).toBe(true)
        expect(response.__redirectUrl).toBe("/login")
      }),
      { numRuns: 100 }
    )
  })

  it("protected path + valid user → allow (no redirect)", async () => {
    await fc.assert(
      fc.asyncProperty(
        protectedPathArb,
        validUserArb,
        async (path, user) => {
          mockGetUser.mockResolvedValueOnce({ data: { user } })

          const mockRequest = {
            nextUrl: { pathname: path },
            url: `http://localhost:3000${path}`,
            cookies: { getAll: () => [] },
          }

          const { middleware } = await import("@/app/middleware")
          const response = (await middleware(
            mockRequest as never
          )) as unknown as MiddlewareResponse

          expect(response.__isRedirect).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  it("/login + valid user → redirect to /dashboard", async () => {
    await fc.assert(
      fc.asyncProperty(validUserArb, async (user) => {
        mockGetUser.mockResolvedValueOnce({ data: { user } })

        const mockRequest = {
          nextUrl: { pathname: "/login" },
          url: "http://localhost:3000/login",
          cookies: { getAll: () => [] },
        }

        const { middleware } = await import("@/app/middleware")
        const response = (await middleware(
          mockRequest as never
        )) as unknown as MiddlewareResponse

        expect(response.__isRedirect).toBe(true)
        expect(response.__redirectUrl).toBe("/dashboard")
      }),
      { numRuns: 100 }
    )
  })

  it("/login + no user → allow (no redirect)", async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: null } })

        const mockRequest = {
          nextUrl: { pathname: "/login" },
          url: "http://localhost:3000/login",
          cookies: { getAll: () => [] },
        }

        const { middleware } = await import("@/app/middleware")
        const response = (await middleware(
          mockRequest as never
        )) as unknown as MiddlewareResponse

        expect(response.__isRedirect).toBeUndefined()
      }),
      { numRuns: 100 }
    )
  })

  it("redirect decision is determined solely by user presence and path protection status", async () => {
    await fc.assert(
      fc.asyncProperty(
        protectedPathArb,
        sessionStateArb,
        async (path, session) => {
          mockGetUser.mockResolvedValueOnce({ data: { user: session.user } })

          const mockRequest = {
            nextUrl: { pathname: path },
            url: `http://localhost:3000${path}`,
            cookies: { getAll: () => [] },
          }

          const { middleware } = await import("@/app/middleware")
          const response = (await middleware(
            mockRequest as never
          )) as unknown as MiddlewareResponse

          if (session.isAuthenticated) {
            // Authenticated user on protected route → allow
            expect(response.__isRedirect).toBeUndefined()
          } else {
            // Unauthenticated user on protected route → redirect to /login
            expect(response.__isRedirect).toBe(true)
            expect(response.__redirectUrl).toBe("/login")
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
