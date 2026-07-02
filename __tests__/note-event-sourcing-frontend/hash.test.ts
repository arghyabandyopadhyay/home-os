import { describe, it, expect } from "vitest"
import { hashContent } from "@/lib/revisions/hash"

describe("hashContent", () => {
  it("returns a 64-character hex string for normal content", async () => {
    const hash = await hashContent("hello world")
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it("produces deterministic output for the same input", async () => {
    const hash1 = await hashContent("test content")
    const hash2 = await hashContent("test content")
    expect(hash1).toBe(hash2)
  })

  it("produces different hashes for different inputs", async () => {
    const hash1 = await hashContent("hello")
    const hash2 = await hashContent("world")
    expect(hash1).not.toBe(hash2)
  })

  it("handles empty string input", async () => {
    const hash = await hashContent("")
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    // SHA-256 of empty string is a well-known constant
    expect(hash).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    )
  })

  it("handles null input by treating as empty string", async () => {
    const hash = await hashContent(null as unknown as string)
    const emptyHash = await hashContent("")
    expect(hash).toBe(emptyHash)
  })

  it("handles undefined input by treating as empty string", async () => {
    const hash = await hashContent(undefined as unknown as string)
    const emptyHash = await hashContent("")
    expect(hash).toBe(emptyHash)
  })
})
