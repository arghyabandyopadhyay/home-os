# Bugfix Requirements Document

## Introduction

The book reader route (`/reader/[id]`) uses an iframe-based `PdfReader` component to display PDF books. On mobile browsers (Safari, Chrome), this `<iframe src={url}>` approach causes the OS to intercept the PDF and hand it off to a native viewer (e.g., Google Drive, Files app) or triggers a download — instead of rendering the PDF inline within the app. Meanwhile, the document reader route (`/documents/[id]`) uses a `react-pdf`-based `DocumentReader` component that renders PDFs correctly on all platforms, including mobile. The two readers should be unified so that PDF books use the same working in-app reader as documents.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user opens a PDF book via `/reader/[id]` on a mobile browser THEN the system renders an `<iframe src={url}>` which causes the mobile OS to hand off the PDF to its native viewer (Drive, Files, or downloads) instead of displaying it inline

1.2 WHEN a user opens a PDF book via `/reader/[id]` on any device THEN the system uses the `PdfReader` component (iframe-based) which is a completely separate implementation from the `DocumentReader` component used for documents

1.3 WHEN a user opens a PDF book via `/reader/[id]` on mobile THEN the system provides no in-app page navigation, no page number display, and no download button because the iframe delegates rendering entirely to the browser/OS

### Expected Behavior (Correct)

2.1 WHEN a user opens a PDF book via `/reader/[id]` on a mobile browser THEN the system SHALL render the PDF inline within the app using `react-pdf` (canvas-based rendering) without triggering the OS native PDF handler

2.2 WHEN a user opens a PDF book via `/reader/[id]` on any device THEN the system SHALL use the same in-app reader component that the document reader uses, providing a consistent reading experience across books and documents

2.3 WHEN a user opens a PDF book via `/reader/[id]` on mobile THEN the system SHALL provide in-app page navigation controls (previous/next), page number display, and a download option — identical to the document reader experience

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user opens an EPUB book via `/reader/[id]` THEN the system SHALL CONTINUE TO use the `EpubReader` component with epubjs for rendering

3.2 WHEN a user opens a document via `/documents/[id]` THEN the system SHALL CONTINUE TO use the `DocumentReader` component with react-pdf and display the PDF correctly with page navigation

3.3 WHEN a user opens a PDF book via `/reader/[id]` on desktop THEN the system SHALL CONTINUE TO render the PDF inline within the app (now using react-pdf instead of iframe, but still inline)

3.4 WHEN a user opens a PDF book via `/reader/[id]` THEN the system SHALL CONTINUE TO generate a signed URL from the `books` storage bucket and pass it to the reader component
