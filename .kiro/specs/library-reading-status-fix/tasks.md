# Implementation Plan

## Overview

Fix the "Currently Reading" section in `LibraryView` to use the same `BookCard` component and grid layout as the "To Read" and "Finished" sections, restoring the progress slider, "Read Preview" link, and "Open Reader" link for books with status "reading".

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Reading Books Missing Interactive Controls
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to books with `status === "reading"` — generate books with varying `preview_url` and `file_path` values to confirm all interactive controls are missing
  - Create test file `__tests__/library-reading-status-fix/bug-condition.property.test.tsx`
  - Render `LibraryView` with a book where `status: "reading"` and assert:
    - An `<input type="range">` (progress slider) exists for that book
    - When `preview_url` is non-empty, a "Read Preview" link is rendered
    - When `file_path` is non-empty, an "Open Reader" link is rendered
  - Use `fast-check` to generate arbitrary book data with `status: "reading"` and varying optional fields (`preview_url`, `file_path`, `cover_url`, `progress`)
  - Mock Supabase client and Next.js Image/Link components as needed
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists because the "Currently Reading" section uses a simplified inline layout without these controls)
  - Document counterexamples found: the DOM for "Currently Reading" section contains no `<input type="range">`, no "Read Preview" link, and no "Open Reader" link
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Reading Book Rendering Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Create test file `__tests__/library-reading-status-fix/preservation.property.test.tsx`
  - Observe behavior on UNFIXED code for non-buggy inputs (books with `status: "to_read"` or `status: "finished"`):
    - Observe: books with `status: "to_read"` render with `BookCard` component including progress slider, preview link (when `preview_url` set), and reader link (when `file_path` set)
    - Observe: books with `status: "finished"` render with `BookCard` component including progress slider, preview link (when `preview_url` set), and reader link (when `file_path` set)
  - Write property-based tests using `fast-check`:
    - For all books with `status: "to_read"`: assert `<input type="range">` exists, "Read Preview" link exists when `preview_url` is non-empty, "Open Reader" link exists when `file_path` is non-empty
    - For all books with `status: "finished"`: assert same controls are present
    - For all books with `status !== "reading"`: assert the grid layout (`grid gap-6 sm:grid-cols-2 lg:grid-cols-3`) is used for the section container
  - Mock Supabase client and Next.js Image/Link components as needed
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve — "To Read" and "Finished" sections already use `BookCard` with full controls)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix for reading books missing interactive controls

  - [x] 3.1 Implement the fix
    - In `components/library/library-view.tsx`, locate the "Currently Reading" section (~lines 220–260)
    - Replace the container `<div className="space-y-2">` with `<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">` to match "To Read" and "Finished" sections
    - Replace the inline item markup (`<div className="item-app flex items-center gap-4">` with cover, title, author, ProgressBar, percentage) with the `<BookCard>` component
    - Pass the same props to `BookCard` as the other sections: `book`, `onUpdate={updateBook}`, `onDelete={deleteBook}`, `onAutofill={autofillBook}`, `onUpload={uploadBookFile}`
    - Keep the section heading ("Currently Reading"), the "Show all / Show less" toggle, and the conditional rendering (`readingBooks.length > 0`) unchanged
    - No changes to the `BookCard` component itself — it already handles all statuses correctly
    - _Bug_Condition: isBugCondition(input) where input.book.status === "reading" AND renderedWithSimplifiedLayout_
    - _Expected_Behavior: Books with status "reading" render with full BookCard providing progress slider, preview link, and reader link_
    - _Preservation: Books with status "to_read" or "finished" continue to render with BookCard in grid layout with all controls_
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Reading Books Have Full Interactive Controls
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (progress slider, preview link, reader link present for reading books)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1: `npm run test -- __tests__/library-reading-status-fix/bug-condition.property.test.tsx`
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed — reading books now render with BookCard and all interactive controls)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Reading Book Rendering Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2: `npm run test -- __tests__/library-reading-status-fix/preservation.property.test.tsx`
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions — "To Read" and "Finished" sections still render with BookCard and all controls)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite: `npm run test`
  - Ensure all tests pass, ask the user if questions arise.
  - Verify no TypeScript errors: `npx tsc --noEmit`
  - Verify no lint errors: `npm run lint`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3"] },
    { "id": 3, "tasks": ["4"] }
  ]
}
```

## Notes

- Tests use `fast-check` for property-based testing and `@testing-library/react` for component rendering
- The fix is purely a rendering change in `library-view.tsx` — no logic changes to `BookCard` are needed
- Exploration test (task 1) is expected to FAIL on unfixed code — this confirms the bug exists
- Preservation test (task 2) is expected to PASS on unfixed code — this captures baseline behavior
