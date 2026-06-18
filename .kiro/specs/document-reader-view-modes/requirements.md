# Requirements Document

## Introduction

The DocumentReader component currently supports only a single-page navigation mode with prev/next buttons. This feature adds multiple view modes — single page scroll, two page scroll, and fit-to-page scaling — giving users flexible ways to read PDF documents based on their preference and viewport size. The component is shared between the book reader (`/reader/[id]`) and document reader (`/documents/[id]`) routes.

## Glossary

- **Document_Reader**: The shared `DocumentReader` React component that renders PDF files using react-pdf, located at `components/shared/document-reader.tsx`
- **View_Mode**: A user-selectable layout strategy that determines how PDF pages are arranged and navigated within the Document_Reader
- **Single_Page_Mode**: The existing view mode where one page is displayed at a time with prev/next navigation buttons
- **Single_Page_Scroll_Mode**: A view mode where all pages are rendered vertically in a continuous scrollable column, one page per row
- **Two_Page_Scroll_Mode**: A view mode where pages are displayed two at a time side by side in a scrollable layout
- **Fit_To_Page**: A scaling option that resizes the rendered PDF page to fit the available viewport dimensions without requiring horizontal scrolling
- **View_Mode_Selector**: A UI control in the Document_Reader toolbar that allows users to switch between view modes
- **Viewport**: The visible area of the Document_Reader content pane, excluding the toolbar

## Requirements

### Requirement 1: View Mode Selection

**User Story:** As a reader, I want to switch between different page layout modes, so that I can choose the reading experience that best fits my preference and screen size.

#### Acceptance Criteria

1. THE Document_Reader SHALL provide a View_Mode_Selector in the toolbar that offers three view modes: Single_Page_Mode, Single_Page_Scroll_Mode, and Two_Page_Scroll_Mode
2. WHEN a user selects a view mode from the View_Mode_Selector, THE Document_Reader SHALL switch to the selected layout within 300 milliseconds without reloading the PDF document or re-fetching the file from the server
3. WHEN the Document_Reader first loads a PDF document, THE Document_Reader SHALL default to Single_Page_Mode
4. WHEN switching from any view mode to Single_Page_Mode, THE Document_Reader SHALL display the page that was most visible in the Viewport at the moment of switching
5. WHEN switching from Single_Page_Mode to Single_Page_Scroll_Mode or Two_Page_Scroll_Mode, THE Document_Reader SHALL scroll the Viewport so that the previously displayed page is the topmost visible page
6. THE View_Mode_Selector SHALL display a visually distinct active state (such as a highlighted background or contrasting style) on the currently selected mode option, distinguishable from inactive options without relying on color alone
7. IF the PDF document contains only one page and Two_Page_Scroll_Mode is selected, THEN THE Document_Reader SHALL display the single page alone without rendering an empty placeholder for a second page

### Requirement 2: Single Page Scroll Mode

**User Story:** As a reader, I want to scroll continuously through all pages vertically, so that I can read without interruption from page navigation controls.

#### Acceptance Criteria

1. WHILE Single_Page_Scroll_Mode is active, THE Document_Reader SHALL render all pages in a vertical stack with uniform spacing of 24px between consecutive pages
2. WHILE Single_Page_Scroll_Mode is active, THE Document_Reader SHALL allow the user to scroll vertically through all pages continuously
3. WHILE Single_Page_Scroll_Mode is active, THE Document_Reader SHALL update the displayed page number in the toolbar to reflect the page whose vertical center is closest to the vertical center of the Viewport
4. WHILE Single_Page_Scroll_Mode is active, THE Document_Reader SHALL hide the prev/next navigation buttons
5. WHILE Single_Page_Scroll_Mode is active, WHEN the user enters a page number in the page input field and submits, THE Document_Reader SHALL scroll the Viewport so that the target page is visible at the top of the scrollable area

### Requirement 3: Two Page Scroll Mode

**User Story:** As a reader, I want to view two pages side by side while scrolling, so that I can see more content at once on wider screens.

#### Acceptance Criteria

1. WHILE Two_Page_Scroll_Mode is active, THE Document_Reader SHALL render pages in pairs (left and right) arranged in a vertical scrollable layout with consistent spacing between each row of pages
2. WHILE Two_Page_Scroll_Mode is active, THE Document_Reader SHALL display page 1 alone on the first row, with subsequent pages paired as (2,3), (4,5), and so on, and IF the document has an odd number of total pages, THEN the last page SHALL be displayed alone on the final row
3. WHILE Two_Page_Scroll_Mode is active, THE Document_Reader SHALL display the page numbers of the row that has the largest visible area within the Viewport, formatted as a range (e.g., "2–3") when a pair is most visible or as a single number when a solo page is most visible
4. WHILE Two_Page_Scroll_Mode is active, THE Document_Reader SHALL hide the prev/next navigation buttons since they are not applicable
5. IF the Viewport width is insufficient to display two pages side by side where each page is at least 300 CSS pixels wide, THEN THE Document_Reader SHALL scale both pages proportionally to fit within the available width while maintaining their aspect ratio

### Requirement 4: Single Page Navigation Mode (Existing Behavior)

**User Story:** As a reader, I want to navigate page by page with explicit controls, so that I can move through the document at my own pace with precise control.

#### Acceptance Criteria

1. WHILE Single_Page_Mode is active, THE Document_Reader SHALL display exactly one page at a time, centered horizontally within the Viewport
2. WHILE Single_Page_Mode is active, THE Document_Reader SHALL show a previous-page button and a next-page button for sequential page-by-page navigation
3. IF the current page is the first page, THEN THE Document_Reader SHALL disable the previous-page button so it cannot be activated
4. IF the current page is the last page, THEN THE Document_Reader SHALL disable the next-page button so it cannot be activated
5. WHILE Single_Page_Mode is active, THE Document_Reader SHALL display the current page number and total page count in the toolbar
6. WHILE Single_Page_Mode is active, THE Document_Reader SHALL allow direct page number input; WHEN the user submits a value, THE Document_Reader SHALL navigate to that page if the value is an integer between 1 and the total page count inclusive, or revert the input field to the current page number if the value is non-numeric or out of range

### Requirement 5: Fit to Page Scaling

**User Story:** As a reader, I want the PDF page to scale to fit my viewport, so that I can see the full page without horizontal scrolling regardless of my screen size.

#### Acceptance Criteria

1. THE Document_Reader SHALL provide a Fit_To_Page toggle control in the toolbar, defaulting to enabled when the document is first opened
2. WHEN Fit_To_Page is enabled, THE Document_Reader SHALL scale the rendered page width to fit the available Viewport width (excluding toolbar and any content padding) without causing horizontal overflow
3. WHEN Fit_To_Page is enabled, THE Document_Reader SHALL maintain the original aspect ratio of the PDF page during scaling
4. WHEN Fit_To_Page is disabled, THE Document_Reader SHALL render pages at their intrinsic PDF page dimensions (the page's native point size at 72 DPI mapped 1:1 to CSS pixels)
5. THE Fit_To_Page option SHALL be available in all three view modes, and its enabled/disabled state SHALL be preserved when switching between view modes
6. WHILE Fit_To_Page is enabled AND Two_Page_Scroll_Mode is active, THE Document_Reader SHALL scale each page pair so that both pages fit side by side within the available Viewport width
7. WHEN the Viewport is resized while Fit_To_Page is enabled, THE Document_Reader SHALL recalculate and apply the updated scale within 200ms of the resize completing

### Requirement 6: Toolbar Layout and Accessibility

**User Story:** As a reader, I want the view controls to be clearly organized and accessible, so that I can easily find and use them without confusion.

#### Acceptance Criteria

1. THE Document_Reader toolbar SHALL group the View_Mode_Selector and Fit_To_Page toggle in one control group, visually separated from the page navigation controls and download button by a visible divider or a spacing gap of at least 16px
2. THE View_Mode_Selector SHALL provide an aria-label on each mode option that includes the mode name and whether it is currently selected (e.g., "Single page mode, selected")
3. THE Fit_To_Page toggle SHALL provide an aria-label that includes its name and current state using aria-pressed to indicate enabled (true) or disabled (false)
4. THE Document_Reader toolbar SHALL use role="toolbar" with an aria-label describing its purpose, and SHALL support sequential keyboard navigation between all toolbar controls using the Tab key
5. WHEN the Document_Reader Viewport width is below 768px, THE toolbar SHALL wrap controls onto multiple rows or collapse the View_Mode_Selector into a dropdown menu, while keeping the page navigation controls, Fit_To_Page toggle, and download button always visible
6. THE Document_Reader toolbar SHALL render all interactive controls with a minimum touch target size of 44×44 CSS pixels
