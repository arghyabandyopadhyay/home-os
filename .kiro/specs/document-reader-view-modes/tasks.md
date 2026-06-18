# Implementation Plan: Document Reader View Modes

## Overview

This plan implements multiple view modes (single page, single page scroll, two page scroll) and fit-to-page scaling for the `DocumentReader` component. The approach extracts logic into custom hooks, builds internal subcomponents for each view layout, and reorganizes the toolbar — all within the component boundary at `components/shared/document-reader.tsx`.

## Tasks

- [x] 1. Define types, utility functions, and custom hooks
  - [x] 1.1 Create ViewMode type and utility functions
    - Create `components/shared/document-reader/types.ts` with `ViewMode` type and helper functions
    - Implement `computePagePairs(numPages)` for two-page layout pairing logic
    - Implement `computeFitWidth(containerWidth, viewMode, padding)` for page width calculation
    - Implement `validatePageInput(input, numPages, currentPage)` for page input clamping/reversion
    - Implement `getMostVisiblePage(entries)` for determining the page closest to viewport center
    - Implement `formatPageLabel(pair)` for display label formatting (single number or en-dash range)
    - _Requirements: 3.1, 3.2, 3.3, 4.6, 5.2, 5.6_

  - [ ]* 1.2 Write property test for page pairing algorithm
    - **Property 5: Page pairing algorithm correctness**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 1.3 Write property test for page range display label formatting
    - **Property 6: Page range display label formatting**
    - **Validates: Requirements 3.3**

  - [ ]* 1.4 Write property test for page input validation and clamping
    - **Property 7: Page input validation and clamping**
    - **Validates: Requirements 4.6**

  - [ ]* 1.5 Write property test for fit-to-page width calculation
    - **Property 8: Fit-to-page width calculation prevents horizontal overflow**
    - **Validates: Requirements 5.2, 5.6, 3.5**

  - [x] 1.6 Create useViewMode hook
    - Create `components/shared/document-reader/use-view-mode.ts`
    - Manage `viewMode` state defaulting to `"single-page"`
    - Expose `viewMode` and `setViewMode`
    - _Requirements: 1.1, 1.3_

  - [x] 1.7 Create useFitToPage hook
    - Create `components/shared/document-reader/use-fit-to-page.ts`
    - Manage `fitToPage` state defaulting to `true`
    - Use `ResizeObserver` on container ref to measure width, debounced at 200ms
    - Calculate `pageWidth` using `computeFitWidth` based on view mode
    - Return `undefined` for pageWidth when fit-to-page is disabled
    - Fall back to window resize event if ResizeObserver not supported
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 1.8 Create usePageTracking hook
    - Create `components/shared/document-reader/use-page-tracking.ts`
    - In single-page mode: manage `currentPage` state with prev/next/goToPage
    - In scroll modes: use `IntersectionObserver` on page elements to determine most-visible page
    - Provide `scrollToPage(page)` for direct navigation from page input
    - Compute `displayLabel` (single number or range string)
    - Fall back to scroll event listener if IntersectionObserver not supported
    - _Requirements: 1.4, 1.5, 2.3, 2.5, 3.3, 4.5, 4.6_

  - [ ]* 1.9 Write property test for most-visible page determination
    - **Property 4: Most-visible page determination**
    - **Validates: Requirements 2.3, 3.3**

- [x] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Build internal view components
  - [x] 3.1 Create SinglePageView component
    - Create `components/shared/document-reader/single-page-view.tsx`
    - Render a single `Page` at current page number, centered horizontally
    - Accept `pageWidth` prop for fit-to-page scaling
    - Accept `currentPage`, `numPages`, `onPrev`, `onNext` props
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 3.2 Create SinglePageScrollView component
    - Create `components/shared/document-reader/single-page-scroll-view.tsx`
    - Render all pages in a vertical stack with 24px gap
    - Accept `pageWidth` prop for fit-to-page scaling
    - Assign data attributes to page elements for IntersectionObserver targeting
    - Forward container ref for scroll tracking
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 3.3 Create TwoPageScrollView component
    - Create `components/shared/document-reader/two-page-scroll-view.tsx`
    - Use `computePagePairs` to arrange pages in rows
    - Page 1 alone on first row, then pairs (2,3), (4,5), etc.
    - Scale both pages to fit within viewport width (min 300px each, or scale proportionally)
    - Accept `pageWidth` prop for fit-to-page scaling
    - Handle single-page documents without empty placeholder
    - Assign data attributes for IntersectionObserver targeting
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 1.7_

  - [ ]* 3.4 Write property test for mode switch page preservation
    - **Property 2: Switching to single-page mode preserves the most-visible page**
    - **Property 3: Switching from single-page to a scroll mode scrolls to the current page**
    - **Validates: Requirements 1.4, 1.5**

  - [ ]* 3.5 Write property test for fit-to-page state preservation across mode switches
    - **Property 9: Fit-to-page state preservation across mode switches**
    - **Validates: Requirements 5.5**

- [x] 4. Build toolbar components and reorganize toolbar
  - [x] 4.1 Create ViewModeSelector component
    - Create `components/shared/document-reader/view-mode-selector.tsx`
    - Render three icon buttons (single page, scroll, two-page) as a segmented control
    - Use `aria-label` on each button including mode name and selection state
    - Show visually distinct active state distinguishable without color alone
    - Collapse into dropdown menu when viewport < 768px
    - Minimum 44×44px touch targets
    - _Requirements: 1.1, 1.6, 6.2, 6.5, 6.6_

  - [x] 4.2 Create FitToPageToggle component
    - Create `components/shared/document-reader/fit-to-page-toggle.tsx`
    - Render a toggle button using Maximize/Minimize icon from Lucide
    - Use `aria-pressed` to indicate enabled/disabled state
    - Include `aria-label` with name and current state
    - Minimum 44×44px touch target
    - _Requirements: 5.1, 6.3, 6.6_

  - [x] 4.3 Reorganize the DocumentReader toolbar
    - Update `components/shared/document-reader.tsx` toolbar layout
    - Group ViewModeSelector and FitToPageToggle in one control group
    - Separate from page navigation and download button with visible divider or ≥16px gap
    - Add `role="toolbar"` with `aria-label="Document reader controls"`
    - Support keyboard navigation between controls using Tab key
    - Ensure all controls meet 44×44px minimum touch target
    - Hide prev/next buttons when in scroll modes
    - _Requirements: 6.1, 6.4, 6.5, 6.6, 2.4, 3.4_

  - [ ]* 4.4 Write property test for toolbar touch target sizes
    - **Property 10: Toolbar interactive controls meet minimum touch target size**
    - **Validates: Requirements 6.6**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Integrate everything into DocumentReader
  - [x] 6.1 Refactor DocumentReader to use new hooks and components
    - Restructure `components/shared/document-reader.tsx` as orchestrator
    - Import and compose `useViewMode`, `useFitToPage`, `usePageTracking` hooks
    - Conditionally render `SinglePageView`, `SinglePageScrollView`, or `TwoPageScrollView`
    - Keep `Document` component mounted across mode switches (no re-fetch)
    - Ensure mode switching completes within 300ms without reloading PDF
    - Wire page input form to `scrollToPage` in scroll modes and `goToPage` in single-page mode
    - Handle container width 0 case (defer rendering, show loading spinner)
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.5, 4.5, 4.6_

  - [ ]* 6.2 Write property test for view mode switch not reloading PDF
    - **Property 1: View mode switch does not reload the PDF document**
    - **Validates: Requirements 1.2**

  - [ ]* 6.3 Write unit tests for DocumentReader integration
    - Test default state: single-page mode with fit-to-page enabled
    - Test view mode selector renders all three options
    - Test navigation buttons hidden in scroll modes
    - Test navigation buttons disabled at boundaries
    - Test toolbar accessibility attributes
    - Test single-page document in two-page mode
    - Test error state with download fallback
    - _Requirements: 1.1, 1.3, 1.7, 2.4, 3.4, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3, 6.4_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All new files go under `components/shared/document-reader/` except the main component which stays at its current path
- Tests go in `__tests__/document-reader-view-modes/`
- The `Document` component from react-pdf must remain mounted across mode switches to avoid re-fetching

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8"] },
    { "id": 2, "tasks": ["1.9", "3.1", "3.2", "3.3"] }, 
    { "id": 3, "tasks": ["3.4", "3.5", "4.1", "4.2"] },
    { "id": 4, "tasks": ["4.3", "4.4"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3"] }
  ]
}
```
