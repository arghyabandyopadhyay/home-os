# Implementation Plan

## Overview

Replace the broken iframe-based `PdfReader` component with the existing `react-pdf`-based `DocumentReader` for PDF books in the `/reader/[id]` route. Move `DocumentReader` to a shared location so both the book reader and document reader routes can use it. This fixes mobile browsers redirecting PDFs to the OS native viewer instead of rendering inline.

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - PDF Book Reader Uses Iframe Instead of React-PDF
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to PDF book inputs opened via `/reader/[id]` — for any valid PDF book (with url and title), the reader route must render a `react-pdf` Document component (not an iframe) and provide page navigation controls
  - Test file: `__tests__/unified-in-app-reader/bug-condition.property.test.ts`
  - Use Vitest + fast-check to generate random book configurations with `fileType = "pdf"` and arbitrary titles/URLs
  - Property: For all PDF books, the reader page component imports and renders `DocumentReader` (from `@/components/shared/document-reader`) passing both `url` and `title` props — NOT `PdfReader` with an iframe
  - Assert: No `<iframe>` element is rendered for PDF books
  - Assert: `DocumentReader` receives both `url` (string) and `title` (string) props
  - Assert: Page navigation controls (prev/next buttons, page number display) are present
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists because `PdfReader` uses iframe and doesn't accept `title`)
  - Document counterexamples: e.g., "For book {title: 'X', url: 'Y', fileType: 'pdf'}, reader renders iframe instead of react-pdf Document component"
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - EPUB Reader and Document Reader Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Test file: `__tests__/unified-in-app-reader/preservation.property.test.ts`
  - Use Vitest + fast-check to generate random book configurations with non-PDF file types (epub, etc.)
  - Observe on UNFIXED code: EPUB books render with `EpubReader` component receiving only `url` prop
  - Observe on UNFIXED code: The reader page wrapper maintains `h-screen bg-app text-app` classes
  - Observe on UNFIXED code: Documents at `/documents/[id]` render with `DocumentReader` receiving `url` and `title`
  - Write property-based tests:
    - For all non-PDF file types (epub), `EpubReader` is rendered (not `DocumentReader` or `PdfReader`)
    - For all EPUB books, only `url` prop is passed to `EpubReader`
    - The outer wrapper div always has `h-screen bg-app text-app` classes regardless of file type
    - `DocumentReader` component accepts `{ url: string, title: string }` props interface (contract preserved)
  - Verify tests pass on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix for unified in-app reader (replace iframe PdfReader with shared DocumentReader)

  - [x] 3.1 Move DocumentReader to shared location
    - Move `components/documents/document-reader.tsx` to `components/shared/document-reader.tsx`
    - The component code itself remains unchanged — only the file location changes
    - _Bug_Condition: isBugCondition(input) where input.route matches "/reader/[id]" AND input.fileType == "pdf" AND rendererUsed == "iframe"_
    - _Preservation: DocumentReader component interface and behavior must remain identical_
    - _Requirements: 2.2, 3.2_

  - [x] 3.2 Update document route import path
    - Update `app/(app)/documents/[id]/page.tsx` to import `DocumentReader` from `@/components/shared/document-reader` instead of `@/components/documents/document-reader`
    - No other changes to this file — all existing behavior preserved
    - _Preservation: Document reader route must continue working identically after import path change_
    - _Requirements: 3.2_

  - [x] 3.3 Update book reader route to use DocumentReader for PDFs
    - Update `app/(app)/reader/[id]/page.tsx`:
      - Remove import of `PdfReader` from `@/components/library/pdf-reader`
      - Add import of `DocumentReader` from `@/components/shared/document-reader`
      - Replace `<PdfReader url={signedUrlData?.signedUrl || ""} />` with `<DocumentReader url={signedUrlData?.signedUrl || ""} title={book.title} />`
      - Keep `EpubReader` usage unchanged for non-PDF books
      - Keep the `h-screen bg-app text-app` wrapper div unchanged
    - _Bug_Condition: isBugCondition(input) where input.route matches "/reader/[id]" AND input.fileType == "pdf"_
    - _Expected_Behavior: PDF books render inline using react-pdf with page navigation, receiving both url and title props_
    - _Preservation: EPUB rendering, wrapper styling, signed URL generation all unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.3, 3.4_

  - [x] 3.4 Delete the broken PdfReader component
    - Delete `components/library/pdf-reader.tsx` (the iframe-based reader that causes the mobile bug)
    - Verify no other files import from this path
    - _Requirements: 1.1, 1.2, 2.1_

  - [x] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - PDF Book Reader Uses React-PDF Inline
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (react-pdf rendering with page navigation)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed — PDF books now render with DocumentReader instead of iframe)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - EPUB Reader and Document Reader Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions — EPUB still uses EpubReader, wrapper styling preserved, DocumentReader contract unchanged)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite with `npm run test`
  - Ensure all property-based tests pass (bug condition + preservation)
  - Ensure no other tests in the project are broken by the changes
  - Verify the document reader route still works (import path updated correctly)
  - Ask the user if questions arise

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3"] },
    { "id": 3, "tasks": ["3.4"] },
    { "id": 4, "tasks": ["3.5", "3.6"] },
    { "id": 5, "tasks": ["4"] }
  ]
}
```

## Notes

- Tests use Vitest + fast-check for property-based testing (project standard)
- Test files go in `__tests__/unified-in-app-reader/` directory
- The `DocumentReader` component interface (`{ url: string, title: string }`) must not change
- EPUB reader (`components/library/epub-reader.tsx`) must remain completely untouched
- The fix is architectural (replacing iframe with react-pdf canvas rendering), not a code logic bug
