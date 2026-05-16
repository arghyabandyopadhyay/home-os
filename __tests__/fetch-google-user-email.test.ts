import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchGoogleUserEmail } from "@/lib/google-calendar";

describe("fetchGoogleUserEmail", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns email on successful response", async () => {
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ email: "user@gmail.com" }), {
        status: 200,
      }),
    );

    const result = await fetchGoogleUserEmail("valid-token");

    expect(result).toBe("user@gmail.com");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: "Bearer valid-token" } },
    );
  });

  it("returns null when response is not ok", async () => {
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }),
    );

    const result = await fetchGoogleUserEmail("bad-token");

    expect(result).toBeNull();
  });

  it("returns null when email field is missing from response", async () => {
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ name: "User" }), { status: 200 }),
    );

    const result = await fetchGoogleUserEmail("valid-token");

    expect(result).toBeNull();
  });

  it("returns null on network error (does not throw)", async () => {
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockRejectedValueOnce(new Error("Network failure"));

    const result = await fetchGoogleUserEmail("valid-token");

    expect(result).toBeNull();
  });

  it("returns null when email field is empty string", async () => {
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ email: "" }), { status: 200 }),
    );

    const result = await fetchGoogleUserEmail("valid-token");

    expect(result).toBeNull();
  });
});
