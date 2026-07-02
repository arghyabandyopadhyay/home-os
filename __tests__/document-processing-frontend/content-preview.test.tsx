import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

import { ContentPreview } from "@/components/documents/content-preview"

/**
 * Unit tests for the ContentPreview component.
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 *
 * Tests that:
 * - Placeholder shown when processing status is not "ready"
 * - Tabbed interface (Text / OCR) displayed when content is loaded
 * - Tab switching between Text and OCR works
 * - Pagination at 5000 character boundary with "Show more" button
 * - Empty state when extracted_text is empty
 * - Loading state shows skeleton
 */

// Mock the useDocumentContent hook
vi.mock("@/hooks/queries/use-document-content", () => ({
  useDocumentContent: vi.fn(),
}))

import { useDocumentContent } from "@/hooks/queries/use-document-content"

const mockUseDocumentContent = vi.mocked(useDocumentContent)

describe("ContentPreview component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("placeholder when status is not ready", () => {
    it("shows placeholder message when processingStatus is 'pending'", () => {
      mockUseDocumentContent.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as ReturnType<typeof useDocumentContent>)

      render(<ContentPreview documentId="doc-1" processingStatus="pending" />)

      expect(
        screen.getByText("Content available after processing")
      ).toBeTruthy()
    })

    it("shows placeholder message when processingStatus is 'processing'", () => {
      mockUseDocumentContent.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as ReturnType<typeof useDocumentContent>)

      render(
        <ContentPreview documentId="doc-1" processingStatus="processing" />
      )

      expect(
        screen.getByText("Content available after processing")
      ).toBeTruthy()
    })

    it("shows placeholder message when processingStatus is 'failed'", () => {
      mockUseDocumentContent.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as ReturnType<typeof useDocumentContent>)

      render(<ContentPreview documentId="doc-1" processingStatus="failed" />)

      expect(
        screen.getByText("Content available after processing")
      ).toBeTruthy()
    })
  })

  describe("loading state", () => {
    it("shows skeleton when loading", () => {
      mockUseDocumentContent.mockReturnValue({
        data: undefined,
        isLoading: true,
      } as ReturnType<typeof useDocumentContent>)

      const { container } = render(
        <ContentPreview documentId="doc-1" processingStatus="ready" />
      )

      // Skeleton renders animated pulse divs
      const pulseElements = container.querySelectorAll(".animate-pulse")
      expect(pulseElements.length).toBeGreaterThan(0)
    })
  })

  describe("tabbed interface when content is loaded", () => {
    it("shows Text and OCR tabs when status is ready and content loaded", () => {
      mockUseDocumentContent.mockReturnValue({
        data: {
          document_id: "doc-1",
          extracted_text: "Hello world",
          ocr_text: "OCR content here",
          word_count: 2,
          page_count: 1,
        },
        isLoading: false,
      } as ReturnType<typeof useDocumentContent>)

      render(<ContentPreview documentId="doc-1" processingStatus="ready" />)

      expect(screen.getByRole("tab", { name: "Text" })).toBeTruthy()
      expect(screen.getByRole("tab", { name: "OCR" })).toBeTruthy()
    })

    it("displays extracted text content by default in the Text tab", () => {
      mockUseDocumentContent.mockReturnValue({
        data: {
          document_id: "doc-1",
          extracted_text: "Some extracted text content",
          ocr_text: "OCR output",
          word_count: 4,
          page_count: 1,
        },
        isLoading: false,
      } as ReturnType<typeof useDocumentContent>)

      render(<ContentPreview documentId="doc-1" processingStatus="ready" />)

      expect(screen.getByText("Some extracted text content")).toBeTruthy()
    })
  })

  describe("tab switching between Text and OCR", () => {
    it("shows OCR content when OCR tab is clicked", async () => {
      const user = userEvent.setup()

      mockUseDocumentContent.mockReturnValue({
        data: {
          document_id: "doc-1",
          extracted_text: "Extracted text",
          ocr_text: "OCR specific content",
          word_count: 5,
          page_count: 1,
        },
        isLoading: false,
      } as ReturnType<typeof useDocumentContent>)

      render(<ContentPreview documentId="doc-1" processingStatus="ready" />)

      const ocrTab = screen.getByRole("tab", { name: "OCR" })
      await user.click(ocrTab)

      await waitFor(() => {
        expect(screen.getByText("OCR specific content")).toBeTruthy()
      })
    })

    it("switches back to Text tab after viewing OCR", async () => {
      const user = userEvent.setup()

      mockUseDocumentContent.mockReturnValue({
        data: {
          document_id: "doc-1",
          extracted_text: "Extracted text here",
          ocr_text: "OCR output here",
          word_count: 6,
          page_count: 1,
        },
        isLoading: false,
      } as ReturnType<typeof useDocumentContent>)

      render(<ContentPreview documentId="doc-1" processingStatus="ready" />)

      // Click OCR tab
      await user.click(screen.getByRole("tab", { name: "OCR" }))
      await waitFor(() => {
        expect(screen.getByText("OCR output here")).toBeTruthy()
      })

      // Click back to Text tab
      await user.click(screen.getByRole("tab", { name: "Text" }))
      await waitFor(() => {
        expect(screen.getByText("Extracted text here")).toBeTruthy()
      })
    })
  })

  describe("pagination at 5000 character boundary", () => {
    it("shows all content without Show more when text is under 5000 chars", () => {
      const shortText = "A".repeat(4000)

      mockUseDocumentContent.mockReturnValue({
        data: {
          document_id: "doc-1",
          extracted_text: shortText,
          ocr_text: null,
          word_count: 1,
          page_count: 1,
        },
        isLoading: false,
      } as ReturnType<typeof useDocumentContent>)

      render(<ContentPreview documentId="doc-1" processingStatus="ready" />)

      expect(screen.queryByText("Show more")).toBeNull()
    })

    it("truncates content at 5000 chars and shows Show more button", () => {
      const longText = "B".repeat(8000)

      mockUseDocumentContent.mockReturnValue({
        data: {
          document_id: "doc-1",
          extracted_text: longText,
          ocr_text: null,
          word_count: 1,
          page_count: 1,
        },
        isLoading: false,
      } as ReturnType<typeof useDocumentContent>)

      render(<ContentPreview documentId="doc-1" processingStatus="ready" />)

      // Should show "Show more" button
      expect(screen.getByText("Show more")).toBeTruthy()

      // Displayed text should be truncated to 5000
      const preElement = screen.getByText("B".repeat(5000))
      expect(preElement).toBeTruthy()
    })

    it("reveals more content when Show more is clicked", () => {
      const longText = "C".repeat(12000)

      mockUseDocumentContent.mockReturnValue({
        data: {
          document_id: "doc-1",
          extracted_text: longText,
          ocr_text: null,
          word_count: 1,
          page_count: 1,
        },
        isLoading: false,
      } as ReturnType<typeof useDocumentContent>)

      render(<ContentPreview documentId="doc-1" processingStatus="ready" />)

      // Click "Show more" — reveals next 5000 chars (total 10000)
      fireEvent.click(screen.getByText("Show more"))

      // Should still have "Show more" since 12000 > 10000
      expect(screen.getByText("Show more")).toBeTruthy()

      // Now shows 10000 chars
      const preElement = screen.getByText("C".repeat(10000))
      expect(preElement).toBeTruthy()
    })

    it("hides Show more when all content is revealed", () => {
      const longText = "D".repeat(7000)

      mockUseDocumentContent.mockReturnValue({
        data: {
          document_id: "doc-1",
          extracted_text: longText,
          ocr_text: null,
          word_count: 1,
          page_count: 1,
        },
        isLoading: false,
      } as ReturnType<typeof useDocumentContent>)

      render(<ContentPreview documentId="doc-1" processingStatus="ready" />)

      // Initially shows "Show more" (7000 > 5000)
      expect(screen.getByText("Show more")).toBeTruthy()

      // Click to reveal all (5000 + 5000 = 10000, covers remaining 2000)
      fireEvent.click(screen.getByText("Show more"))

      // "Show more" should no longer be visible
      expect(screen.queryByText("Show more")).toBeNull()
    })
  })

  describe("empty state when no content", () => {
    it("shows 'No text content found' when extracted_text is empty string", () => {
      mockUseDocumentContent.mockReturnValue({
        data: {
          document_id: "doc-1",
          extracted_text: "",
          ocr_text: "Some OCR",
          word_count: 0,
          page_count: 1,
        },
        isLoading: false,
      } as ReturnType<typeof useDocumentContent>)

      render(<ContentPreview documentId="doc-1" processingStatus="ready" />)

      expect(screen.getByText("No text content found")).toBeTruthy()
    })

    it("shows 'No text content found' when extracted_text is null", () => {
      mockUseDocumentContent.mockReturnValue({
        data: {
          document_id: "doc-1",
          extracted_text: null,
          ocr_text: null,
          word_count: 0,
          page_count: 0,
        },
        isLoading: false,
      } as ReturnType<typeof useDocumentContent>)

      render(<ContentPreview documentId="doc-1" processingStatus="ready" />)

      expect(screen.getByText("No text content found")).toBeTruthy()
    })

    it("shows 'No OCR content found' when ocr_text is empty and OCR tab is selected", async () => {
      const user = userEvent.setup()

      mockUseDocumentContent.mockReturnValue({
        data: {
          document_id: "doc-1",
          extracted_text: "Some text",
          ocr_text: "",
          word_count: 2,
          page_count: 1,
        },
        isLoading: false,
      } as ReturnType<typeof useDocumentContent>)

      render(<ContentPreview documentId="doc-1" processingStatus="ready" />)

      await user.click(screen.getByRole("tab", { name: "OCR" }))

      await waitFor(() => {
        expect(screen.getByText("No OCR content found")).toBeTruthy()
      })
    })
  })

  describe("hook called with correct parameters", () => {
    it("passes enabled=true when status is ready", () => {
      mockUseDocumentContent.mockReturnValue({
        data: undefined,
        isLoading: true,
      } as ReturnType<typeof useDocumentContent>)

      render(<ContentPreview documentId="doc-123" processingStatus="ready" />)

      expect(mockUseDocumentContent).toHaveBeenCalledWith("doc-123", true)
    })

    it("passes enabled=false when status is not ready", () => {
      mockUseDocumentContent.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as ReturnType<typeof useDocumentContent>)

      render(
        <ContentPreview documentId="doc-456" processingStatus="pending" />
      )

      expect(mockUseDocumentContent).toHaveBeenCalledWith("doc-456", false)
    })
  })
})
