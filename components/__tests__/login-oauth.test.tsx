import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock sonner
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: mockToastError },
  Toaster: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="toaster">{children}</div>
  ),
}));

// Mock supabase client
const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
const mockSignInWithPassword = vi.fn().mockResolvedValue({ error: null });
const mockSignUp = vi.fn().mockResolvedValue({ error: null });
const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      getUser: mockGetUser,
    },
  }),
}));

// Mock FooterNav to avoid unrelated rendering issues
vi.mock("@/components/legal/footer-nav", () => ({
  FooterNav: () => <nav data-testid="footer-nav">Footer</nav>,
}));

describe("Login Page OAuth UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location.search
    Object.defineProperty(window, "location", {
      value: { ...window.location, search: "", origin: "http://localhost:3000" },
      writable: true,
    });
    // Mock history.replaceState
    window.history.replaceState = vi.fn();
  });

  it("renders OAuth buttons with correct labels", async () => {
    const LoginPage = (await import("@/app/login/page")).default;
    render(<LoginPage />);

    expect(screen.getByText("Continue with Google")).toBeDefined();
    expect(screen.queryByText("Continue with GitHub")).toBeNull();
  });

  it("renders OAuth buttons with correct aria-labels", async () => {
    const LoginPage = (await import("@/app/login/page")).default;
    render(<LoginPage />);

    expect(screen.getByLabelText("Sign in with Google")).toBeDefined();
    expect(screen.queryByLabelText("Sign in with GitHub")).toBeNull();
  });

  it("renders Google icon SVG with correct viewBox", async () => {
    const LoginPage = (await import("@/app/login/page")).default;
    const { container } = render(<LoginPage />);

    // Google icon has viewBox="0 0 24 24" and specific fill colors
    const googleButton = screen.getByLabelText("Sign in with Google");
    const googleSvg = googleButton.querySelector("svg");
    expect(googleSvg).not.toBeNull();
    expect(googleSvg?.getAttribute("viewBox")).toBe("0 0 24 24");
    // Google icon has colored paths (multi-color)
    const paths = googleSvg?.querySelectorAll("path");
    expect(paths?.length).toBeGreaterThanOrEqual(4);
  });

  it("does not render GitHub icon SVG (GitHub OAuth removed)", async () => {
    const LoginPage = (await import("@/app/login/page")).default;
    render(<LoginPage />);

    expect(screen.queryByLabelText("Sign in with GitHub")).toBeNull();
  });

  it("displays error toast on mount when error_description is in URL", async () => {
    Object.defineProperty(window, "location", {
      value: {
        ...window.location,
        search: "?error_description=Something+went+wrong",
        origin: "http://localhost:3000",
      },
      writable: true,
    });

    const LoginPage = (await import("@/app/login/page")).default;
    render(<LoginPage />);

    // Wait for useEffect to fire
    await vi.waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Something went wrong");
    });
  });

  it("cleans URL after displaying error toast", async () => {
    Object.defineProperty(window, "location", {
      value: {
        ...window.location,
        search: "?error_description=Auth+failed",
        origin: "http://localhost:3000",
      },
      writable: true,
    });

    const LoginPage = (await import("@/app/login/page")).default;
    render(<LoginPage />);

    await vi.waitFor(() => {
      expect(window.history.replaceState).toHaveBeenCalledWith({}, "", "/login");
    });
  });

  it("OAuth buttons are native button elements (keyboard-focusable)", async () => {
    const LoginPage = (await import("@/app/login/page")).default;
    render(<LoginPage />);

    const googleButton = screen.getByLabelText("Sign in with Google");

    expect(googleButton.tagName).toBe("BUTTON");
  });

  it("OAuth buttons have focus-visible ring classes for keyboard accessibility", async () => {
    const LoginPage = (await import("@/app/login/page")).default;
    render(<LoginPage />);

    const googleButton = screen.getByLabelText("Sign in with Google");

    expect(googleButton.className).toContain("focus-visible:ring-2");
  });

  it("OAuth buttons are not disabled by default", async () => {
    const LoginPage = (await import("@/app/login/page")).default;
    render(<LoginPage />);

    const googleButton = screen.getByLabelText("Sign in with Google") as HTMLButtonElement;

    expect(googleButton.disabled).toBe(false);
  });
});
