# Requirements Document

## Introduction

The command menu (search dialog) in Home OS has two usability bugs: server-side search results are hidden by cmdk's built-in client-side filtering, and there is no mouse/touch-accessible trigger to open the dialog. This spec addresses both issues to make the command menu fully functional and accessible.

## Glossary

- **Command_Menu**: The search dialog component (`CommandMenu`) that allows users to search across all content types and navigate the application via keyboard or mouse.
- **Search_Trigger**: A clickable button element in the application header that opens the Command_Menu on click or tap.
- **Header**: The sticky top navigation bar of the application shell, rendered by `components/layout/header.tsx`.
- **cmdk**: The third-party library (`cmdk`) that provides the underlying command palette primitives, wrapped by shadcn's Command component.
- **Server_Side_Search**: The existing debounced search logic that queries Supabase across books, contacts, documents, events, notes, and tasks.
- **Client_Side_Filtering**: cmdk's built-in behavior that filters rendered CommandItem elements by their text content before display.

## Requirements

### Requirement 1: Disable Client-Side Filtering

**User Story:** As a user, I want my search queries to return results from the server, so that I can find content across all my data.

#### Acceptance Criteria

1. WHEN the Command_Menu is rendered, THE Command component SHALL have client-side filtering disabled via the `shouldFilter={false}` prop.
2. WHEN a user types a search query and server results are returned, THE Command_Menu SHALL display all server-returned items without cmdk filtering them out.
3. WHEN a user types a search query and no server results match, THE Command_Menu SHALL display a "No results" empty state.

### Requirement 2: Clickable Search Trigger in Header

**User Story:** As a user, I want to click a button in the header to open the search dialog, so that I can access search without memorizing a keyboard shortcut.

#### Acceptance Criteria

1. THE Header SHALL contain a Search_Trigger button element that opens the Command_Menu on click.
2. WHEN the Search_Trigger is clicked, THE Command_Menu SHALL open in its default state (no query, showing Quick Actions and Go To sections).
3. THE Search_Trigger SHALL display placeholder text (e.g., "Search...") and a visual hint of the keyboard shortcut (⌘K).
4. THE Search_Trigger SHALL be rendered as a `<button>` element with an appropriate `aria-label` for screen readers.
5. THE Search_Trigger SHALL be keyboard-accessible (focusable via Tab, activatable via Enter or Space).

### Requirement 3: Preserve Existing Keyboard Shortcut

**User Story:** As a power user, I want the ⌘K / Ctrl+K keyboard shortcut to continue opening the command menu, so that my existing workflow is not disrupted.

#### Acceptance Criteria

1. WHEN a user presses ⌘K (macOS) or Ctrl+K (Windows/Linux), THE Command_Menu SHALL toggle open or closed.
2. WHEN the Command_Menu is opened via keyboard shortcut, THE Command_Menu SHALL behave identically to when opened via the Search_Trigger.

### Requirement 4: Search Across All Content Types

**User Story:** As a user, I want search to query all my content types, so that I can find anything from one place.

#### Acceptance Criteria

1. WHEN a search query is submitted, THE Server_Side_Search SHALL query books, contacts, documents, events, notes, and tasks.
2. WHEN results are returned, THE Command_Menu SHALL group results by content type with appropriate section headings.
3. WHEN results are returned, THE Command_Menu SHALL display an appropriate icon for each content type group.

### Requirement 5: Default State Display

**User Story:** As a user, I want to see quick actions and navigation options when I open the command menu without a query, so that I can quickly perform common actions.

#### Acceptance Criteria

1. WHEN the Command_Menu is open and no search query is entered, THE Command_Menu SHALL display a "Quick actions" group with options to create a new note and a new task.
2. WHEN the Command_Menu is open and no search query is entered, THE Command_Menu SHALL display a "Go to" navigation group with links to all main application sections.
3. WHEN a user types a search query, THE Command_Menu SHALL hide the Quick Actions and Go To groups and show search results instead.

### Requirement 6: State Communication Between Header and Command Menu

**User Story:** As a developer, I want the header's search trigger to be able to open the command menu, so that the two components can communicate without tight coupling.

#### Acceptance Criteria

1. THE Command_Menu component SHALL expose a mechanism for external components to trigger its open state.
2. WHEN the Search_Trigger in the Header activates the open mechanism, THE Command_Menu SHALL open.
3. THE Header component SHALL remain functional as a server component, with only the Search_Trigger extracted as a client component if necessary.
