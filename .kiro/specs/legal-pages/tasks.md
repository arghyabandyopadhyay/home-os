# Implementation Plan: Legal Pages

## Overview

Add Privacy Policy, Terms of Service, and Contact Us pages to Home OS as static Server Components. Implementation involves creating two shared components (`LegalPageShell` and `FooterNav`), three page routes, and integrating the footer navigation into the existing login page. All pages are publicly accessible with no middleware changes needed.

## Tasks

- [x] 1. Create shared legal page components
  - [x] 1.1 Create the LegalPageShell component
    - Create `components/legal/legal-page-shell.tsx` as a Server Component
    - Render a full-height wrapper with `bg-app` background
    - Add a `<header>` with "Home OS" brand link (`<a>` to `/`) with `aria-label="Navigate to Home OS home page"` and visible focus ring
    - Render `<main>` with `max-w-3xl mx-auto px-6 py-10` (responsive: `px-4` below 768px)
    - Wrap children in `<article>` with `space-y-8` section spacing
    - Import and render `FooterNav` below the main content
    - Use semantic HTML elements: `main`, `article`
    - Apply `font-semibold tracking-tight` to heading styles and `leading-relaxed` to body text
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4_

  - [x] 1.2 Create the FooterNav component
    - Create `components/legal/footer-nav.tsx` as a Server Component
    - Render a `<nav>` element with `aria-label="Footer"`
    - Add a flex container with centered links and gap spacing
    - Include three Next.js `<Link>` elements: "Privacy Policy" → `/privacy`, "Terms of Service" → `/terms`, "Contact" → `/contact`
    - Apply `link-muted` class to each link
    - Ensure touch targets of at least 44×44px using `min-h-[44px] min-w-[44px]` with `flex items-center`
    - _Requirements: 6.1, 6.3, 6.5, 8.3_

- [x] 2. Create legal page routes
  - [x] 2.1 Create the Privacy Policy page
    - Create `app/privacy/page.tsx` as a Server Component
    - Import and wrap content with `LegalPageShell`
    - Render `<h1>` with "Privacy Policy" title using `font-semibold tracking-tight`
    - Display last updated date with `text-app-muted` class
    - Add sections with `<section>` elements and `<h2>` headings: "Data We Collect", "How We Use Your Data", "Data Storage & Security", "Third-Party Services", "Your Rights"
    - "Data We Collect" section must mention user profiles, notes, tasks, books, contacts, and calendar events
    - "Third-Party Services" section must list authentication provider, calendar/contacts integrations, database provider, and hosting provider
    - "Your Rights" section must describe right to access, export, and delete data
    - Body text uses regular weight with `leading-relaxed`
    - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x] 2.2 Create the Terms of Service page
    - Create `app/terms/page.tsx` as a Server Component
    - Import and wrap content with `LegalPageShell`
    - Render `<h1>` with "Terms of Service" title using `font-semibold tracking-tight`
    - Display last updated date with `text-app-muted` class
    - Add sections with `<section>` elements and `<h2>` headings covering: acceptable use, account responsibilities, intellectual property, limitation of liability, termination conditions
    - Each section must contain at least a heading and one paragraph of body text
    - Present all sections in a vertically scrollable single-page layout
    - _Requirements: 1.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 2.3 Create the Contact Us page
    - Create `app/contact/page.tsx` as a Server Component
    - Import and wrap content with `LegalPageShell`
    - Render `<h1>` with "Contact Us" title using `font-semibold tracking-tight`
    - Display a clickable `mailto:` email link for reaching the team
    - Include a response time description (no more than 2 sentences with a specific timeframe)
    - Include a list of at least 3 inquiry type categories appropriate for email
    - _Requirements: 1.4, 4.1, 4.2, 4.3, 4.4_

- [x] 3. Integrate FooterNav into the login page
  - [x] 3.1 Add FooterNav to the login page
    - Import `FooterNav` from `@/components/legal/footer-nav`
    - Render `FooterNav` below the login form panel in `app/login/page.tsx`
    - Ensure it is positioned below the existing card within the centered layout
    - _Requirements: 6.2_

- [x] 4. Checkpoint - Verify all pages render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Write tests for legal pages
  - [x]* 5.1 Write unit tests for LegalPageShell component
    - Verify brand link renders with correct href (`/`) and `aria-label`
    - Verify `<main>` element renders with correct classes
    - Verify `<article>` wrapper is present for content
    - Verify FooterNav is rendered within the shell
    - _Requirements: 5.6, 7.1, 7.2_

  - [x]* 5.2 Write unit tests for FooterNav component
    - Verify `<nav>` renders with `aria-label="Footer"`
    - Verify three links render with correct labels and hrefs
    - Verify links use `link-muted` class
    - _Requirements: 6.1, 6.3, 6.5_

  - [x]* 5.3 Write unit tests for Privacy Policy page
    - Verify page renders "Privacy Policy" heading
    - Verify all required section headings are present
    - Verify last updated date is displayed
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x]* 5.4 Write unit tests for Terms of Service page
    - Verify page renders "Terms of Service" heading
    - Verify all required section headings are present
    - Verify last updated date is displayed
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x]* 5.5 Write unit tests for Contact Us page
    - Verify page renders "Contact Us" heading
    - Verify email mailto link is present
    - Verify response time description is rendered
    - Verify inquiry types list has at least 3 items
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x]* 5.6 Write test verifying middleware does not protect legal routes
    - Verify `/privacy`, `/terms`, `/contact` are NOT in the middleware matcher config
    - _Requirements: 1.1, 1.6_

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- No property-based tests are included because the design has no Correctness Properties section — all content is static UI rendering
- The design explicitly states no middleware changes are needed since `/privacy`, `/terms`, `/contact` are not in the matcher config
- All components are Server Components (no `"use client"` directive needed)
- Use `@/` path aliases for all imports per project conventions

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "3.1"] },
    { "id": 2, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6"] }
  ]
}
```
