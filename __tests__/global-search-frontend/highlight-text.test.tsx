import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { HighlightText } from "@/components/search/highlight-text"
import type { SearchHighlight } from "@/types/search"

describe("HighlightText", () => {
  describe("fallback to plain text", () => {
    it("renders plain text when highlights array is empty", () => {
      render(<HighlightText text="Hello world" highlights={[]} />)
      expect(screen.getByText("Hello world")).toBeDefined()
      expect(screen.queryByRole("mark")).toBeNull()
    })

    it("renders plain text when first highlight has no fragments", () => {
      const highlights: SearchHighlight[] = [{ field: "title", fragments: [] }]
      render(<HighlightText text="Hello world" highlights={highlights} />)
      expect(screen.getByText("Hello world")).toBeDefined()
    })
  })

  describe("highlight rendering", () => {
    it("renders matched text inside <mark> elements", () => {
      const highlights: SearchHighlight[] = [
        { field: "title", fragments: ["Hello <em>world</em>"] },
      ]
      const { container } = render(
        <HighlightText text="Hello world" highlights={highlights} />
      )
      const mark = container.querySelector("mark")
      expect(mark).not.toBeNull()
      expect(mark!.textContent).toBe("world")
    })

    it("applies correct classes to <mark> elements", () => {
      const highlights: SearchHighlight[] = [
        { field: "title", fragments: ["<em>test</em>"] },
      ]
      const { container } = render(
        <HighlightText text="test" highlights={highlights} />
      )
      const mark = container.querySelector("mark")
      expect(mark!.className).toContain("bg-yellow-200/30")
      expect(mark!.className).toContain("dark:bg-yellow-400/20")
      expect(mark!.className).toContain("rounded-sm")
      expect(mark!.className).toContain("px-0.5")
    })

    it("renders multiple highlighted segments", () => {
      const highlights: SearchHighlight[] = [
        { field: "content", fragments: ["<em>foo</em> bar <em>baz</em>"] },
      ]
      const { container } = render(
        <HighlightText text="foo bar baz" highlights={highlights} />
      )
      const marks = container.querySelectorAll("mark")
      expect(marks.length).toBe(2)
      expect(marks[0].textContent).toBe("foo")
      expect(marks[1].textContent).toBe("baz")
    })

    it("renders non-highlighted text as plain spans", () => {
      const highlights: SearchHighlight[] = [
        { field: "title", fragments: ["Hello <em>world</em> today"] },
      ]
      const { container } = render(
        <HighlightText text="Hello world today" highlights={highlights} />
      )
      const spans = container.querySelectorAll("span > span")
      expect(spans.length).toBe(2)
      expect(spans[0].textContent).toBe("Hello ")
      expect(spans[1].textContent).toBe(" today")
    })

    it("uses the first fragment from the first highlight", () => {
      const highlights: SearchHighlight[] = [
        {
          field: "title",
          fragments: ["<em>first</em> fragment", "<em>second</em> fragment"],
        },
        { field: "content", fragments: ["<em>other</em> highlight"] },
      ]
      const { container } = render(
        <HighlightText text="first fragment" highlights={highlights} />
      )
      const mark = container.querySelector("mark")
      expect(mark!.textContent).toBe("first")
    })
  })

  describe("XSS sanitization", () => {
    it("strips script tags from fragments", () => {
      const highlights: SearchHighlight[] = [
        {
          field: "title",
          fragments: ['<script>alert("xss")</script><em>safe</em>'],
        },
      ]
      const { container } = render(
        <HighlightText text="safe" highlights={highlights} />
      )
      expect(container.querySelector("script")).toBeNull()
      const mark = container.querySelector("mark")
      expect(mark!.textContent).toBe("safe")
    })

    it("strips arbitrary HTML tags but preserves em tags", () => {
      const highlights: SearchHighlight[] = [
        {
          field: "title",
          fragments: ['<div><a href="evil">click</a><em>good</em></div>'],
        },
      ]
      const { container } = render(
        <HighlightText text="click good" highlights={highlights} />
      )
      expect(container.querySelector("a")).toBeNull()
      expect(container.querySelector("div")).toBeNull()
      const mark = container.querySelector("mark")
      expect(mark!.textContent).toBe("good")
    })

    it("strips img tags with onerror handlers", () => {
      const highlights: SearchHighlight[] = [
        {
          field: "title",
          fragments: ['<img onerror="alert(1)" /><em>text</em>'],
        },
      ]
      const { container } = render(
        <HighlightText text="text" highlights={highlights} />
      )
      expect(container.querySelector("img")).toBeNull()
      const mark = container.querySelector("mark")
      expect(mark!.textContent).toBe("text")
    })

    it("preserves text content after stripping dangerous tags", () => {
      const highlights: SearchHighlight[] = [
        {
          field: "title",
          fragments: ["before<b>bold</b>after <em>highlight</em>"],
        },
      ]
      const { container } = render(
        <HighlightText text="before bold after highlight" highlights={highlights} />
      )
      // The bold tag content is preserved as text, just the tag is removed
      const rootSpan = container.querySelector("span")
      expect(rootSpan!.textContent).toContain("beforeboldafter")
      const mark = container.querySelector("mark")
      expect(mark!.textContent).toBe("highlight")
    })
  })
})
