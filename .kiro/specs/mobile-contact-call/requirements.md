# Requirements Document

## Introduction

This feature adds a tap-to-call action on contact cards when the app is viewed on a mobile device. Contacts with a phone number will display a prominent call button that initiates a phone call via the native `tel:` URI scheme. The call action is only visible on mobile viewports to keep the desktop experience uncluttered.

## Glossary

- **Contact_Card**: A UI card component displaying a contact's information in the contacts grid (favorites) or list (all contacts).
- **Contact_Detail**: The slide-out sheet that shows full contact details when a contact is selected.
- **Call_Button**: An interactive element that initiates a phone call using the `tel:` URI scheme.
- **Mobile_Viewport**: A viewport width below 768px, as detected by the existing `useIsMobile` hook.
- **Phone_Number**: The `phone` field stored on a contact record, which may be `null`.

## Requirements

### Requirement 1: Display Call Button on Contact Cards in Mobile Viewport

**User Story:** As a mobile user, I want to see a call button on contact cards that have a phone number, so that I can quickly call a contact without opening their details.

#### Acceptance Criteria

1. WHILE the viewport is a Mobile_Viewport, WHEN a Contact_Card is rendered with a non-null Phone_Number, THE Contact_Card SHALL display a Call_Button that is an anchor element with its `href` set to `tel:` followed by the contact's Phone_Number value.
2. WHILE the viewport is not a Mobile_Viewport, THE Contact_Card SHALL NOT display a Call_Button.
3. WHEN a Contact_Card has a null Phone_Number, THE Contact_Card SHALL NOT display a Call_Button regardless of viewport size.
4. WHEN the user activates the Call_Button, THE Contact_Card SHALL initiate the phone call action without opening the Contact_Detail sheet (the activation event SHALL NOT propagate to the card's select handler).
5. THE Call_Button SHALL have a minimum touch target size of 44×44 CSS pixels and SHALL include an accessible label indicating the call action and the contact's name.

### Requirement 2: Display Call Button on Contact List Items in Mobile Viewport

**User Story:** As a mobile user, I want to see a call button on contact list items that have a phone number, so that I can initiate a call from the contacts list.

#### Acceptance Criteria

1. WHILE the viewport is a Mobile_Viewport, WHEN a contact list item is rendered with a non-null Phone_Number, THE contact list item SHALL display a Call_Button that is an anchor element with its `href` set to `tel:` followed by the contact's Phone_Number value.
2. WHILE the viewport is not a Mobile_Viewport, THE contact list item SHALL NOT display a Call_Button.
3. WHEN a contact list item has a null Phone_Number, THE contact list item SHALL NOT display a Call_Button regardless of viewport size.
4. WHEN the user activates the Call_Button, THE contact list item SHALL initiate the phone call action without opening the Contact_Detail sheet (the activation event SHALL NOT propagate to the list item's select handler).
5. THE Call_Button SHALL have a minimum touch target size of 44×44 CSS pixels and SHALL include an accessible label indicating the call action and the contact's name.

### Requirement 3: Display Call Button in Contact Detail Sheet on Mobile Viewport

**User Story:** As a mobile user, I want to see a call button in the contact detail view when a phone number exists, so that I can call the contact from their detail sheet.

#### Acceptance Criteria

1. WHILE the viewport is a Mobile_Viewport, WHEN the Contact_Detail is open for a contact with a non-null Phone_Number and the Contact_Detail is in view mode (not edit mode), THE Contact_Detail SHALL display a Call_Button within the phone number field row, with a minimum touch target size of 44×44 CSS pixels, and the Call_Button SHALL have an accessible label indicating its purpose.
2. WHILE the viewport is not a Mobile_Viewport, THE Contact_Detail SHALL NOT display a Call_Button.
3. WHEN the Contact_Detail is open for a contact with a null Phone_Number, THE Contact_Detail SHALL NOT display a Call_Button regardless of viewport size.
4. WHEN the user activates the Call_Button, THE Contact_Detail SHALL initiate a phone call by navigating to a `tel:` URI containing the contact's Phone_Number value.
5. WHILE the Contact_Detail is in edit mode, THE Contact_Detail SHALL NOT display a Call_Button regardless of viewport size.

### Requirement 4: Call Button Initiates Phone Call via tel: URI

**User Story:** As a mobile user, I want tapping the call button to initiate a phone call, so that I can reach my contact without manually dialing.

#### Acceptance Criteria

1. WHEN a user activates the Call_Button, THE Call_Button SHALL navigate to a `tel:` URI containing the contact's Phone_Number.
2. THE Call_Button SHALL render as an anchor element (`<a>`) with an `href` attribute set to `tel:{Phone_Number}` and an accessible name that identifies the action and the contact (e.g., via `aria-label`).
3. THE Call_Button SHALL use the Phone_Number value exactly as stored in the contact record without modification.
4. IF the contact's Phone_Number is null, THEN THE system SHALL not render the Call_Button.
5. THE Call_Button SHALL have a minimum touch target size of 44×44 CSS pixels.

### Requirement 5: Call Button Accessibility

**User Story:** As a mobile user using assistive technology, I want the call button to be properly labeled, so that I can understand its purpose and activate it.

#### Acceptance Criteria

1. THE Call_Button SHALL have an accessible label in the format "Call {name}" where {name} is the contact's display name, with a maximum label length of 100 characters (truncated with ellipsis if the name exceeds the limit).
2. THE Call_Button SHALL meet the minimum touch target size of 44×44 CSS pixels.
3. THE Call_Button SHALL be reachable via the Tab key and activatable via both Enter and Space keys, triggering the same phone call action as a tap or click.
4. THE Call_Button SHALL have a visible focus indicator rendered as a 2px solid outline with a 2px offset that achieves a contrast ratio of at least 3:1 against adjacent background colors.
5. IF the contact has no phone number, THEN THE Call_Button SHALL not be rendered.
6. WHEN the Call_Button receives focus, THE Call_Button SHALL expose its accessible label to assistive technologies via the `aria-label` attribute.

### Requirement 6: Call Button Visual Design

**User Story:** As a mobile user, I want the call button to be visually prominent but calm, so that it is easy to find without disrupting the peaceful interface.

#### Acceptance Criteria

1. THE Call_Button SHALL use the Phone icon from Lucide React or Phosphor Icons and SHALL include an `aria-label` describing its action.
2. THE Call_Button SHALL use `bg-app-surface` for its background, `text-app` for the icon color, and `border-app` for its border, consistent with the app design system semantic token classes.
3. THE Call_Button SHALL NOT use saturated hue colors (e.g., red, orange) for its background, SHALL NOT apply box-shadow blur radius greater than 4px, and SHALL NOT use spring, bounce, or animations with duration exceeding 200ms.
4. WHEN a user hovers or focuses the Call_Button, THE Call_Button SHALL transition its background to `bg-app-elevated` with a scale of 1.02 to 1.05 over a duration of 150ms to 200ms using ease-out easing.
5. THE Call_Button SHALL have a minimum touch target size of 44×44 CSS pixels and SHALL display a visible focus indicator (2px solid outline with 2px offset) when focused via keyboard.

### Requirement 7: Call Button Does Not Interfere with Card Navigation

**User Story:** As a mobile user, I want tapping the call button to only initiate a call without also opening the contact detail sheet, so that actions are predictable.

#### Acceptance Criteria

1. WHEN a user activates the Call_Button on a Contact_Card, THE Contact_Card SHALL NOT open the Contact_Detail sheet.
2. WHEN a user activates the Call_Button on a contact list item, THE contact list item SHALL NOT open the Contact_Detail sheet.
3. THE Call_Button SHALL call `stopPropagation()` on the click event to prevent triggering parent click handlers.
4. THE Call_Button SHALL be keyboard-activatable via Enter or Space without triggering the parent container's keyboard handler.
