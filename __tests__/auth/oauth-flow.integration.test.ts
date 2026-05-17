import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

/**
 * Integration tests for OAuth Authentication Flow
 *
 * Tests the end-to-end interaction between:
 * - OAuthButtonGroup component → signInWithOAuth
 * - Auth callback handler → session exchange → redirect
 * - Error recovery: failed flow → error callback → retry enabled
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 7.6
 */

// --- Module-level mocks ---

const mockSignInWithOAuth = vi.fn();
const mockExchangeCodeForSession = vi.fn();

// Mock the browser Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
    },
  }),
}));

// Mock the server Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      exchangeCodeForSession: (...args: unknown[]) =>
        mockExchangeCodeForSession(...args),
    },
  }),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

// Import after mocks are set up
import { OAuthButtonGroup } from "@/components/auth/oauth-button-group";
import { GET } from "@/app/auth/callback/route";

describe("OAuth Flow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set window.location.origin for redirectTo URL construction
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000", search: "" },
      writable: true,
    });
  });

  describe("Button click → signInWithOAuth called with correct params", () => {
    it("calls signInWithOAuth with google provider and correct redirectTo on Google button click", async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });

      const onError = vi.fn();
      render(React.createElement(OAuthButtonGroup, { onError }));

      const googleButton = screen.getByRole("button", {
        name: "Sign in with Google",
      });
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(mockSignInWithOAuth).toHaveBeenCalledWith({
          provider: "google",
          options: {
            redirectTo: "http://localhost:3000/auth/callback",
          },
        });
      });
    });

    it("does not render a GitHub OAuth button (GitHub provider removed)", async () => {
      const onError = vi.fn();
      render(React.createElement(OAuthButtonGroup, { onError }));

      const githubButton = screen.queryByRole("button", {
        name: "Sign in with GitHub",
      });
      expect(githubButton).toBeNull();
    });

    it("disables all buttons while OAuth flow is in progress", async () => {
      // Keep the promise pending to simulate in-progress state
      mockSignInWithOAuth.mockReturnValue(new Promise(() => {}));

      const onError = vi.fn();
      render(React.createElement(OAuthButtonGroup, { onError }));

      const googleButton = screen.getByRole("button", {
        name: "Sign in with Google",
      });
      fireEvent.click(googleButton);

      await waitFor(() => {
        const allButtons = screen.getAllByRole("button");
        allButtons.forEach((button) => {
          expect((button as HTMLButtonElement).disabled).toBe(true);
        });
      });
    });
  });

  describe("Callback → session exchange → redirect", () => {
    it("exchanges code for session and redirects to /dashboard on valid code", async () => {
      mockExchangeCodeForSession.mockResolvedValue({ error: null });

      const request = new Request(
        "http://localhost:3000/auth/callback?code=valid-code"
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      const redirectUrl = new URL(response.headers.get("location")!);
      expect(redirectUrl.pathname).toBe("/dashboard");
      expect(mockExchangeCodeForSession).toHaveBeenCalledWith("valid-code");
    });

    it("redirects to /login with error_description when provider returns error", async () => {
      const request = new Request(
        "http://localhost:3000/auth/callback?error=access_denied&error_description=User+denied"
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      const redirectUrl = new URL(response.headers.get("location")!);
      expect(redirectUrl.pathname).toBe("/login");
      expect(redirectUrl.searchParams.get("error_description")).toBe(
        "User denied"
      );
      expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    });

    it("redirects to /login with missing code error when no code param", async () => {
      const request = new Request("http://localhost:3000/auth/callback");
      const response = await GET(request);

      expect(response.status).toBe(307);
      const redirectUrl = new URL(response.headers.get("location")!);
      expect(redirectUrl.pathname).toBe("/login");
      expect(redirectUrl.searchParams.get("error_description")).toBe(
        "Authorization code missing"
      );
    });

    it("redirects to /login with generic error when session exchange fails", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        error: { message: "Invalid code" },
      });

      const request = new Request(
        "http://localhost:3000/auth/callback?code=expired-code"
      );
      const response = await GET(request);

      expect(response.status).toBe(307);
      const redirectUrl = new URL(response.headers.get("location")!);
      expect(redirectUrl.pathname).toBe("/login");
      expect(redirectUrl.searchParams.get("error_description")).toBe(
        "Authentication failed"
      );
    });
  });

  describe("Error recovery: failed flow → error callback → retry enabled", () => {
    it("calls onError with user-friendly message when signInWithOAuth returns error", async () => {
      mockSignInWithOAuth.mockResolvedValue({
        error: { message: "Provider not configured" },
      });

      const onError = vi.fn();
      render(React.createElement(OAuthButtonGroup, { onError }));

      const googleButton = screen.getByRole("button", {
        name: "Sign in with Google",
      });
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          "Sign-in could not be started. Please try again."
        );
      });
    });

    it("re-enables buttons after OAuth flow error so user can retry", async () => {
      mockSignInWithOAuth.mockResolvedValue({
        error: { message: "Network error" },
      });

      const onError = vi.fn();
      render(React.createElement(OAuthButtonGroup, { onError }));

      const googleButton = screen.getByRole("button", {
        name: "Sign in with Google",
      });
      fireEvent.click(googleButton);

      // After error, buttons should be re-enabled
      await waitFor(() => {
        const allButtons = screen.getAllByRole("button");
        allButtons.forEach((button) => {
          expect((button as HTMLButtonElement).disabled).toBe(false);
        });
      });
    });

    it("allows retry after a failed OAuth attempt", async () => {
      // First attempt fails
      mockSignInWithOAuth.mockResolvedValueOnce({
        error: { message: "Temporary failure" },
      });
      // Second attempt succeeds
      mockSignInWithOAuth.mockResolvedValueOnce({ error: null });

      const onError = vi.fn();
      render(React.createElement(OAuthButtonGroup, { onError }));

      const googleButton = screen.getByRole("button", {
        name: "Sign in with Google",
      });

      // First click - fails
      fireEvent.click(googleButton);
      await waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
      });

      // Second click - succeeds (button should be re-enabled)
      fireEvent.click(googleButton);
      await waitFor(() => {
        expect(mockSignInWithOAuth).toHaveBeenCalledTimes(2);
      });
    });
  });
});
