import { describe, it, expect } from "vitest"

import {
  computeWordDiff,
  extractTextFromProseMirror,
} from "@/lib/revisions/diff"

describe("computeWordDiff", () => {
  it("returns empty array for two empty strings", () => {
    const result = computeWordDiff("", "")
    expect(result).toEqual([])
  })

  it("returns all additions when old is empty", () => {
    const result = computeWordDiff("", "hello world")
    expect(result).toEqual([{ type: "addition", value: "hello world" }])
  })

  it("returns all deletions when new is empty", () => {
    const result = computeWordDiff("hello world", "")
    expect(result).toEqual([{ type: "deletion", value: "hello world" }])
  })

  it("returns unchanged for identical strings", () => {
    const result = computeWordDiff("hello world", "hello world")
    expect(result).toEqual([{ type: "unchanged", value: "hello world" }])
  })

  it("detects word-level additions and deletions", () => {
    const result = computeWordDiff("hello world", "hello beautiful world")
    const additions = result.filter((c) => c.type === "addition")
    const deletions = result.filter((c) => c.type === "deletion")
    const unchanged = result.filter((c) => c.type === "unchanged")

    expect(additions.length).toBeGreaterThan(0)
    expect(deletions.length).toBe(0)
    expect(unchanged.length).toBeGreaterThan(0)
  })

  it("detects word replacements", () => {
    const result = computeWordDiff("the cat sat", "the dog sat")
    const additions = result.filter((c) => c.type === "addition")
    const deletions = result.filter((c) => c.type === "deletion")

    expect(additions.some((c) => c.value.includes("dog"))).toBe(true)
    expect(deletions.some((c) => c.value.includes("cat"))).toBe(true)
  })

  it("truncates very long inputs at 50000 characters", () => {
    const longText = "a".repeat(60000)
    const result = computeWordDiff(longText, longText + "b")
    // Should not throw and should complete
    expect(result.length).toBeGreaterThan(0)
  })
})

describe("extractTextFromProseMirror", () => {
  it("returns empty string for empty input", () => {
    expect(extractTextFromProseMirror("")).toBe("")
  })

  it("returns raw string for invalid JSON", () => {
    expect(extractTextFromProseMirror("not json at all")).toBe(
      "not json at all"
    )
  })

  it("extracts text from a simple paragraph document", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    }
    expect(extractTextFromProseMirror(JSON.stringify(doc))).toBe("Hello world")
  })

  it("separates paragraphs with newlines", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "First paragraph" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Second paragraph" }],
        },
      ],
    }
    expect(extractTextFromProseMirror(JSON.stringify(doc))).toBe(
      "First paragraph\nSecond paragraph"
    )
  })

  it("handles headings", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "heading",
          content: [{ type: "text", text: "Title" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Body text" }],
        },
      ],
    }
    expect(extractTextFromProseMirror(JSON.stringify(doc))).toBe(
      "Title\nBody text"
    )
  })

  it("handles empty paragraphs", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "paragraph", content: [] },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello" }],
        },
      ],
    }
    expect(extractTextFromProseMirror(JSON.stringify(doc))).toBe("Hello")
  })

  it("handles inline marks (bold, italic)", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello " },
            { type: "text", text: "world", marks: [{ type: "bold" }] },
          ],
        },
      ],
    }
    expect(extractTextFromProseMirror(JSON.stringify(doc))).toBe("Hello world")
  })

  it("truncates at 50000 characters", () => {
    const longText = "a".repeat(60000)
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: longText }],
        },
      ],
    }
    const result = extractTextFromProseMirror(JSON.stringify(doc))
    expect(result.length).toBe(50000)
  })

  it("returns raw string truncated at 50000 chars for invalid JSON over limit", () => {
    const longInvalid = "x".repeat(60000)
    const result = extractTextFromProseMirror(longInvalid)
    expect(result.length).toBe(50000)
  })
})
