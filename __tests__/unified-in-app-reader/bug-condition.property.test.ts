// Feature: unified-in-app-reader
// Property 1: Bug Condition - PDF Book Reader Uses Iframe Instead of React-PDF
//
// The book reader route (/reader/[id]) uses an iframe-based PdfReader component
// to display PDF books. On mobile browsers, this <iframe src={url}> approach causes
// the OS to intercept the PDF and hand it off to a native viewer. The fix should
// replace PdfReader with the react-pdf-based DocumentReader component that renders
// PDFs inline with page navigation controls.
//
// This test encodes the EXPECTED behavior:
//   - PDF books should render using DocumentReader (react-pdf canvas-based)
//   - No <iframe> element should be present for PDF books
//   - DocumentReader receives both url (string) and title (string) props
//   - Page navigation controls (prev/next buttons, page number display) are present
//
// On UNFIXED code, this test FAILS — confirming the bug exists because:
//   - PdfReader renders an <iframe> instead of react-pdf Document component
//   - PdfReader does not accept a title prop
//   - No page navigation controls are provided
//
// After the fix, this test PASSES — confirming the bug is resolved.
//
// **Validates: Requirements 1.1, 1.2, 1.3**

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import * as fs from "fs";
import * as path from "path";

// We analyze the source code of the reader page component to determine:
// 1. Whether it imports DocumentReader from @/components/shared/document-reader (expected)
//    OR PdfReader from @/components/library/pdf-reader (bug)
// 2. Whether it passes title prop to the PDF reader component
// 3. Whether it uses iframe-based rendering
//
// Additionally, we analyze the PdfReader component to confirm iframe usage.

const READER_PAGE_PATH = path.resolve(
  __dirname,
  "../../app/(app)/reader/[id]/page.tsx"
);

const SHARED_DOCUMENT_READER_PATH = path.resolve(
  __dirname,
  "../../components/shared/document-reader.tsx"
);

const PDF_READER_PATH = path.resolve(
  __dirname,
  "../../components/library/pdf-reader.tsx"
);

// Arbitrary for generating PDF book configurations
const pdfBookArb = fc.record({
  id: fc.uuid(),
  title: fc
    .string({ minLength: 1, maxLength: 100 })
    .filter((s) => s.trim().length > 0),
  url: fc.webUrl(),
  fileType: fc.constant("pdf"),
});

describe("Feature: unified-in-app-reader, Property 1: Bug Condition - PDF Book Reader Uses Iframe Instead of React-PDF", () => {
  let readerPageSource: string;
  let pdfReaderExists: boolean;
  let sharedDocumentReaderExists: boolean;
  let pdfReaderSource: string | null;

  beforeEach(() => {
    // Read the reader page source
    readerPageSource = fs.readFileSync(READER_PAGE_PATH, "utf-8");

    // Check if PdfReader component still exists (it should on unfixed code)
    pdfReaderExists = fs.existsSync(PDF_READER_PATH);
    pdfReaderSource = pdfReaderExists
      ? fs.readFileSync(PDF_READER_PATH, "utf-8")
      : null;

    // Check if shared DocumentReader exists (it should after the fix)
    sharedDocumentReaderExists = fs.existsSync(SHARED_DOCUMENT_READER_PATH);
  });

  it("reader page should import DocumentReader from shared location (not PdfReader) for PDF books", async () => {
    await fc.assert(
      fc.asyncProperty(pdfBookArb, async (book) => {
        // Property: The reader page must import DocumentReader from
        // @/components/shared/document-reader for rendering PDF books.
        // On unfixed code, it imports PdfReader from @/components/library/pdf-reader.

        const importsDocumentReader =
          readerPageSource.includes("@/components/shared/document-reader") ||
          readerPageSource.includes("components/shared/document-reader");

        const importsPdfReader =
          readerPageSource.includes("@/components/library/pdf-reader") ||
          readerPageSource.includes("components/library/pdf-reader");

        // EXPECTED: imports DocumentReader, does NOT import PdfReader
        // On unfixed code: imports PdfReader, does NOT import DocumentReader
        expect(importsDocumentReader).toBe(true);
        expect(importsPdfReader).toBe(false);
      }),
      { numRuns: 20 }
    );
  });

  it("PDF books should NOT be rendered with an iframe element", async () => {
    await fc.assert(
      fc.asyncProperty(pdfBookArb, async (book) => {
        // Property: For any PDF book, the rendering path must NOT use an iframe.
        // On unfixed code, PdfReader renders <iframe> which causes mobile browsers
        // to hand off the PDF to native viewers.

        if (pdfReaderExists && pdfReaderSource) {
          // If PdfReader still exists, verify the reader page does NOT use it for PDFs
          const usesIframeComponent =
            readerPageSource.includes("PdfReader") &&
            readerPageSource.includes("isPdf");

          // The PdfReader component itself uses iframe
          const pdfReaderUsesIframe = pdfReaderSource.includes("<iframe");

          // EXPECTED: Reader page does NOT use PdfReader (which has iframe)
          // On unfixed code: Reader page uses PdfReader which contains <iframe>
          if (usesIframeComponent && pdfReaderUsesIframe) {
            // Bug is present: PdfReader with iframe is used for PDF books
            expect(usesIframeComponent && pdfReaderUsesIframe).toBe(false);
          }
        }

        // Additionally verify: the reader page should use DocumentReader for PDFs
        // which uses react-pdf Document component (canvas-based, no iframe)
        const usesDocumentReaderForPdf =
          readerPageSource.includes("DocumentReader") &&
          readerPageSource.includes("isPdf");

        expect(usesDocumentReaderForPdf).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  it("DocumentReader should receive both url and title props for PDF books", async () => {
    await fc.assert(
      fc.asyncProperty(pdfBookArb, async (book) => {
        // Property: For any PDF book with a title and URL, the reader page must
        // pass BOTH url and title props to DocumentReader.
        // On unfixed code: PdfReader only accepts url prop (no title).

        // Check that the JSX for the PDF rendering path passes title prop
        const passesTitle =
          readerPageSource.includes("title={") ||
          readerPageSource.includes("title=");

        // Check the rendering of DocumentReader with both props
        const rendersDocumentReaderWithProps =
          readerPageSource.includes("DocumentReader") &&
          readerPageSource.includes("url=") &&
          passesTitle;

        // EXPECTED: DocumentReader receives both url and title
        // On unfixed code: PdfReader only gets url, no title prop
        expect(rendersDocumentReaderWithProps).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  it("page navigation controls (prev/next, page number) should be present for PDF books", async () => {
    await fc.assert(
      fc.asyncProperty(pdfBookArb, async (book) => {
        // Property: For any PDF book, the reader must provide page navigation
        // controls: previous/next buttons and page number display.
        // On unfixed code: PdfReader (iframe-based) has NO page navigation.

        // The DocumentReader component (which should be used) has page controls.
        // Check if DocumentReader exists at the shared location
        // (it should be at components/shared/document-reader.tsx after fix)
        if (sharedDocumentReaderExists) {
          const sharedReaderSource = fs.readFileSync(
            SHARED_DOCUMENT_READER_PATH,
            "utf-8"
          );

          // Verify DocumentReader has page navigation
          const hasPrevButton =
            sharedReaderSource.includes("Previous page") ||
            sharedReaderSource.includes("previous page") ||
            sharedReaderSource.includes("aria-label=\"Previous page\"");
          const hasNextButton =
            sharedReaderSource.includes("Next page") ||
            sharedReaderSource.includes("next page") ||
            sharedReaderSource.includes("aria-label=\"Next page\"");
          const hasPageNumber =
            sharedReaderSource.includes("currentPage") ||
            sharedReaderSource.includes("pageNumber") ||
            sharedReaderSource.includes("numPages");

          expect(hasPrevButton).toBe(true);
          expect(hasNextButton).toBe(true);
          expect(hasPageNumber).toBe(true);
        } else {
          // If shared DocumentReader doesn't exist yet, the fix hasn't been applied.
          // The PdfReader (if it exists) should NOT have page navigation.
          // This confirms the bug: no page navigation for PDF books.
          expect(sharedDocumentReaderExists).toBe(true);
        }
      }),
      { numRuns: 20 }
    );
  });
});
