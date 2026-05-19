# Implementation Plan: Mobile Contact Call

## Overview

Add a tap-to-call button to contact cards, list items, and the contact detail sheet on mobile viewports. The implementation creates a shared `CallButton` component and integrates it into three existing components with conditional rendering based on viewport size and phone number availability.

## Tasks

- [x] 1. Create CallButton shared component
  - [x] 1.1 Create `components/contacts/call-button.tsx` with CallButton component
    - Render an `<a>` element with `href="tel:{phone}"`
    - Accept `phone: string` and `contactName: string` props
    - Apply `aria-label="Call {name}"` truncated to 100 characters with ellipsis if exceeded
    - Call `stopPropagation()` on click and keyboard events (Enter/Space) to prevent parent handler activation
    - Render the `Phone` icon from Lucide React with `aria-hidden="true"`
    - Apply minimum 44×44px touch target via `min-w-[44px] min-h-[44px]`
    - Use `bg-app-surface`, `text-app`, `border-app` semantic classes
    - Add hover/focus transition to `bg-app-elevated` with scale 1.02–1.05 over 150–200ms ease-out
    - Add visible focus indicator: 2px solid outline with 2px offset
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 7.3, 7.4_

  - [ ]* 1.2 Write property test for tel: URI preservation (Property 1)
    - **Property 1: tel: URI preserves phone value exactly**
    - Generate arbitrary phone strings (spaces, dashes, parentheses, plus signs, unicode, varying lengths)
    - Render CallButton, assert `href === "tel:" + phone`
    - Test file: `__tests__/mobile-contact-call/tel-uri-preservation.property.test.tsx`
    - **Validates: Requirements 1.1, 2.1, 3.4, 4.1, 4.2, 4.3**

  - [ ]* 1.3 Write property test for accessible label format and truncation (Property 4)
    - **Property 4: Accessible label format and truncation**
    - Generate arbitrary name strings (0–300 chars), render CallButton
    - Assert `aria-label` equals `"Call {name}"` when ≤100 chars, or is truncated to 100 chars ending with ellipsis
    - Assert label never exceeds 100 characters
    - Test file: `__tests__/mobile-contact-call/accessible-label-truncation.property.test.tsx`
    - **Validates: Requirements 1.5, 2.5, 5.1, 5.6**

  - [ ]* 1.4 Write unit tests for CallButton visual design and behavior
    - Test Phone icon renders from Lucide React
    - Test correct design system classes are applied
    - Test hover/focus classes present
    - Test focus ring classes (2px outline, 2px offset)
    - Test 44×44px minimum touch target classes
    - Test keyboard activation (Enter/Space) calls stopPropagation
    - Test file: `__tests__/mobile-contact-call/call-button.test.tsx`
    - _Requirements: 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2. Integrate CallButton into ContactCard and ContactListItem
  - [x] 2.1 Modify `ContactCard` in `components/contacts/contacts-view.tsx`
    - Add `isMobile: boolean` prop to ContactCard
    - Import `CallButton` from `@/components/contacts/call-button`
    - Render `CallButton` in the top-right action buttons row (alongside follow-up and favorite) when `isMobile && contact.phone`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Modify `ContactListItem` in `components/contacts/contacts-view.tsx`
    - Add `isMobile: boolean` prop to ContactListItem
    - Import `CallButton` from `@/components/contacts/call-button`
    - Render `CallButton` in the trailing action buttons (alongside follow-up, favorite, delete) when `isMobile && contact.phone`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.3 Modify `ContactsView` in `components/contacts/contacts-view.tsx`
    - Import `useIsMobile` from `@/hooks/use-is-mobile`
    - Call `useIsMobile()` once at the top of ContactsView
    - Pass `isMobile` prop to all `ContactCard` and `ContactListItem` instances
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

  - [ ]* 2.4 Write property test for click event non-propagation (Property 5)
    - **Property 5: Click events do not propagate to parent handlers**
    - Generate arbitrary contacts with phone, render in ContactCard and ContactListItem
    - Simulate click on CallButton, assert `stopPropagation` called and `onSelect` not invoked
    - Test file: `__tests__/mobile-contact-call/click-non-propagation.property.test.tsx`
    - **Validates: Requirements 1.4, 2.4, 7.1, 7.2, 7.3**

  - [ ]* 2.5 Write property test for non-mobile viewport suppression (Property 2)
    - **Property 2: Call button is not rendered on non-mobile viewports**
    - Generate arbitrary contacts, render ContactCard and ContactListItem with `isMobile=false`
    - Assert no call button in DOM
    - Test file: `__tests__/mobile-contact-call/non-mobile-suppression.property.test.tsx`
    - **Validates: Requirements 1.2, 2.2, 3.2**

  - [ ]* 2.6 Write property test for null phone suppression (Property 3)
    - **Property 3: Call button is not rendered when phone is null**
    - Generate arbitrary contacts with `phone=null`, render with both mobile and desktop
    - Assert no call button in DOM
    - Test file: `__tests__/mobile-contact-call/null-phone-suppression.property.test.tsx`
    - **Validates: Requirements 1.3, 2.3, 3.3, 4.4, 5.5**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Integrate CallButton into ContactDetail
  - [x] 4.1 Modify `ContactDetail` in `components/contacts/contact-detail.tsx`
    - Import `useIsMobile` from `@/hooks/use-is-mobile`
    - Import `CallButton` from `@/components/contacts/call-button`
    - Call `useIsMobile()` inside ContactDetail
    - Render `CallButton` inline within the phone number row in view mode when `isMobile && contact.phone && !isEditing`
    - Do not render CallButton in edit mode or when phone is null
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.2 Write property test for edit mode suppression (Property 6)
    - **Property 6: Edit mode suppresses call button in ContactDetail**
    - Generate arbitrary contacts with non-null phone, render ContactDetail in edit mode
    - Assert no call button in DOM regardless of viewport size
    - Test file: `__tests__/mobile-contact-call/edit-mode-suppression.property.test.tsx`
    - **Validates: Requirements 3.5**

  - [ ]* 4.3 Write integration tests for full ContactsView
    - Test full ContactsView renders call buttons only on mobile for contacts with phone numbers
    - Test clicking call button in ContactCard does not open detail sheet
    - Test clicking call button in ContactListItem does not open detail sheet
    - Test file: `__tests__/mobile-contact-call/contacts-view-integration.test.tsx`
    - _Requirements: 1.1, 1.4, 2.1, 2.4, 7.1, 7.2_

- [x] 5. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The `useIsMobile` hook already exists at `hooks/use-is-mobile.ts` — no new hook creation needed
- No database migrations, API routes, or server-side changes are required for this feature

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["2.4", "2.5", "2.6"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3"] }
  ]
}
```
