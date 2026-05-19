# Library Reading Status Fix — Bugfix Design

## Overview

When a book's status changes to "reading", it moves into the "Currently Reading" section which uses a simplified inline list layout instead of the full `BookCard` component. This causes the loss of three interactive controls: the progress slider, the "Read Preview" link, and the "Open Reader" link. The fix replaces the simplified inline rendering with the same `BookCard` component used by the "To Read" and "Finished" sections, ensuring consistent interactivity across all statuses.

## Glossary

- **Bug_Condition (C)**: A book has `status === "reading"` — it is rendered in the "Currently Reading" section using a simplified inline layout that lacks interactive controls
- **Property (P)**: Books with status "reading" should render with the full `BookCard` component, providing progress slider, "Read Preview" link, and "Open Reader" link
- **Preservation**: Books with status "to_read" or "finished" must continue to render using the full `BookCard` component with all interactive controls intact
- **LibraryView**: The main component in `components/library/library-view.tsx` that renders the library page with sections grouped by book status
- **BookCard**: The full-featured card component that renders cover, title, author, status selector, rating, progress slider, notes, preview link, reader link, file upload, and delete button

## Bug Details

### Bug Condition

The bug manifests when a book's status is set to "reading". The `LibraryView` component renders the "Currently Reading" section using a custom inline layout (`<div className="item-app ...">`) instead of the `BookCard` component. This inline layout only shows cover image, title, author, and a read-only `ProgressBar` — it omits the interactive progress `<input type="range">`, the "Read Preview" link, and the "Open Reader" link.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { book: Book, renderedSection: string }
  OUTPUT: boolean
  
  RETURN input.book.status === "reading"
         AND input.renderedSection === "Currently Reading"
         AND renderedWithSimplifiedLayout(input.book)
         AND NOT hasProgressSlider(input.book)
         AND NOT hasPreviewLink(input.book)
         AND NOT hasReaderLink(input.book)
END FUNCTION
```

### Examples

- **Progress slider missing**: User sets a book to "reading" → book moves to "Currently Reading" section → only a read-only progress bar is shown, no range slider to change progress
- **Preview link missing**: User has a book with `preview_url = "https://books.google.com/..."` and status "reading" → no "Read Preview" link is rendered
- **Reader link missing**: User has a book with `file_path = "user123/book456.epub"` and status "reading" → no "Open Reader" link is rendered
- **Controls restored on status change**: User changes book from "reading" to "to_read" → book moves to "To Read" section → all controls reappear (because that section uses `BookCard`)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Books with status "to_read" must continue to render in the "To Read" section using the full `BookCard` component with all interactive controls
- Books with status "finished" must continue to render in the "Finished" section using the full `BookCard` component with all interactive controls
- The `BookCard` component's internal behavior (title editing, autofill, status change, rating, notes, file upload, delete) must remain unchanged
- Search filtering across all sections must continue to work
- "Show all / Show less" pagination within each section must continue to work
- The section heading "Currently Reading" must still appear when reading books exist

**Scope:**
All inputs that do NOT involve rendering books with status "reading" should be completely unaffected by this fix. This includes:
- Rendering of "To Read" books
- Rendering of "Finished" books
- The empty state when no books exist
- The search input and "Add Book" button
- All `BookCard` props and callbacks (onUpdate, onDelete, onAutofill, onUpload)

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is clear:

1. **Intentional but incorrect design choice**: The "Currently Reading" section (lines ~220–260 of `library-view.tsx`) uses a custom inline layout with `<div className="item-app flex items-center gap-4">` instead of the `BookCard` component. This was likely a deliberate UI decision to show a compact "currently reading" view, but it inadvertently removed critical interactive controls.

2. **Layout mismatch**: The "To Read" and "Finished" sections use a grid layout (`grid gap-6 sm:grid-cols-2 lg:grid-cols-3`) with `BookCard` components, while "Currently Reading" uses a vertical stack (`space-y-2`) with inline items. The fix needs to align the "Currently Reading" section with the same grid + `BookCard` pattern.

3. **No shared abstraction**: There is no shared "section renderer" — each section has its own JSX block. This made it easy for the "Currently Reading" section to diverge from the others.

## Correctness Properties

Property 1: Bug Condition - Reading Books Have Full Interactive Controls

_For any_ book where `status === "reading"` and the book is rendered in the "Currently Reading" section, the fixed `LibraryView` component SHALL render that book using the `BookCard` component, providing a progress range slider, a "Read Preview" link (when `preview_url` is non-empty), and an "Open Reader" link (when `file_path` is non-empty).

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-Reading Book Rendering Unchanged

_For any_ book where `status !== "reading"` (i.e., "to_read" or "finished"), the fixed `LibraryView` component SHALL produce the same rendered output as the original component, preserving all interactive controls, layout, and behavior for those sections.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `components/library/library-view.tsx`

**Section**: "Currently Reading" rendering block (~lines 220–260)

**Specific Changes**:
1. **Replace inline layout with grid**: Change the container from `<div className="space-y-2">` to `<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">` to match the "To Read" and "Finished" sections.

2. **Replace inline item markup with BookCard**: Remove the custom `<div className="item-app ...">` markup that renders cover, title, author, and read-only ProgressBar. Replace it with the `<BookCard>` component, passing the same props as the other sections (`book`, `onUpdate`, `onDelete`, `onAutofill`, `onUpload`).

3. **Remove redundant inline elements**: The inline layout's cover image, title text, author text, read-only ProgressBar, and percentage display are all redundant once `BookCard` is used — remove them entirely.

4. **Preserve section structure**: Keep the section heading ("Currently Reading"), the "Show all / Show less" toggle, and the conditional rendering (`readingBooks.length > 0`) unchanged.

5. **No changes to BookCard**: The `BookCard` component already handles all statuses correctly (it renders the status dropdown with "reading" as an option, shows progress slider, preview link, and reader link). No modifications to `BookCard` are needed.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write component tests that render `LibraryView` with books in "reading" status and assert that interactive controls (progress slider, preview link, reader link) are present in the DOM. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **Progress Slider Test**: Render a book with `status: "reading"` → assert an `<input type="range">` exists for that book (will fail on unfixed code)
2. **Preview Link Test**: Render a book with `status: "reading"` and `preview_url: "https://example.com"` → assert a link with text "Read Preview" exists (will fail on unfixed code)
3. **Reader Link Test**: Render a book with `status: "reading"` and `file_path: "user/book.epub"` → assert a link with text "Open Reader" exists (will fail on unfixed code)
4. **All Controls Present Test**: Render a book with `status: "reading"`, `preview_url`, and `file_path` all set → assert all three controls exist simultaneously (will fail on unfixed code)

**Expected Counterexamples**:
- The DOM for "Currently Reading" section contains no `<input type="range">` element
- No `<a>` element with text "Read Preview" exists in the "Currently Reading" section
- No `<a>` element with href `/reader/{id}` exists in the "Currently Reading" section
- Root cause confirmed: the inline layout simply does not include these elements

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL book WHERE book.status === "reading" DO
  rendered := renderLibraryView([book])
  ASSERT rendered CONTAINS <input type="range"> for book.id
  IF book.preview_url IS NOT EMPTY THEN
    ASSERT rendered CONTAINS <a href={book.preview_url}>"Read Preview"</a>
  END IF
  IF book.file_path IS NOT EMPTY THEN
    ASSERT rendered CONTAINS <Link href="/reader/{book.id}">"Open Reader"</Link>
  END IF
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL book WHERE book.status !== "reading" DO
  ASSERT renderLibraryView_original([book]) = renderLibraryView_fixed([book])
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many book configurations automatically (varying title, author, cover_url, preview_url, file_path, progress, rating)
- It catches edge cases that manual unit tests might miss (e.g., empty strings vs null for optional fields)
- It provides strong guarantees that behavior is unchanged for all non-reading books

**Test Plan**: Observe behavior on UNFIXED code first for "to_read" and "finished" books, then write property-based tests capturing that behavior.

**Test Cases**:
1. **To-Read BookCard Preservation**: Verify books with `status: "to_read"` continue to render with BookCard including all controls
2. **Finished BookCard Preservation**: Verify books with `status: "finished"` continue to render with BookCard including all controls
3. **Search Filtering Preservation**: Verify search still filters across all three sections correctly
4. **Section Pagination Preservation**: Verify "Show all / Show less" continues to work for all sections

### Unit Tests

- Test that a book with `status: "reading"` renders a progress range slider
- Test that a book with `status: "reading"` and `preview_url` renders a "Read Preview" link
- Test that a book with `status: "reading"` and `file_path` renders an "Open Reader" link
- Test that a book with `status: "reading"` without `preview_url` does NOT render "Read Preview"
- Test that a book with `status: "reading"` without `file_path` does NOT render "Open Reader"
- Test that changing status from "reading" to "to_read" moves the book to the correct section

### Property-Based Tests

- Generate random books with `status: "reading"` and varying `preview_url`/`file_path` values → verify correct controls are present based on field values
- Generate random books with `status: "to_read"` or `status: "finished"` → verify rendering is identical to the original (unfixed) component
- Generate random book lists with mixed statuses → verify section grouping and control presence is correct for each status

### Integration Tests

- Test full flow: add a book → set status to "reading" → verify all controls are accessible
- Test status transition: book in "reading" → change to "finished" → verify it moves to "Finished" section with controls intact
- Test that the "Currently Reading" section uses the same grid layout as other sections
