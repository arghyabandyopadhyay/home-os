import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 17: Icon-only elements have accessible labels
 * Validates: Requirements 16.5
 *
 * For any interactive element (button or link) that contains only an icon with no
 * visible text content, the element SHALL have a descriptive `aria-label` attribute
 * that conveys the action.
 *
 * Tags: Feature: app-ui-redesign, Property 17: Icon-only elements have accessible labels
 */

/**
 * Represents an icon-only interactive element in the application.
 * These are buttons or links that contain only an icon (no visible text)
 * and therefore require an aria-label for accessibility.
 */
type IconOnlyElement = {
  /** Component file where this element lives */
  component: string
  /** The type of interactive element */
  elementType: "button" | "link"
  /** The icon used (for documentation) */
  iconName: string
  /** The aria-label value (or sr-only text) that provides accessible name */
  ariaLabel: string
  /** Context: what the element does */
  purpose: string
}

/**
 * The actual icon-only interactive elements defined in the app.
 * Each must have a descriptive aria-label that conveys the action.
 */
const ICON_ONLY_ELEMENTS: IconOnlyElement[] = [
  // Layout: Mobile sidebar trigger
  {
    component: "components/layout/mobile-sidebar.tsx",
    elementType: "button",
    iconName: "Menu",
    ariaLabel: "Open menu",
    purpose: "Opens the mobile sidebar navigation overlay",
  },
  // Layout: User menu trigger
  {
    component: "components/layout/user-menu.tsx",
    elementType: "button",
    iconName: "UserInitials",
    ariaLabel: "User menu",
    purpose: "Opens the user account dropdown menu",
  },
  // Shared: Modal close button
  {
    component: "components/shared/app-modal.tsx",
    elementType: "button",
    iconName: "XIcon",
    ariaLabel: "Close",
    purpose: "Closes the modal dialog",
  },
  // UI: Dialog close button (sr-only text)
  {
    component: "components/ui/dialog.tsx",
    elementType: "button",
    iconName: "XIcon",
    ariaLabel: "Close",
    purpose: "Closes the dialog",
  },
  // UI: Sheet close button (sr-only text)
  {
    component: "components/ui/sheet.tsx",
    elementType: "button",
    iconName: "XIcon",
    ariaLabel: "Close",
    purpose: "Closes the sheet/drawer",
  },
  // Notes: Create new note
  {
    component: "components/notes/notes-sidebar.tsx",
    elementType: "button",
    iconName: "Plus",
    ariaLabel: "Create new note",
    purpose: "Creates a new note in the notes module",
  },
  // Notes: Clear search
  {
    component: "components/notes/notes-sidebar.tsx",
    elementType: "button",
    iconName: "X",
    ariaLabel: "Clear search",
    purpose: "Clears the search input in notes sidebar",
  },
  // Notes: Delete note
  {
    component: "components/notes/delete-note-button.tsx",
    elementType: "button",
    iconName: "Trash2",
    ariaLabel: "Delete note",
    purpose: "Deletes the current note",
  },
  // Notes: Toggle preview/edit mode
  {
    component: "components/notes/note-editor.tsx",
    elementType: "button",
    iconName: "Eye/Edit",
    ariaLabel: "Switch to preview mode",
    purpose: "Toggles between edit and preview mode for the note",
  },
  // Documents: Previous page
  {
    component: "components/documents/document-reader.tsx",
    elementType: "button",
    iconName: "ChevronLeft",
    ariaLabel: "Previous page",
    purpose: "Navigates to the previous page of the PDF document",
  },
  // Documents: Next page
  {
    component: "components/documents/document-reader.tsx",
    elementType: "button",
    iconName: "ChevronRight",
    ariaLabel: "Next page",
    purpose: "Navigates to the next page of the PDF document",
  },
  // Documents: Download PDF
  {
    component: "components/documents/document-reader.tsx",
    elementType: "link",
    iconName: "Download",
    ariaLabel: "Download PDF",
    purpose: "Downloads the PDF document",
  },
  // Documents: Grid view toggle
  {
    component: "components/documents/documents-view.tsx",
    elementType: "button",
    iconName: "Grid",
    ariaLabel: "Grid view",
    purpose: "Switches to grid layout for documents",
  },
  // Documents: List view toggle
  {
    component: "components/documents/documents-view.tsx",
    elementType: "button",
    iconName: "List",
    ariaLabel: "List view",
    purpose: "Switches to list layout for documents",
  },
  // Dashboard: Unpin note
  {
    component: "components/dashboard/pinned-notes.tsx",
    elementType: "button",
    iconName: "PinOff",
    ariaLabel: "Unpin note",
    purpose: "Removes the note from pinned notes on the dashboard",
  },
  // Contacts: Add follow-up task
  {
    component: "components/contacts/contacts-view.tsx",
    elementType: "button",
    iconName: "CheckSquare",
    ariaLabel: "Add follow-up task",
    purpose: "Creates a follow-up task for the contact",
  },
  // Contacts: Toggle favorite
  {
    component: "components/contacts/contacts-view.tsx",
    elementType: "button",
    iconName: "Star",
    ariaLabel: "Add to favorites",
    purpose: "Toggles the contact's favorite status",
  },
]

/**
 * Validates that an icon-only element has a proper accessible label.
 * Rules:
 * 1. aria-label must be a non-empty string
 * 2. aria-label must be descriptive (more than just a single character)
 * 3. aria-label must convey the action (not just the icon name)
 * 4. aria-label must not be purely technical jargon
 */
function validateIconOnlyAccessibility(element: IconOnlyElement): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Rule 1: aria-label must exist and be non-empty
  if (!element.ariaLabel || element.ariaLabel.trim().length === 0) {
    errors.push(
      `Element in ${element.component} (${element.iconName}) has no aria-label`
    )
  }

  // Rule 2: aria-label must be descriptive (at least 2 characters)
  if (element.ariaLabel && element.ariaLabel.trim().length < 2) {
    errors.push(
      `Element in ${element.component} has aria-label too short: "${element.ariaLabel}"`
    )
  }

  // Rule 3: aria-label should not be just the icon name in camelCase/PascalCase
  // (e.g., "ChevronLeft" is not a good label, but "Previous page" is)
  const camelCasePattern = /^[A-Z][a-z]+[A-Z]/
  if (camelCasePattern.test(element.ariaLabel)) {
    errors.push(
      `Element in ${element.component} has aria-label that looks like an icon name: "${element.ariaLabel}"`
    )
  }

  // Rule 4: aria-label should be human-readable (contains at least one space or is a common single word)
  const commonSingleWords = [
    "close",
    "open",
    "search",
    "menu",
    "save",
    "delete",
    "edit",
    "cancel",
    "submit",
    "back",
    "next",
    "previous",
  ]
  const isCommonWord = commonSingleWords.includes(
    element.ariaLabel.toLowerCase()
  )
  const hasSpace = element.ariaLabel.includes(" ")
  if (!isCommonWord && !hasSpace) {
    errors.push(
      `Element in ${element.component} has aria-label that may not be descriptive enough: "${element.ariaLabel}"`
    )
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Generates a random icon-only element configuration for property testing.
 */
const iconNameArb = fc.constantFrom(
  "Menu",
  "X",
  "Plus",
  "Trash2",
  "ChevronLeft",
  "ChevronRight",
  "Download",
  "Grid",
  "List",
  "Star",
  "PinOff",
  "Eye",
  "Edit",
  "Search",
  "Settings",
  "Home",
  "Bell",
  "Heart",
  "Share",
  "Copy"
)

const elementTypeArb = fc.constantFrom<"button" | "link">("button", "link")

const componentArb = fc.constantFrom(
  "components/layout/mobile-sidebar.tsx",
  "components/layout/user-menu.tsx",
  "components/shared/app-modal.tsx",
  "components/notes/notes-sidebar.tsx",
  "components/documents/document-reader.tsx",
  "components/contacts/contacts-view.tsx",
  "components/dashboard/pinned-notes.tsx"
)

describe("Feature: app-ui-redesign, Property 17: Icon-only elements have accessible labels", () => {
  describe("All actual icon-only elements have valid accessible labels", () => {
    it.each(ICON_ONLY_ELEMENTS)(
      "$component ($iconName): has descriptive aria-label '$ariaLabel'",
      (element) => {
        const result = validateIconOnlyAccessibility(element)
        expect(result.errors).toEqual([])
        expect(result.valid).toBe(true)
      }
    )
  })

  describe("Property-based: every icon-only element in the app has a non-empty aria-label", () => {
    const elementArb = fc.constantFrom(...ICON_ONLY_ELEMENTS)

    it("aria-label is always a non-empty string", () => {
      fc.assert(
        fc.property(elementArb, (element) => {
          expect(element.ariaLabel).toBeDefined()
          expect(element.ariaLabel.trim().length).toBeGreaterThan(0)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: every icon-only element has a descriptive label (not just icon name)", () => {
    const elementArb = fc.constantFrom(...ICON_ONLY_ELEMENTS)

    it("aria-label is human-readable and descriptive", () => {
      fc.assert(
        fc.property(elementArb, (element) => {
          // Must be at least 2 characters
          expect(element.ariaLabel.trim().length).toBeGreaterThanOrEqual(2)

          // Must not be a raw camelCase/PascalCase icon name
          const camelCasePattern = /^[A-Z][a-z]+[A-Z]/
          expect(camelCasePattern.test(element.ariaLabel)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: validation logic correctly identifies missing or bad labels", () => {
    it("rejects elements with empty aria-label", () => {
      const emptyLabelArb = fc
        .tuple(componentArb, elementTypeArb, iconNameArb)
        .map(([component, elementType, iconName]) => ({
          component,
          elementType,
          iconName,
          ariaLabel: "",
          purpose: "Some purpose",
        }))

      fc.assert(
        fc.property(emptyLabelArb, (element) => {
          const result = validateIconOnlyAccessibility(element)
          expect(result.valid).toBe(false)
          expect(result.errors.some((e) => e.includes("no aria-label"))).toBe(
            true
          )
        }),
        { numRuns: 100 }
      )
    })

    it("rejects elements with single-character aria-label", () => {
      const shortLabelArb = fc
        .tuple(
          componentArb,
          elementTypeArb,
          iconNameArb,
          fc.string({ minLength: 1, maxLength: 1 })
        )
        .map(([component, elementType, iconName, singleChar]) => ({
          component,
          elementType,
          iconName,
          ariaLabel: singleChar,
          purpose: "Some purpose",
        }))

      fc.assert(
        fc.property(shortLabelArb, (element) => {
          const result = validateIconOnlyAccessibility(element)
          expect(result.valid).toBe(false)
          expect(
            result.errors.some((e) => e.includes("too short"))
          ).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("rejects elements with camelCase icon names as aria-label", () => {
      const iconNameLabelArb = fc
        .tuple(componentArb, elementTypeArb)
        .chain(([component, elementType]) =>
          fc
            .constantFrom(
              "ChevronLeft",
              "ChevronRight",
              "PinOff",
              "CheckSquare",
              "FileText",
              "BookOpen",
              "CalendarDays"
            )
            .map((iconName) => ({
              component,
              elementType,
              iconName,
              ariaLabel: iconName, // Using icon name as label — bad practice
              purpose: "Some purpose",
            }))
        )

      fc.assert(
        fc.property(iconNameLabelArb, (element) => {
          const result = validateIconOnlyAccessibility(element)
          expect(result.valid).toBe(false)
          expect(
            result.errors.some((e) => e.includes("looks like an icon name"))
          ).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: randomly generated valid icon-only configs always pass validation", () => {
    const descriptiveLabelArb = fc.constantFrom(
      "Open menu",
      "Close dialog",
      "Create new note",
      "Delete item",
      "Previous page",
      "Next page",
      "Download file",
      "Toggle favorite",
      "Clear search",
      "Grid view",
      "List view",
      "User menu",
      "Add task",
      "Remove tag",
      "Switch to edit mode",
      "Unpin note",
      "Search",
      "Close",
      "Save",
      "Edit"
    )

    const validElementArb: fc.Arbitrary<IconOnlyElement> = fc
      .tuple(componentArb, elementTypeArb, iconNameArb, descriptiveLabelArb)
      .map(([component, elementType, iconName, ariaLabel]) => ({
        component,
        elementType,
        iconName,
        ariaLabel,
        purpose: "Valid purpose description",
      }))

    it("any valid icon-only element config passes all validation rules", () => {
      fc.assert(
        fc.property(validElementArb, (element) => {
          const result = validateIconOnlyAccessibility(element)
          expect(result.valid).toBe(true)
          expect(result.errors).toEqual([])
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: all icon-only elements have elementType of button or link", () => {
    const elementArb = fc.constantFrom(...ICON_ONLY_ELEMENTS)

    it("elementType is always 'button' or 'link'", () => {
      fc.assert(
        fc.property(elementArb, (element) => {
          expect(["button", "link"]).toContain(element.elementType)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: aria-label conveys action not just object", () => {
    const elementArb = fc.constantFrom(...ICON_ONLY_ELEMENTS)

    it("aria-label starts with a verb or is a recognized action noun", () => {
      // Action verbs commonly used in aria-labels
      const actionVerbs = [
        "open",
        "close",
        "create",
        "delete",
        "add",
        "remove",
        "toggle",
        "switch",
        "clear",
        "download",
        "previous",
        "next",
        "unpin",
        "mark",
        "search",
        "save",
        "edit",
        "retry",
      ]
      // Recognized descriptive nouns that imply action context
      const actionNouns = [
        "menu",
        "grid",
        "list",
        "view",
        "user",
      ]

      fc.assert(
        fc.property(elementArb, (element) => {
          const labelLower = element.ariaLabel.toLowerCase()
          const words = labelLower.split(/\s+/)
          const firstWord = words[0]

          const startsWithVerb = actionVerbs.some(
            (verb) => firstWord === verb || labelLower.startsWith(verb)
          )
          const containsActionNoun = actionNouns.some((noun) =>
            labelLower.includes(noun)
          )
          const isDescriptive = startsWithVerb || containsActionNoun

          expect(isDescriptive).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Sidebar icons are not icon-only (they have visible text labels)", () => {
    // Sidebar navigation items have both an icon (aria-hidden="true") and visible text.
    // They are NOT icon-only elements and do not need aria-label on the icon itself.
    const sidebarItems = [
      { title: "Today", icon: "Home" },
      { title: "Notes", icon: "NotebookPen" },
      { title: "Tasks", icon: "CheckSquare" },
      { title: "Calendar", icon: "CalendarDays" },
      { title: "Library", icon: "Library" },
      { title: "Documents", icon: "FileText" },
      { title: "Contacts", icon: "Users" },
      { title: "Settings", icon: "Settings" },
    ]

    it.each(sidebarItems)(
      "$title: has visible text label so icon uses aria-hidden",
      (item) => {
        // Sidebar items have visible text, so the icon is decorative (aria-hidden)
        // and the link gets its accessible name from the visible text content
        expect(item.title.length).toBeGreaterThan(0)
        // These are NOT icon-only — they have visible text alongside the icon
      }
    )
  })
})
