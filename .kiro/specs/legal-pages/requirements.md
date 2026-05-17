# Requirements Document

## Introduction

Home OS needs publicly accessible legal and informational pages — a Privacy Policy, Terms of Service, and Contact Us page. These pages provide transparency about data handling, usage terms, and a way for users to reach the team. They are static, informational, and do not require authentication. They follow the app's calm, minimal design philosophy and are accessible from the app footer and login page.

## Glossary

- **Legal_Pages**: The set of static informational pages comprising the Privacy Policy page, Terms of Service page, and Contact Us page
- **Privacy_Policy_Page**: A page describing how Home OS collects, uses, stores, and protects user data
- **Terms_of_Service_Page**: A page describing the terms and conditions governing use of Home OS
- **Contact_Page**: A page providing contact information and a way for users to reach the Home OS team
- **Page_Shell**: The layout wrapper that renders the page content with consistent header, spacing, and navigation elements
- **Footer_Navigation**: A navigation section at the bottom of pages containing links to legal and informational pages
- **Visitor**: Any person accessing Home OS, whether authenticated or not

## Requirements

### Requirement 1: Public Page Accessibility

**User Story:** As a visitor, I want to access legal and contact pages without logging in, so that I can review policies before creating an account.

#### Acceptance Criteria

1. WHEN an unauthenticated visitor navigates to `/privacy`, `/terms`, or `/contact`, THE Page_Shell SHALL render the requested page without redirecting to `/login`
2. WHEN a visitor navigates to `/privacy`, THE Privacy_Policy_Page SHALL render the privacy policy content including at minimum a page heading and one or more text sections
3. WHEN a visitor navigates to `/terms`, THE Terms_of_Service_Page SHALL render the terms of service content including at minimum a page heading and one or more text sections
4. WHEN a visitor navigates to `/contact`, THE Contact_Page SHALL render the contact information including at minimum a page heading and at least one contact method
5. WHEN an authenticated user navigates to `/privacy`, `/terms`, or `/contact`, THE Page_Shell SHALL render the page without redirecting to the dashboard
6. IF a visitor requests a Legal_Pages route, THEN THE middleware SHALL NOT include `/privacy`, `/terms`, or `/contact` in the protected routes list

### Requirement 2: Privacy Policy Content

**User Story:** As a visitor, I want to read a clear privacy policy, so that I understand how my data is handled.

#### Acceptance Criteria

1. THE Privacy_Policy_Page SHALL be accessible without requiring user authentication
2. THE Privacy_Policy_Page SHALL display a page title of "Privacy Policy"
3. THE Privacy_Policy_Page SHALL include a section with the heading "Data We Collect" describing the categories of data Home OS collects, including user profiles, notes, tasks, books, contacts, and calendar events
4. THE Privacy_Policy_Page SHALL include a section with the heading "How We Use Your Data" describing how collected data is used
5. THE Privacy_Policy_Page SHALL include a section with the heading "Data Storage & Security" describing how data is stored and protected
6. THE Privacy_Policy_Page SHALL include a section with the heading "Third-Party Services" listing the external services used, including the authentication provider, calendar and contacts integrations, database provider, and hosting provider
7. THE Privacy_Policy_Page SHALL include a section with the heading "Your Rights" describing user rights regarding their data, including the right to access, export, and delete their data
8. THE Privacy_Policy_Page SHALL display the date the policy was last updated in a human-readable date format (e.g., "Month Day, Year")

### Requirement 3: Terms of Service Content

**User Story:** As a visitor, I want to read the terms of service, so that I understand the rules governing my use of Home OS.

#### Acceptance Criteria

1. THE Terms_of_Service_Page SHALL be accessible without requiring user authentication
2. THE Terms_of_Service_Page SHALL display a page title of "Terms of Service" as a visible heading at the top of the page
3. THE Terms_of_Service_Page SHALL include a section with a visible heading describing acceptable use of the platform
4. THE Terms_of_Service_Page SHALL include a section with a visible heading describing user account responsibilities
5. THE Terms_of_Service_Page SHALL include a section with a visible heading describing intellectual property rights
6. THE Terms_of_Service_Page SHALL include a section with a visible heading describing limitation of liability
7. THE Terms_of_Service_Page SHALL include a section with a visible heading describing termination conditions
8. THE Terms_of_Service_Page SHALL display the date the terms were last updated in a human-readable format that includes at minimum the month and year
9. THE Terms_of_Service_Page SHALL present all sections in a vertically scrollable single-page layout with each section containing at least a heading and one paragraph of body text

### Requirement 4: Contact Page Content

**User Story:** As a visitor, I want to find contact information, so that I can reach the Home OS team with questions or concerns.

#### Acceptance Criteria

1. THE Contact_Page SHALL display a page title of "Contact Us"
2. THE Contact_Page SHALL display an email address as a clickable mailto link for reaching the Home OS team
3. THE Contact_Page SHALL include a response time description of no more than 2 sentences that states a specific timeframe within which the team aims to reply
4. THE Contact_Page SHALL include a list of inquiry types that are appropriate to send via email, containing at least 3 example categories

### Requirement 5: Page Layout and Design Consistency

**User Story:** As a visitor, I want legal pages to feel consistent with the rest of Home OS, so that the experience feels cohesive and trustworthy.

#### Acceptance Criteria

1. THE Page_Shell SHALL use the app's monospace font and semantic CSS classes (bg-app, text-app, text-app-muted)
2. THE Page_Shell SHALL constrain content width to max-w-3xl with horizontal padding of px-6 and vertical padding of py-10
3. THE Page_Shell SHALL render section headings (h1, h2) with font-semibold styling and tracking-tight
4. THE Page_Shell SHALL render body text in regular weight with leading-relaxed line-height
5. THE Page_Shell SHALL support both light and dark mode via the existing theme system
6. THE Page_Shell SHALL use semantic HTML elements (main, article, section, h1, h2) for accessibility
7. THE Page_Shell SHALL apply space-y-8 vertical spacing between content sections

### Requirement 6: Footer Navigation

**User Story:** As a visitor, I want links to legal pages in a consistent location, so that I can find them from anywhere in the app.

#### Acceptance Criteria

1. THE Footer_Navigation SHALL display links labeled "Privacy Policy", "Terms of Service", and "Contact" corresponding to the /privacy, /terms, and /contact routes respectively
2. THE Footer_Navigation SHALL be visible on the login page and on all Legal_Pages (/privacy, /terms, /contact)
3. THE Footer_Navigation SHALL use the link-muted component class for link styling
4. WHEN a visitor clicks a Footer_Navigation link, THE Page_Shell SHALL navigate to the route matching that link: "Privacy Policy" to /privacy, "Terms of Service" to /terms, "Contact" to /contact
5. THE Footer_Navigation SHALL render as a nav element with aria-label set to "Footer"

### Requirement 7: Navigation Back to App

**User Story:** As a visitor, I want to easily return to the main app from legal pages, so that I do not feel lost.

#### Acceptance Criteria

1. THE Page_Shell SHALL display the "Home OS" brand name as a clickable anchor element in the page header, linking to the root route (/)
2. THE Page_Shell SHALL render the brand link with a visible keyboard focus indicator and an aria-label of "Navigate to Home OS home page"
3. WHEN a visitor clicks the brand link, THE Page_Shell SHALL navigate to the root route (/), allowing the existing routing logic to redirect to the appropriate destination

### Requirement 8: Responsive Layout

**User Story:** As a visitor on a mobile device, I want legal pages to be readable on small screens, so that I can review policies from any device.

#### Acceptance Criteria

1. WHILE the viewport width is below 768px, THE Page_Shell SHALL reduce horizontal padding to 16px and display content in a single-column layout without horizontal scrolling
2. WHILE the viewport width is below 768px, THE Page_Shell SHALL render body text at a minimum font size of 16px with a line-height of at least 1.5 and a maximum line length of 75 characters
3. THE Page_Shell SHALL provide touch targets of at least 44x44px for all interactive elements including navigation links and the brand link
4. WHILE the viewport width is below 768px, THE Page_Shell SHALL ensure no content overflows the viewport horizontally and no text requires zooming to read
