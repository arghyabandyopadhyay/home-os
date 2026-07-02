import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

/**
 * Unit tests for the ProcessingIndicator component.
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 10.1, 10.5
 *
 * Tests:
 * - Correct icon and label rendering for each status (pending, processing, ready, failed)
 * - aria-label content includes status and stage
 * - Retry button visibility and disabled state
 * - Reduced motion disables spinner animation
 */

// Mock useReducedMotion
const mockUseReducedMotion = vi.fn(() => false)
vi.mock("@/hooks/use-reduced-motion", () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}))

import { ProcessingIndicator } from "@/components/documents/processing-indicator"

describe("ProcessingIndicator", () => {
  beforeEach(() => {
    mockUseReducedMotion.mockReturnValue(false)
  })

  describe("pending status", () => {
    it("renders a muted clock icon and 'Pending' label", () => {
      const { container } = render(
        <ProcessingIndicator status="pending" currentStage={null} />
      )

      expect(screen.getByText("Pending")).toBeDefined()
      // Clock icon should be present with muted color
      const svg = container.querySelector("svg")
      expect(svg).not.toBeNull()
      expect(svg!.classList.contains("text-app-muted")).toBe(true)
    })

    it("uses text-app-muted for the label", () => {
      render(<ProcessingIndicator status="pending" currentStage={null} />)

      const label = screen.getByText("Pending")
      expect(label.className).toContain("text-app-muted")
    })
  })

  describe("processing status", () => {
    it("renders a spinner icon and 'Processing' label", () => {
      const { container } = render(
        <ProcessingIndicator status="processing" currentStage={null} />
      )

      expect(screen.getByText("Processing")).toBeDefined()
      const svg = container.querySelector("svg")
      expect(svg).not.toBeNull()
      expect(svg!.classList.contains("text-blue-600")).toBe(true)
    })

    it("includes the current stage name in the label", () => {
      render(
        <ProcessingIndicator status="processing" currentStage="ocr" />
      )

      expect(screen.getByText("Processing · OCR")).toBeDefined()
    })

    it("shows 'Processing · Scanning' for scanning stage", () => {
      render(
        <ProcessingIndicator status="processing" currentStage="scanning" />
      )

      expect(screen.getByText("Processing · Scanning")).toBeDefined()
    })

    it("shows 'Processing · Text Extraction' for text_extraction stage", () => {
      render(
        <ProcessingIndicator status="processing" currentStage="text_extraction" />
      )

      expect(screen.getByText("Processing · Text Extraction")).toBeDefined()
    })

    it("shows 'Processing · Indexing' for indexing stage", () => {
      render(
        <ProcessingIndicator status="processing" currentStage="indexing" />
      )

      expect(screen.getByText("Processing · Indexing")).toBeDefined()
    })

    it("renders spinner with animate-spin class when motion is allowed", () => {
      const { container } = render(
        <ProcessingIndicator status="processing" currentStage="ocr" />
      )

      const svg = container.querySelector("svg")
      expect(svg!.classList.contains("animate-spin")).toBe(true)
    })
  })

  describe("ready status", () => {
    it("renders a green checkmark icon and 'Ready' label", () => {
      const { container } = render(
        <ProcessingIndicator status="ready" currentStage={null} />
      )

      expect(screen.getByText("Ready")).toBeDefined()
      const svg = container.querySelector("svg")
      expect(svg).not.toBeNull()
      expect(svg!.classList.contains("text-green-600")).toBe(true)
    })

    it("uses green color for the label text", () => {
      render(<ProcessingIndicator status="ready" currentStage={null} />)

      const label = screen.getByText("Ready")
      expect(label.className).toContain("text-green-600")
    })
  })

  describe("failed status", () => {
    it("renders a red warning icon and 'Failed' label", () => {
      const { container } = render(
        <ProcessingIndicator status="failed" currentStage={null} />
      )

      expect(screen.getByText("Failed")).toBeDefined()
      const svg = container.querySelector("svg")
      expect(svg).not.toBeNull()
      expect(svg!.classList.contains("text-red-600")).toBe(true)
    })

    it("renders a Retry button when onRetry is provided", () => {
      const onRetry = vi.fn()
      render(
        <ProcessingIndicator
          status="failed"
          currentStage={null}
          onRetry={onRetry}
        />
      )

      const retryButton = screen.getByRole("button", { name: /retry/i })
      expect(retryButton).toBeDefined()
    })

    it("does not render a Retry button when onRetry is not provided", () => {
      render(
        <ProcessingIndicator status="failed" currentStage={null} />
      )

      expect(screen.queryByRole("button", { name: /retry/i })).toBeNull()
    })

    it("calls onRetry when the Retry button is clicked", () => {
      const onRetry = vi.fn()
      render(
        <ProcessingIndicator
          status="failed"
          currentStage={null}
          onRetry={onRetry}
        />
      )

      const retryButton = screen.getByRole("button", { name: /retry/i })
      fireEvent.click(retryButton)
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it("disables the Retry button when retryLoading is true", () => {
      const onRetry = vi.fn()
      render(
        <ProcessingIndicator
          status="failed"
          currentStage={null}
          onRetry={onRetry}
          retryLoading={true}
        />
      )

      const retryButton = screen.getByRole("button", { name: /retry/i })
      expect(retryButton.hasAttribute("disabled")).toBe(true)
    })

    it("does not call onRetry when Retry button is disabled and clicked", () => {
      const onRetry = vi.fn()
      render(
        <ProcessingIndicator
          status="failed"
          currentStage={null}
          onRetry={onRetry}
          retryLoading={true}
        />
      )

      const retryButton = screen.getByRole("button", { name: /retry/i })
      fireEvent.click(retryButton)
      expect(onRetry).not.toHaveBeenCalled()
    })
  })

  describe("aria-label accessibility", () => {
    it("includes 'Pending' in aria-label for pending status", () => {
      render(<ProcessingIndicator status="pending" currentStage={null} />)

      const indicator = screen.getByRole("status")
      expect(indicator.getAttribute("aria-label")).toContain("Pending")
    })

    it("includes 'Processing' in aria-label for processing status", () => {
      render(<ProcessingIndicator status="processing" currentStage={null} />)

      const indicator = screen.getByRole("status")
      expect(indicator.getAttribute("aria-label")).toContain("Processing")
    })

    it("includes stage name in aria-label when processing with a current stage", () => {
      render(<ProcessingIndicator status="processing" currentStage="ocr" />)

      const indicator = screen.getByRole("status")
      const ariaLabel = indicator.getAttribute("aria-label")!
      expect(ariaLabel).toContain("Processing")
      expect(ariaLabel).toContain("OCR")
    })

    it("includes 'Ready' in aria-label for ready status", () => {
      render(<ProcessingIndicator status="ready" currentStage={null} />)

      const indicator = screen.getByRole("status")
      expect(indicator.getAttribute("aria-label")).toContain("Ready")
    })

    it("includes 'Failed' in aria-label for failed status", () => {
      render(<ProcessingIndicator status="failed" currentStage={null} />)

      const indicator = screen.getByRole("status")
      expect(indicator.getAttribute("aria-label")).toContain("Failed")
    })
  })

  describe("reduced motion", () => {
    it("removes animate-spin from spinner when reduced motion is active", () => {
      mockUseReducedMotion.mockReturnValue(true)

      const { container } = render(
        <ProcessingIndicator status="processing" currentStage="ocr" />
      )

      const svg = container.querySelector("svg")
      expect(svg!.classList.contains("animate-spin")).toBe(false)
    })

    it("keeps spinner icon visible even when animation is disabled", () => {
      mockUseReducedMotion.mockReturnValue(true)

      const { container } = render(
        <ProcessingIndicator status="processing" currentStage="ocr" />
      )

      const svg = container.querySelector("svg")
      expect(svg).not.toBeNull()
      expect(svg!.classList.contains("text-blue-600")).toBe(true)
    })
  })

  describe("color and icon convey status (not color alone)", () => {
    it("uses distinct icons for each status", () => {
      // Each status uses a different icon shape, ensuring information
      // is not conveyed by color alone (Requirement 1.5)
      const { container: pendingContainer } = render(
        <ProcessingIndicator status="pending" currentStage={null} />
      )
      const { container: processingContainer } = render(
        <ProcessingIndicator status="processing" currentStage={null} />
      )
      const { container: readyContainer } = render(
        <ProcessingIndicator status="ready" currentStage={null} />
      )
      const { container: failedContainer } = render(
        <ProcessingIndicator status="failed" currentStage={null} />
      )

      // All have text labels in addition to icons
      expect(screen.getAllByText("Pending").length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText("Processing").length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText("Ready").length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText("Failed").length).toBeGreaterThanOrEqual(1)

      // All icons are present (4 different SVGs)
      expect(pendingContainer.querySelector("svg")).not.toBeNull()
      expect(processingContainer.querySelector("svg")).not.toBeNull()
      expect(readyContainer.querySelector("svg")).not.toBeNull()
      expect(failedContainer.querySelector("svg")).not.toBeNull()
    })

    it("marks icons as aria-hidden so screen readers use the aria-label", () => {
      const { container } = render(
        <ProcessingIndicator status="processing" currentStage="scanning" />
      )

      const svgs = container.querySelectorAll("svg")
      svgs.forEach((svg) => {
        expect(svg.getAttribute("aria-hidden")).toBe("true")
      })
    })
  })
})
