# Requirements Document

## Introduction

Home OS is a calm personal operating system for thinking, organizing, reading, remembering, and living. The current internal application UI does not match the premium, immersive quality of the landing page. This redesign transforms the internal application into a cohesive, emotionally calm digital environment where every module feels like a natural continuation of the landing page experience — not a separate dashboard.

The redesign covers the global visual identity (color, typography, spatial design, motion), the component system (cards, inputs, sidebar, empty states), and all internal modules (Dashboard, Notes, Tasks, Calendar, Library, Documents, Contacts, Settings). The landing page itself remains unchanged.

## Glossary

- **App_Shell**: The shared layout wrapper containing the Sidebar, Header, and main content area used by all internal modules
- **Sidebar**: The persistent vertical navigation panel providing access to all modules
- **Header**: The top bar containing the command menu trigger and user menu
- **Dashboard**: The primary landing view after login, showing a contextual overview of the user's day
- **Module**: A distinct functional area of the application (Notes, Tasks, Calendar, Library, Documents, Contacts, Settings)
- **Card_System**: The set of reusable surface components used to display grouped content
- **Input_System**: The set of form controls (text fields, textareas, selects) used across modules
- **Empty_State**: The UI displayed when a module or section contains no user data
- **Command_Menu**: The keyboard-triggered (⌘K) overlay for quick navigation and actions
- **Design_Token**: A CSS custom property defining a visual attribute (color, spacing, radius) used consistently across the system
- **Spatial_Design**: The use of depth, layering, translucency, blur, and gradients to create visual hierarchy and atmosphere
- **Motion_System**: The set of animation patterns (transitions, hover effects, page changes) used across the application
- **Visual_Continuity**: The principle that internal application screens maintain the same atmosphere, palette, and rhythm as the landing page
- **Glassmorphism**: A design technique using translucent backgrounds with backdrop blur to create depth
- **Quick_Capture**: The dashboard widget allowing rapid creation of notes or tasks without navigating away

## Requirements

### Requirement 1: Visual Continuity Between Landing Page and Internal Application

**User Story:** As a user, I want the internal application to feel like a seamless continuation of the landing page, so that I never experience a jarring transition between marketing and product.

#### Acceptance Criteria

1. THE App_Shell SHALL use the same `--home-*` CSS custom property palette as the landing page, specifically: `--home-bg` for primary background, `--home-surface` for secondary surfaces, `--home-elevated` for elevated surfaces, and `--home-border` for borders, with dark mode values applied via the `.dark` class on the HTML element
2. THE App_Shell SHALL use the same spacing scale as the landing page: `max-w-6xl` for maximum content width, `px-6` for horizontal page padding, `py-10` for vertical page padding, `p-6` for card internal padding, and `space-y-8` between major sections
3. WHEN a user navigates from the landing page to the internal application, THE App_Shell SHALL render using the same `bg-app` background class, `text-app` text color class, and monospace font family (`font-mono`) as the landing page
4. THE App_Shell SHALL display fixed ambient background gradient orbs using `bg-blue-500/10` and `bg-purple-500/10` with `blur-3xl`, positioned at the top-left and bottom-right of the viewport respectively, across all internal views
5. THE App_Shell SHALL apply the `.dark` class to the HTML element, matching the landing page's forced dark mode, so that all `--home-*` token values resolve identically between the two contexts

### Requirement 2: Unified Color System

**User Story:** As a user, I want a consistent, calming color palette throughout the application, so that the interface feels cohesive and visually restful.

#### Acceptance Criteria

1. THE Design_Token system SHALL define a dark-mode palette using zinc, charcoal, and graphite tones with muted whites and soft neutral gradients
2. THE Design_Token system SHALL NOT use pure black (#000000) as a background or surface color, SHALL NOT introduce semantic colors (red, green, blue) for non-status purposes, and SHALL NOT use accent colors with saturation above 60% in the oklch color space
3. THE App_Shell SHALL use `--home-bg: #09090b` (zinc-950 equivalent) as the primary background color in dark mode
4. THE Card_System SHALL use `--home-surface` at 70% opacity via `color-mix(in srgb, var(--home-surface) 70%, transparent)` combined with `backdrop-filter: blur(16px)` as the standard surface color
5. THE App_Shell SHALL use `rgba(255, 255, 255, 0.05)` for elevated interactive surfaces and `rgba(255, 255, 255, 0.1)` for hover states in dark mode
6. THE Design_Token system SHALL support both light and dark modes through CSS custom properties (`--home-bg`, `--home-surface`, `--home-elevated`, `--home-border`, `--home-text`, `--home-muted`) with automatic switching via the `.dark` class on the HTML element

### Requirement 3: Typography System

**User Story:** As a user, I want typography that feels cinematic and editorial, so that the interface communicates calm intelligence rather than utilitarian function.

#### Acceptance Criteria

1. THE App_Shell SHALL use serif fonts exclusively for hero statements, emotional headings, marketing sections, and philosophical messaging
2. THE App_Shell SHALL use sans-serif or monospace fonts for all productivity interactions including navigation, forms, notes, tasks, sidebar items, and utility surfaces
3. THE App_Shell SHALL implement a typographic scale with hero text at text-5xl on mobile scaling to text-6xl on medium and text-7xl on large viewports with font-bold and tracking-tight, page titles at text-3xl font-semibold tracking-tight, section headings at text-xl font-medium, and body text at text-sm with text-app-muted color for secondary content
4. THE App_Shell SHALL apply tracking-tight letter-spacing to all headings (h1 through h4) and tracking-normal to body text
5. THE App_Shell SHALL maintain a minimum size ratio of 1.25x between adjacent heading levels (e.g., h2 must be at least 1.25 times the computed font-size of h3) to establish visual hierarchy
6. WHEN a text element is rendered in a marketing or landing section, THE App_Shell SHALL apply font-bold weight, and WHEN a text element is rendered in an app productivity surface, THE App_Shell SHALL apply font-semibold or font-medium weight

### Requirement 4: Spatial Design and Depth

**User Story:** As a user, I want the interface to feel layered and immersive with visual depth, so that it creates an atmospheric environment rather than a flat utility screen.

#### Acceptance Criteria

1. THE App_Shell SHALL use translucent surfaces with `backdrop-filter: blur(16px)` (backdrop-blur-xl equivalent) to create depth between overlapping layers including the Sidebar, modals, and the Command_Menu
2. THE Card_System SHALL apply a radial gradient overlay (`radial-gradient(ellipse at top, rgba(255,255,255,0.03), transparent)`) on card surfaces to simulate ambient top-lighting and establish spatial hierarchy
3. THE App_Shell SHALL use border-radius values of at least `0.75rem` on all content containers and avoid 0px border-radius or sharp 90-degree corners on any visible surface element
4. THE App_Shell SHALL use a layered shadow system: `shadow-lg` (0 10px 15px rgba(0,0,0,0.1)) on standard cards and `shadow-2xl` (0 25px 50px rgba(0,0,0,0.25)) on elevated panels and modals in dark mode
5. THE Sidebar SHALL use `backdrop-filter: blur(16px)` with a background opacity between 85% and 95% to create a floating, spatial appearance that allows underlying ambient gradients to show through

### Requirement 5: Card System Redesign

**User Story:** As a user, I want cards that feel tactile, premium, and softly elevated, so that content containers enhance the calm atmosphere rather than feeling like generic UI boxes.

#### Acceptance Criteria

1. THE Card_System SHALL define the `card-app` component class with a border-radius of 1rem (rounded-2xl), a 1px solid border using the `--home-border` token, a background using the `--home-surface` token at 70% opacity via `color-mix`, and a `backdrop-filter: blur(16px)` for frosted-glass depth
2. THE Card_System SHALL apply a box-shadow of `0 10px 30px rgba(0, 0, 0, 0.08)` in light mode and `0 10px 30px rgba(0, 0, 0, 0.45)` in dark mode to create soft elevation on all `card-app` elements
3. WHEN a user hovers over a card, THE Card_System SHALL transition the border opacity from 10% to 20% and the background opacity from 70% to 100% over a duration between 150ms and 300ms using an ease timing function
4. THE Card_System SHALL maintain internal padding of 1.5rem (p-6) for standard cards and 1rem (p-4) for compact list items using the `item-app` class
5. THE Card_System SHALL apply the `card-app` class consistently across all modules (dashboard, notes, tasks, calendar, library, documents, contacts, settings) for content grouping, with no raw background or border color classes used in place of the semantic class
6. IF the user has enabled `prefers-reduced-motion`, THEN THE Card_System SHALL disable the hover transition and apply the default (non-hovered) border and background values statically

### Requirement 6: Input System Redesign

**User Story:** As a user, I want form inputs that feel integrated and minimal, so that they blend into the environment rather than appearing as traditional form elements.

#### Acceptance Criteria

1. THE Input_System SHALL style inputs using the `input-app` component class, which applies the `--home-elevated` background color, `--home-border` border (1px solid), `--home-text` text color, and `--home-muted` placeholder color as defined in the project design tokens
2. THE Input_System SHALL use focus-visible:ring-0 to suppress the default browser focus outline
3. WHEN an input receives focus, THE Input_System SHALL indicate the active state by transitioning the background color to a higher-opacity variant of the elevated surface token within 150ms, providing a visible change that meets WCAG 2.1 non-text contrast ratio of at least 3:1 against the surrounding surface
4. THE Input_System SHALL render inputs at rest with no box-shadow, a border opacity no greater than 10%, and a background that differs from the parent surface by no more than 5% lightness, so that the input integrates with the surrounding panel rather than appearing as a distinct form control
5. WHEN an input is inactive, THE Input_System SHALL render the input with the same border-radius (0.75rem) and border style as adjacent surface elements (cards, list items) so that it is visually consistent with non-interactive content areas
6. WHILE an input has focus, THE Input_System SHALL maintain at least one visible focus indicator (background color shift or border color change) that is perceivable without relying on color alone, ensuring keyboard users can identify the active element

### Requirement 7: Sidebar Redesign

**User Story:** As a user, I want a sidebar that feels premium, spatial, and calm, so that navigation feels like part of the environment rather than a utility panel.

#### Acceptance Criteria

1. THE Sidebar SHALL apply a backdrop-blur of at least 16px and a background opacity between 85% and 95% (using the `panel-app` surface style or equivalent translucent treatment) so that underlying content is softly visible through the sidebar surface
2. WHEN the user hovers over a navigation item, THE Sidebar SHALL transition the item background opacity from 0% to the `bg-app-elevated` value over a duration of 150ms to 200ms using an ease timing function
3. WHILE a navigation item corresponds to the current active route, THE Sidebar SHALL indicate the active state using a background highlight at the `bg-app-elevated` color and a 2px left border accent, without using solid filled color blocks
4. THE Sidebar SHALL maintain a minimum vertical gap of 8px (space-y-2) between navigation items and a minimum vertical padding of 12px on each item to provide consistent spatial separation
5. THE Sidebar SHALL display the "Home OS" brand name using the project monospace font at font-weight semibold (600) and a size between 1.25rem and 1.5rem, with a muted tagline below at text-sm using `text-app-muted`
6. THE Sidebar SHALL use a fixed width between 256px and 288px, have no visible outer border on its right edge (relying on the translucent surface contrast instead), and position navigation items with icon-label pairs aligned with a consistent 12px gap between icon and label text
7. WHEN the user navigates between routes, THE Sidebar SHALL update the active indicator to reflect the new current route within the same render frame, with no visible delay or animation lag exceeding 100ms

### Requirement 8: Dashboard Redesign

**User Story:** As a user, I want a dashboard that feels like a personal mission control for my life, so that it presents contextual information with emotional intelligence rather than metrics and analytics.

#### Acceptance Criteria

1. THE Dashboard SHALL display contextual activity sections for: today's focus tasks (maximum 8 items), pinned or recent notes (maximum 6 items), currently reading books (maximum 3 items), and favorite contacts (maximum 4 items), each in a separate card with a heading and a navigation link to the full module
2. THE Dashboard SHALL arrange widget sections in a single-column or asymmetric grid layout with no more than 3 columns at the widest breakpoint, using generous spacing between sections so that no more than 2 content-dense sections are visible simultaneously without scrolling on a 900px-tall viewport
3. THE Dashboard SHALL include the Quick_Capture widget at the top of the content area, allowing the user to create a task or a note by entering text and selecting one of two actions without navigating away from the dashboard
4. WHEN the Dashboard loads, THE Dashboard SHALL display a time-aware greeting that varies by time of day (morning before 12:00, afternoon 12:00–16:59, evening 17:00 onward), the user's first name, the current date formatted as weekday and month-day, and a single-sentence contextual subtitle
5. THE Dashboard SHALL NOT display numeric analytics charts, percentage-based progress dashboards, tabular data grids, or any widget whose primary content is an aggregate metric without accompanying human-readable context
6. THE Dashboard SHALL order the focus tasks section by due date ascending with overdue items first, order the notes section by most recently updated, and order the reading section by most recently updated — reflecting the user's current activity rather than static configuration
7. IF a dashboard section contains no items, THEN THE Dashboard SHALL display an empty-state message with a text prompt guiding the user to the relevant module, rather than hiding the section or showing a blank area

### Requirement 9: Motion Design System

**User Story:** As a user, I want subtle, calm animations throughout the interface, so that interactions feel spatial and premium without being distracting.

#### Acceptance Criteria

1. THE Motion_System SHALL use fade transitions (opacity 0 to 1) for page and section reveals with durations between 150ms and 300ms
2. WHEN a user hovers over an interactive card or button, THE Motion_System SHALL apply a scale transform between 1.02 and 1.05 combined with an opacity shift no greater than 0.1, with a transition duration between 150ms and 200ms
3. WHEN an overlay or modal appears, THE Motion_System SHALL apply a backdrop blur between 4px and 12px with a fade-in transition duration between 100ms and 200ms
4. THE Motion_System SHALL NOT use spring animations with bounce, color transitions shorter than 150ms, rotation exceeding 10 degrees, or translateX/translateY displacement exceeding 30px on any single animation
5. WHILE the user has enabled reduced motion preferences in their operating system (prefers-reduced-motion: reduce), THE Motion_System SHALL disable all animations and transitions except focus indicators and display all content in its final visible state immediately without delay
6. THE Motion_System SHALL apply ease-out easing for all entrance animations and ease-in easing for all exit animations across all animated elements

### Requirement 10: Empty State Design

**User Story:** As a user, I want empty states that feel warm and intentional, so that blank screens communicate possibility rather than absence.

#### Acceptance Criteria

1. THE Empty_State SHALL display a heading of no more than 60 characters that references the specific module by name (e.g., "notes", "tasks", "contacts") and a body sentence of no more than 120 characters that describes what the user can accomplish in that module
2. THE Empty_State SHALL center its content vertically and horizontally within the available viewport area, with a minimum of 64px padding on all sides between the empty state content and the nearest container edge
3. THE Empty_State SHALL include a single icon from the project's icon library (Lucide React or Phosphor) that represents the module's domain, rendered at 48px size using the `text-app-muted` color token
4. THE Empty_State SHALL NOT use generic phrases such as "No data found", "Nothing here", "No items", or "Empty" as the heading or body text; instead, the copy SHALL name the module and describe a first action the user can take
5. THE Empty_State SHALL provide exactly one call-to-action button using the `btn-primary-app` class that, when activated, initiates the creation flow for the first item in that module (e.g., create a note, add a task, upload a document)
6. WHEN the call-to-action button in the Empty_State is activated via click or keyboard, THE Empty_State SHALL initiate the same creation flow that is available from the module's primary "add" or "create" action

### Requirement 11: Module Visual Consistency

**User Story:** As a user, I want all modules to share the same visual language, so that moving between Notes, Tasks, Contacts, Library, and other sections feels like navigating within one coherent environment.

#### Acceptance Criteria

1. THE App_Shell SHALL enforce consistent page header patterns across all modules using the PageShell component: title rendered at text-4xl font-bold tracking-tight, subtitle placed directly below the title with text-app-muted styling, and action buttons (if present) positioned to the right of the title within the same panel-app header container
2. THE App_Shell SHALL use the same card-app class for content cards, input-app class for text inputs, and a shared Empty_State component (centered text-app-muted message within a panel-app container) in every module that displays collections
3. THE App_Shell SHALL maintain a content max-width of max-w-6xl, horizontal padding of px-6, and vertical spacing of py-10 on all module pages by requiring each module page to use the PageShell layout component
4. WHEN a new module is added, THE App_Shell SHALL provide the PageShell component that accepts title, description, and children props, such that using PageShell alone produces a page layout matching existing modules without requiring custom layout classes
5. THE App_Shell SHALL use the item-app class for all list items across Notes, Tasks, Contacts, and Library modules, providing border-radius of 0.75rem, 1px border using border-app color, p-4 internal padding, and a background-color hover transition completing within 150ms
6. IF a module page does not wrap its content in the PageShell component, THEN THE App_Shell SHALL still apply the same bg-app background and text-app text color to the page root container to maintain color consistency

### Requirement 12: Component Standardization

**User Story:** As a developer, I want a standardized set of reusable layout and UI components, so that building new features maintains visual consistency without duplicating design decisions.

#### Acceptance Criteria

1. THE App_Shell SHALL provide a PageShell layout component that renders a page header (title and optional description inside a `panel-app` container), a content area constrained to a maximum width of 72rem with horizontal padding of 1.5rem and vertical padding of 2.5rem, and sidebar integration via a responsive sidebar hidden below the `md` breakpoint
2. THE App_Shell SHALL provide a modal system built on the Dialog primitive that applies a backdrop blur of 16px, offers at least two size variants (small: max-width 28rem, medium: max-width 32rem), uses internal padding of 1.5rem, and animates open/close transitions within 150–300ms using opacity and scale transforms
3. THE App_Shell SHALL provide a floating toolbar component that renders as a fixed or sticky bar within a content area, uses `rounded-2xl` border radius with `border-app` and `bg-app-surface` styling, and positions contextual action buttons (icon-only with `aria-label` or icon-plus-label) in a horizontal row with 0.5rem gap
4. THE App_Shell SHALL provide a search surface component that renders an input field styled with the `input-app` class, displays a search icon prefix, debounces user input by 300ms before triggering a search callback, and presents results as a scrollable list limited to a maximum of 20 visible items using the `item-app` styling per result row
5. THE App_Shell SHALL provide a command interface activated by the ⌘K (or Ctrl+K) keyboard shortcut that opens a CommandDialog overlay with `panel-app` glassmorphism styling (backdrop-filter blur of 16px, semi-transparent surface background), groups results by category, limits results to 5 items per category, and dismisses on Escape key press or backdrop click
6. THE Card_System SHALL provide four variant components that share a base of `border-app` border and `bg-app-surface` background: a standard card (`card-app`, border-radius 1rem, padding 1.5rem), a compact item card (`item-app`, border-radius 0.75rem, padding 1rem, hover state transitioning background in 150ms), a stat card (border-radius 1rem, padding 1rem, displaying a numeric value in 1.5rem bold text with a muted label below), and a panel card (`panel-app`, border-radius 1.5rem, padding 1.5rem, with backdrop-filter blur of 16px)

### Requirement 13: Emotional Experience and Cognitive Load

**User Story:** As a user, I want the interface to reduce my cognitive load and visual noise, so that using the application feels calming and restorative rather than overwhelming.

#### Acceptance Criteria

1. THE App_Shell SHALL limit the number of distinct interactive content sections visible within a single viewport to no more than 7, ensuring remaining content is accessible by scrolling
2. THE App_Shell SHALL maintain a minimum spacing of 32px between top-level content sections and a minimum internal padding of 24px within cards and panels
3. THE App_Shell SHALL present information progressively by default, showing list items with text truncated to no more than 2 lines and limiting displayed items to no more than 5 per section, with full content accessible on user interaction (click or tap)
4. THE App_Shell SHALL render secondary metadata (timestamps, counts, helper text, and labels that do not convey the primary content meaning) using the muted text style (text-app-muted) to visually de-emphasize them relative to primary content
5. THE App_Shell SHALL use no more than 2 distinct accent color hues within any single content section, with additional sections permitted to introduce their own accent hue
6. WHILE a user is editing a note or document (the editor view is active), THE App_Shell SHALL hide the navigation sidebar on viewports below 1024px wide and suppress non-critical UI elements (stat counters, promotional banners) from the editor viewport area
7. WHEN the user navigates to a content creation view (note editor, document editor, or task detail), THE App_Shell SHALL allocate at least 70% of the viewport width to the primary content editing area on screens 1024px and wider

### Requirement 14: Signature Interaction — Command Center

**User Story:** As a user, I want a memorable command center interaction that serves as the primary quick-access interface, so that the application has a distinctive, premium interaction pattern.

#### Acceptance Criteria

1. WHEN the user presses ⌘K (or Ctrl+K), THE Command_Menu SHALL appear with a blur-in animation completing within 150 to 300 milliseconds and a glassmorphism backdrop overlay
2. WHILE the Command_Menu is open and the search input is empty, THE Command_Menu SHALL display a "Quick actions" group (containing at minimum "New note" and "New task" options) and a "Go to" group listing all navigation destinations (Dashboard, Notes, Tasks, Calendar, Library, Documents, Contacts, Settings) with corresponding category icons
3. WHILE the Command_Menu is open, THE Command_Menu SHALL execute a search query against notes, tasks, contacts, books, calendar events, and documents after a debounce period of no more than 500 milliseconds following the last keystroke, returning a maximum of 5 results per category
4. WHEN search results are returned, THE Command_Menu SHALL display results grouped by category (Tasks, Notes, Books, Contacts, Events, Documents) with each group preceded by a heading label and separated by visual dividers, and each result item preceded by a category icon
5. WHILE the Command_Menu is open, THE Command_Menu SHALL support keyboard navigation (arrow keys to move between items, Enter to select) with a visible focus indicator on the currently highlighted item and the result list scrolling to keep the focused item in view
6. WHEN the user presses Escape or clicks outside the Command_Menu, THE Command_Menu SHALL dismiss with a fade-out animation completing within 150 to 300 milliseconds
7. THE Command_Menu SHALL present a visually premium surface (rounded-2xl, backdrop-blur-2xl, border-white/10, shadow-2xl) consistent with the spatial design language
8. IF the search query returns zero results across all categories, THEN THE Command_Menu SHALL display a "No results" empty state message within the result list area

### Requirement 15: Landing Page Preservation

**User Story:** As a stakeholder, I want the landing page to remain completely unchanged during this redesign, so that the established marketing presence is preserved.

#### Acceptance Criteria

1. THE App_Shell redesign SHALL NOT modify any files within the app/(marketing)/ route group
2. THE App_Shell redesign SHALL NOT modify any components within the components/landing/ directory
3. THE Design_Token changes SHALL NOT rename, remove, or alter the computed value of any existing CSS custom property (--home-*, --background, --foreground, --border, --muted, --muted-foreground, --primary, --primary-foreground) defined in app/globals.css that is referenced by landing page components
4. IF a new or modified Design_Token is required for the App_Shell redesign that would change a shared CSS custom property value, THEN THE App_Shell SHALL scope that token override to the app/(app)/ route group layout or its descendants so that the app/(marketing)/ route group inherits only the original values
5. THE App_Shell redesign SHALL NOT modify the root layout file (app/layout.tsx) in a way that adds, removes, or reorders elements rendered within the app/(marketing)/ route group's visual output

### Requirement 16: Accessibility Compliance

**User Story:** As a user with accessibility needs, I want the redesigned interface to remain fully accessible, so that the visual enhancements do not compromise usability for assistive technology users.

#### Acceptance Criteria

1. THE App_Shell SHALL maintain a minimum contrast ratio of 4.5:1 for normal text (below 18px or below 14px bold) and 3:1 for large text (18px+ or 14px+ bold) between text and its immediate background across all redesigned surfaces
2. THE App_Shell SHALL preserve keyboard navigability for all interactive elements including the redesigned Sidebar, Card_System, and Command_Menu, with a logical tab order that follows visual reading order (left-to-right, top-to-bottom)
3. THE App_Shell SHALL provide visible focus indicators on all interactive elements using a 2px outline or equivalent visual treatment with a minimum contrast ratio of 3:1 against adjacent colors
4. THE App_Shell SHALL use semantic HTML elements (`nav` for sidebar, `main` for content area, `section` for content groups, `header` for page headers, `button` for interactive controls) throughout the redesigned layout
5. THE App_Shell SHALL ensure all icon-only interactive elements have descriptive `aria-label` attributes that convey the action (e.g., "Open menu", "Create note", "Search")
6. WHEN glassmorphism or translucent surfaces reduce text readability below the required contrast ratio, THE App_Shell SHALL increase text opacity or add a solid fallback background layer to restore the minimum 4.5:1 contrast ratio

### Requirement 17: Performance and Responsiveness

**User Story:** As a user, I want the redesigned interface to remain fast and responsive, so that visual enhancements do not degrade the application experience.

#### Acceptance Criteria

1. THE App_Shell SHALL limit backdrop-blur usage to a maximum of 3 simultaneous blur layers visible in any viewport at any given time
2. THE Motion_System SHALL use CSS transforms and opacity for animations rather than layout-triggering properties (width, height, top, left)
3. WHEN the user navigates between module pages after initial page load is complete, THE App_Shell SHALL render the target page content within 100ms on a 4G connection (round-trip latency up to 100ms, throughput of 15 Mbps or higher)
4. THE App_Shell SHALL render all content without horizontal overflow or overlapping elements across viewport widths from 375px (mobile) to 2560px (ultrawide desktop), with no interactive element smaller than 44×44px
5. WHILE on mobile viewports (below 768px), THE Sidebar SHALL collapse into a slide-out overlay accessible via a menu button
6. IF the user's device reports 4 GB of memory or less via navigator.deviceMemory, or the browser does not support backdrop-filter, THEN THE Card_System and Spatial_Design effects SHALL render with backdrop-blur disabled and box-shadow limited to a single layer
7. IF the user has enabled prefers-reduced-motion: reduce at the OS level, THEN THE Motion_System SHALL skip all animations and display elements in their final state immediately
