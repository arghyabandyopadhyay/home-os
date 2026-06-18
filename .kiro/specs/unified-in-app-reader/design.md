# Unified In-App Reader Bugfix Design

## Overview

The book reader route (`/reader/[id]`) uses an iframe-based `PdfReader` component that causes mobile browsers to redirect PDFs to the OS native viewer instead of rendering inline. The fix replaces the iframe approach with the same `react-pdf`-based `DocumentReader` component already used by the document reader route (`/documents/[id]`). The `DocumentReader` component will be relocated to a shared directory since it will serve both routes.

## Glossary

- **Bug_Condition (C)**: A PDF book is opened via `/reader/[id]` on a mobile browser, causing the OS to intercept the iframe-loaded PDF and hand it off to a native viewer
- **Property (P)**: PDF books render inline using canvas-based `react-pdf` rendering with page navigation controls, identical to the document reader experience
- **Preservation**: EPUB reader behavior, document reader behavior, desktop inline rendering, and signed URL generation must remain unchanged
- **PdfReader**: The broken iframe-based component in `components/library/pdf-reader.tsx` that sets `iframe.src = url`
- **DocumentReader**: The working `react-pdf`-based component in `components/documents/document-reader.tsx` that renders PDFs via canvas with page navigation

## Bug Details

### Bug Condition

The bug manifests when a user opens a PDF book via the `/reader/[id]` route on a mobile browser. The `PdfReader` component renders an `<iframe src={url}>` which mobile browsers (Safari, Chrome) intercept — handing the PDF off to the OS native viewer (Google Drive, Files app) or triggering a download instead of displaying it inline.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { route: string, fileType: string, platform: string }
  OUTPUT: boolean
  
  RETURN input.route MATCHES "/reader/[id]"
         AND input.fileType == "pdf"
         AND input.platform == "mobile"
         AND rendererUsed(input) == "iframe"
END FUNCTION
```

### Examples

- User opens a PDF book on mobile Safari → OS redirects to Files app or shows download prompt instead of inline rendering
- User opens a PDF book on mobile Chrome → OS redirects to Google Drive viewer or triggers download
- User opens a PDF book on desktop Chrome → iframe renders inline (works, but lacks page navigation controls)
- User opens an EPUB book on mobile → EpubReader renders correctly (not affected)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- EPUB books opened via `/reader/[id]` must continue to use the `EpubReader` component with epubjs
- Documents opened via `/documents/[id]` must continue to render PDFs correctly with page navigation using `react-pdf`
- Signed URL generation from the `books` storage bucket must remain unchanged
- The library view's "Open Reader" link (`/reader/${book.id}`) must continue to work
- The `h-screen bg-app text-app` wrapper styling on the reader page must remain

**Scope:**
All inputs that do NOT involve opening a PDF book via `/reader/[id]` should be completely unaffected by this fix. This includes:
- EPUB book rendering
- Document PDF rendering via `/documents/[id]`
- Library view interactions (book CRUD, file upload, search)
- Signed URL generation logic

## Hypothesized Root Cause

Based on the bug description, the root cause is clear and singular:

1. **Iframe-based PDF rendering**: The `PdfReader` component uses `<iframe src={url}>` to display PDFs. Mobile browsers do not support inline iframe PDF rendering — they intercept the PDF MIME type and delegate to the OS native handler. This is a fundamental platform limitation of iframes on mobile, not a code bug per se, but an architectural choice that doesn't work cross-platform.

2. **Missing react-pdf integration**: A working `react-pdf`-based reader (`DocumentReader`) already exists in the codebase but was never connected to the book reader route. The book reader was built with a simpler iframe approach that only works on desktop.

3. **Missing `title` prop**: The current `PdfReader` only accepts a `url` prop, while `DocumentReader` requires both `url` and `title`. The book reader route has access to the book title from the database query but doesn't pass it to the reader component.

## Correctness Properties

Property 1: Bug Condition - PDF Books Render Inline on Mobile

_For any_ PDF book opened via `/reader/[id]` on any platform (including mobile), the fixed reader route SHALL render the PDF inline using canvas-based `react-pdf` rendering with page navigation controls (previous/next buttons, page number display, download button), without triggering the OS native PDF handler.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-PDF-Book Reading Behavior

_For any_ input that is NOT a PDF book opened via `/reader/[id]` (EPUB books, documents via `/documents/[id]`, library interactions), the fixed code SHALL produce exactly the same behavior as the original code, preserving EPUB rendering, document reading, and all library functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `components/documents/document-reader.tsx`

**Change**: Move to `components/shared/document-reader.tsx`

**Specific Changes**:
1. **Relocate DocumentReader**: Move `components/documents/document-reader.tsx` to `components/shared/document-reader.tsx` so it can be shared between the book reader and document reader routes.

2. **Update document route import**: Update `app/(app)/documents/[id]/page.tsx` to import `DocumentReader` from `@/components/shared/document-reader` instead of `@/components/documents/document-reader`.

3. **Update book reader route**: Modify `app/(app)/reader/[id]/page.tsx` to:
   - Import `DocumentReader` from `@/components/shared/document-reader` instead of `PdfReader`
   - Pass both `url` and `title` (from `book.title`) to `DocumentReader` when the file is a PDF
   - Keep the existing `EpubReader` usage for EPUB files unchanged

4. **Delete PdfReader**: Remove `components/library/pdf-reader.tsx` since it is no longer needed.

5. **No changes to EpubReader**: The `components/library/epub-reader.tsx` component remains untouched.

### Updated Book Reader Route (Target State)

```tsx
import { createClient } from "@/lib/supabase/server";
import { EpubReader } from "@/components/library/epub-reader";
import { DocumentReader } from "@/components/shared/document-reader";

export default async function ReaderPage({ params }) {
  // ... existing data fetching logic unchanged ...
  
  const isPdf = book.file_type?.toLowerCase().includes("pdf");

  return (
    <div className="h-screen bg-app text-app">
      {isPdf ? (
        <DocumentReader url={signedUrlData?.signedUrl || ""} title={book.title} />
      ) : (
        <EpubReader url={signedUrlData?.signedUrl || ""} />
      )}
    </div>
  );
}
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that verify the book reader route renders a `react-pdf`-based reader (not an iframe) when a PDF book is opened. Run these tests on the UNFIXED code to observe failures and confirm the iframe is the problem.

**Test Cases**:
1. **Iframe Detection Test**: Verify that the reader page for a PDF book does NOT render an `<iframe>` element (will fail on unfixed code because `PdfReader` uses iframe)
2. **DocumentReader Rendering Test**: Verify that the reader page for a PDF book renders a `Document` component from `react-pdf` (will fail on unfixed code)
3. **Page Navigation Test**: Verify that page navigation controls (prev/next buttons, page number) are present for PDF books (will fail on unfixed code)
4. **Title Prop Test**: Verify that the book title is passed to the reader component (will fail on unfixed code since `PdfReader` doesn't accept title)

**Expected Counterexamples**:
- The book reader route renders an `<iframe>` instead of a `react-pdf` `Document` component
- No page navigation controls are present in the PDF book reader
- Possible causes: `PdfReader` component uses iframe architecture, no `react-pdf` integration in book reader

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := renderReaderPage_fixed(input)
  ASSERT result.rendersReactPdfDocument == true
  ASSERT result.hasPageNavigation == true
  ASSERT result.hasNoIframe == true
  ASSERT result.titleDisplayed == input.bookTitle
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT renderReaderPage_original(input) = renderReaderPage_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (various file types, book states)
- It catches edge cases that manual unit tests might miss (empty titles, missing URLs)
- It provides strong guarantees that behavior is unchanged for all non-PDF-book inputs

**Test Plan**: Observe behavior on UNFIXED code first for EPUB rendering and document reading, then write property-based tests capturing that behavior.

**Test Cases**:
1. **EPUB Preservation**: Verify that EPUB books continue to render with `EpubReader` after the fix
2. **Document Reader Preservation**: Verify that `/documents/[id]` continues to render PDFs correctly with `DocumentReader`
3. **Signed URL Preservation**: Verify that signed URL generation from the `books` bucket remains unchanged
4. **Library View Preservation**: Verify that the "Open Reader" link continues to navigate to `/reader/${book.id}`

### Unit Tests

- Test that the reader page renders `DocumentReader` for PDF file types
- Test that the reader page renders `EpubReader` for EPUB file types
- Test that `DocumentReader` receives both `url` and `title` props from the book data
- Test that the shared `DocumentReader` component works identically when imported from its new location
- Test edge cases: missing URL, empty title, null file_type

### Property-Based Tests

- Generate random book configurations (varying file types, titles, URLs) and verify the correct reader component is selected
- Generate random non-PDF file types and verify `EpubReader` is always used for non-PDF books
- Test that `DocumentReader` prop contract is satisfied for all valid book states (url is string, title is string)

### Integration Tests

- Test full flow: library view → click "Open Reader" → PDF renders inline with page navigation
- Test that switching between PDF and EPUB books renders the correct reader
- Test that the document reader route still works after `DocumentReader` is moved to shared location
