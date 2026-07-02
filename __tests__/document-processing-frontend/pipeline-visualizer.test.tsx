import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import React from "react"

import { PipelineVisualizer } from "@/components/documents/pipeline-visualizer"
import type { DocumentProcessingState, PipelineStage } from "@/types/document"

/**
 * Unit tests for the PipelineVisualizer component.
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6, 10.3
 *
 * Tests that:
 * - Stage ordering is always scanning → ocr → text_extraction → indexing
 * - Completed/active/future stage rendering
 * - Failed stage rendering with unreached subsequent stages
 * - progressbar aria attributes
 * - Reduced motion static highlight (no pulsing animation)
 */

// Mock useReducedMotion hook
vi.mock("@/hooks/use-reduced-motion", () => ({
  useReducedMotion: vi.fn(() => false),
}))

import { useReducedMotion } from "@/hooks/use-reduced-motion"

const mockUseReducedMotion = vi.mocked(useReducedMotion)

function makeProcessingState(
  overrides: Partial<DocumentProcessingState> = {}
): DocumentProcessingState {
  return {
    status: "processing",
    current_stage: null,
    completed_stages: [],
    failed_stage: null,
    error_message: null,
    started_at: null,
    completed_at: null,
    ...overrides,
  }
}

describe("PipelineVisualizer component", () => {
  beforeEach(() => {
    mockUseReducedMotion.mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Stage ordering", () => {
    it("displays all 4 stages in fixed order: Scanning → OCR → Text Extraction → Indexing", () => {
      const processing = makeProcessingState({
        status: "processing",
        current_stage: "scanning",
        completed_stages: [],
      })

      render(<PipelineVisualizer processing={processing} />)

      const expectedLabels = ["Scanning", "OCR", "Text Extraction", "Indexing"]
      const allText = screen.getByRole("progressbar").textContent ?? ""

      // Verify all labels are present
      for (const label of expectedLabels) {
        expect(screen.getByText(label)).toBeTruthy()
      }

      // Verify order by checking relative positions in the text content
      let lastIndex = -1
      for (const label of expectedLabels) {
        const index = allText.indexOf(label)
        expect(index).toBeGreaterThan(lastIndex)
        lastIndex = index
      }
    })
  })

  describe("Completed/active/future stage rendering", () => {
    it("renders completed stages with success color, active with blue, future with muted", () => {
      // Processing at "ocr" stage: scanning completed, ocr active, rest future
      const processing = makeProcessingState({
        status: "processing",
        current_stage: "ocr",
        completed_stages: ["scanning"],
        started_at: new Date().toISOString(),
      })

      const { container } = render(<PipelineVisualizer processing={processing} />)

      // Scanning label should have green/success styling
      const scanningLabel = screen.getByText("Scanning")
      expect(scanningLabel.className).toContain("text-green")

      // OCR label should have blue/active styling
      const ocrLabel = screen.getByText("OCR")
      expect(ocrLabel.className).toContain("text-blue")

      // Text Extraction and Indexing should have muted styling
      const textExtractionLabel = screen.getByText("Text Extraction")
      expect(textExtractionLabel.className).toContain("text-app-muted")

      const indexingLabel = screen.getByText("Indexing")
      expect(indexingLabel.className).toContain("text-app-muted")
    })

    it("shows all stages as completed when status is ready", () => {
      const processing = makeProcessingState({
        status: "ready",
        current_stage: null,
        completed_stages: ["scanning", "ocr", "text_extraction", "indexing"],
        completed_at: new Date().toISOString(),
      })

      render(<PipelineVisualizer processing={processing} />)

      // All stage labels should have green/success styling
      const labels = ["Scanning", "OCR", "Text Extraction", "Indexing"]
      for (const label of labels) {
        const el = screen.getByText(label)
        expect(el.className).toContain("text-green")
      }
    })
  })

  describe("Failed stage rendering", () => {
    it("marks failed stage with red styling and subsequent stages as unreached", () => {
      // Failed at text_extraction: scanning+ocr completed, text_extraction failed, indexing unreached
      const processing = makeProcessingState({
        status: "failed",
        current_stage: null,
        completed_stages: ["scanning", "ocr"],
        failed_stage: "text_extraction",
        error_message: "OCR engine error",
      })

      render(<PipelineVisualizer processing={processing} />)

      // Scanning and OCR should be completed (green)
      expect(screen.getByText("Scanning").className).toContain("text-green")
      expect(screen.getByText("OCR").className).toContain("text-green")

      // Text Extraction should be failed (red)
      expect(screen.getByText("Text Extraction").className).toContain("text-red")

      // Indexing should be unreached (muted + opacity)
      const indexingLabel = screen.getByText("Indexing")
      expect(indexingLabel.className).toContain("text-app-muted")
      expect(indexingLabel.className).toContain("opacity-50")
    })
  })

  describe("Progressbar aria attributes", () => {
    it("has role=progressbar with aria-valuenow matching completed stages count", () => {
      const processing = makeProcessingState({
        status: "processing",
        current_stage: "text_extraction",
        completed_stages: ["scanning", "ocr"],
      })

      render(<PipelineVisualizer processing={processing} />)

      const progressbar = screen.getByRole("progressbar")
      expect(progressbar).toBeTruthy()
      expect(progressbar.getAttribute("aria-valuenow")).toBe("2")
      expect(progressbar.getAttribute("aria-valuemax")).toBe("4")
    })

    it("has aria-valuenow=4 when all stages are completed", () => {
      const processing = makeProcessingState({
        status: "ready",
        current_stage: null,
        completed_stages: ["scanning", "ocr", "text_extraction", "indexing"],
      })

      render(<PipelineVisualizer processing={processing} />)

      const progressbar = screen.getByRole("progressbar")
      expect(progressbar.getAttribute("aria-valuenow")).toBe("4")
      expect(progressbar.getAttribute("aria-valuemax")).toBe("4")
    })

    it("has aria-valuenow=0 when no stages are completed", () => {
      const processing = makeProcessingState({
        status: "pending",
        current_stage: null,
        completed_stages: [],
      })

      render(<PipelineVisualizer processing={processing} />)

      const progressbar = screen.getByRole("progressbar")
      expect(progressbar.getAttribute("aria-valuenow")).toBe("0")
      expect(progressbar.getAttribute("aria-valuemax")).toBe("4")
    })

    it("has an accessible aria-label describing progress", () => {
      const processing = makeProcessingState({
        status: "processing",
        current_stage: "ocr",
        completed_stages: ["scanning"],
      })

      render(<PipelineVisualizer processing={processing} />)

      const progressbar = screen.getByRole("progressbar")
      const ariaLabel = progressbar.getAttribute("aria-label")
      expect(ariaLabel).toContain("1")
      expect(ariaLabel).toContain("4")
    })
  })

  describe("Reduced motion", () => {
    it("renders a static dot (no pulse animation element) when reduced motion is active", () => {
      mockUseReducedMotion.mockReturnValue(true)

      const processing = makeProcessingState({
        status: "processing",
        current_stage: "scanning",
        completed_stages: [],
        started_at: new Date().toISOString(),
      })

      const { container } = render(<PipelineVisualizer processing={processing} />)

      // With reduced motion, there should be no element with animate- class (pulsing ring)
      const pulsingElements = container.querySelectorAll("[class*='animate-']")
      expect(pulsingElements.length).toBe(0)

      // But there should still be a dot indicator (static highlight)
      const dots = container.querySelectorAll(".rounded-full")
      expect(dots.length).toBeGreaterThan(0)
    })

    it("renders pulsing animation element when reduced motion is not active", () => {
      mockUseReducedMotion.mockReturnValue(false)

      const processing = makeProcessingState({
        status: "processing",
        current_stage: "scanning",
        completed_stages: [],
        started_at: new Date().toISOString(),
      })

      const { container } = render(<PipelineVisualizer processing={processing} />)

      // Without reduced motion, there should be an element with animate- class (pulsing ring)
      const pulsingElements = container.querySelectorAll("[class*='animate-']")
      expect(pulsingElements.length).toBeGreaterThan(0)
    })
  })
})
