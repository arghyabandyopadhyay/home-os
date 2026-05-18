# Implementation Plan: Fix Command Menu Search

## Overview

Fix two usability bugs in the command menu: (1) disable cmdk's client-side filtering so server results are displayed, and (2) add a clickable SearchTrigger button in the header. Uses a custom DOM event for communication between the trigger and the menu.

## Tasks

- [x] 1. Modify CommandDialog to forward `shouldFilter` prop
  - [x] 1.1 Update `CommandDialog` in `components/ui/command.tsx` to accept a `shouldFilter` prop and pass it to the inner `Command` component
    - Add `shouldFilter?: boolean` to the `CommandDialogProps` type
    - Destructure `shouldFilter` from props and pass it as `<Command shouldFilter={shouldFilter}>`
    - _Requirements: 1.1_

- [x] 2. Disable client-side filtering in CommandMenu
  - [x] 2.1 Pass `shouldFilter={false}` to `CommandDialog` in `components/layout/command-menu.tsx`
    - Add `shouldFilter={false}` prop to the `<CommandDialog>` JSX element
    - _Requirements: 1.1, 1.2_
  - [ ]* 2.2 Write property test: server results are never filtered out
    - **Property 1: Server results are never filtered out by the client**
    - Generate random result arrays with titles not matching a query; verify all items are preserved in display logic
    - **Validates: Requirements 1.2**
  - [ ]* 2.3 Write property test: content type icon mapping is total
    - **Property 2: Content type icon mapping is total**
    - For any valid content type, verify the icon mapping returns a defined component
    - **Validates: Requirements 4.3**

- [x] 3. Create SearchTrigger client component
  - [x] 3.1 Create `components/layout/search-trigger.tsx`
    - Render a `<button>` with `aria-label="Search"`, search icon, "Search..." placeholder text, and `⌘K` kbd badge
    - On click, dispatch `window.dispatchEvent(new Event('open-command-menu'))`
    - Style with `bg-app-elevated border border-app rounded-xl` and hide on mobile (`hidden sm:inline-flex`)
    - _Requirements: 2.1, 2.3, 2.4, 2.5_
  - [ ]* 3.2 Write unit tests for SearchTrigger
    - Verify button renders with correct aria-label, placeholder text, and kbd hint
    - Verify click dispatches the `open-command-menu` custom event
    - _Requirements: 2.3, 2.4, 2.5_

- [x] 4. Add custom event listener to CommandMenu
  - [x] 4.1 Add event listener for `'open-command-menu'` in `components/layout/command-menu.tsx`
    - Add a `useEffect` that listens for the custom event and calls `setOpen(true)`
    - Clean up the listener on unmount
    - _Requirements: 6.1, 6.2_
  - [ ]* 4.2 Write unit test: CommandMenu opens on custom event
    - Verify that dispatching `open-command-menu` event causes the menu to open
    - _Requirements: 6.1, 6.2_
  - [ ]* 4.3 Write property test: non-empty query hides default groups
    - **Property 3: Non-empty query hides default groups**
    - For any non-empty, non-whitespace string, verify the state logic hides Quick Actions and Go To groups
    - **Validates: Requirements 5.3**

- [x] 5. Update Header to render SearchTrigger
  - [x] 5.1 Replace the `<kbd>` shortcut hint in `components/layout/header.tsx` with `<SearchTrigger />`
    - Import `SearchTrigger` from `./search-trigger`
    - Remove the existing standalone `<kbd>⌘K</kbd>` element
    - Render `<SearchTrigger />` in its place
    - Header remains a server component (no "use client" directive)
    - _Requirements: 2.1, 6.3_

- [x] 6. Checkpoint — Verify all changes work together
  - Ensure all tests pass (`npm run test`), ask the user if questions arise.
  - Verify: opening via ⌘K still works, opening via SearchTrigger click works, search results from server are displayed without being filtered
  - _Requirements: 3.1, 3.2_

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1"] },
    { "id": 1, "tasks": ["2.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "4.2", "4.3", "5.1"] },
    { "id": 3, "tasks": ["6"] }
  ]
}
```

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The Header stays a server component — only SearchTrigger is a client component
- No new dependencies needed (custom DOM events are native)
- Existing property tests in `components/__tests__/command-menu.test.ts` (P27, P28) remain valid and unchanged
