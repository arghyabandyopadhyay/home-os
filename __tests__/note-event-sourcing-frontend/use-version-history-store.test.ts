/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest"
import { useVersionHistoryStore } from "@/hooks/use-version-history-store"

/**
 * Unit tests for the version history Zustand store.
 * Validates: Requirements 1.1, 4.1
 */

describe("hooks/use-version-history-store", () => {
  beforeEach(() => {
    // Reset store state between tests
    const { close, clearSelection } = useVersionHistoryStore.getState()
    close()
    clearSelection()
    // Reset expandedGroups manually
    useVersionHistoryStore.setState({ expandedGroups: new Set() })
  })

  describe("initial state", () => {
    it("starts with panel closed", () => {
      expect(useVersionHistoryStore.getState().isOpen).toBe(false)
    })

    it("starts with empty selectedRevisionIds", () => {
      expect(useVersionHistoryStore.getState().selectedRevisionIds).toEqual([])
    })

    it("starts with compareMode off", () => {
      expect(useVersionHistoryStore.getState().compareMode).toBe(false)
    })

    it("starts with empty expandedGroups", () => {
      expect(useVersionHistoryStore.getState().expandedGroups.size).toBe(0)
    })
  })

  describe("open / close", () => {
    it("opens the panel", () => {
      useVersionHistoryStore.getState().open()
      expect(useVersionHistoryStore.getState().isOpen).toBe(true)
    })

    it("closes the panel", () => {
      useVersionHistoryStore.getState().open()
      useVersionHistoryStore.getState().close()
      expect(useVersionHistoryStore.getState().isOpen).toBe(false)
    })

    it("close resets compareMode", () => {
      useVersionHistoryStore.getState().open()
      useVersionHistoryStore.getState().toggleCompareMode()
      expect(useVersionHistoryStore.getState().compareMode).toBe(true)
      useVersionHistoryStore.getState().close()
      expect(useVersionHistoryStore.getState().compareMode).toBe(false)
    })

    it("close resets selectedRevisionIds", () => {
      useVersionHistoryStore.getState().open()
      useVersionHistoryStore.getState().selectForCompare("rev-1")
      useVersionHistoryStore.getState().selectForCompare("rev-2")
      useVersionHistoryStore.getState().close()
      expect(useVersionHistoryStore.getState().selectedRevisionIds).toEqual([])
    })
  })

  describe("toggleCompareMode", () => {
    it("enables compare mode", () => {
      useVersionHistoryStore.getState().toggleCompareMode()
      expect(useVersionHistoryStore.getState().compareMode).toBe(true)
    })

    it("disables compare mode on second toggle", () => {
      useVersionHistoryStore.getState().toggleCompareMode()
      useVersionHistoryStore.getState().toggleCompareMode()
      expect(useVersionHistoryStore.getState().compareMode).toBe(false)
    })

    it("clears selectedRevisionIds when disabling compare mode", () => {
      useVersionHistoryStore.getState().toggleCompareMode() // enable
      useVersionHistoryStore.getState().selectForCompare("rev-1")
      useVersionHistoryStore.getState().toggleCompareMode() // disable
      expect(useVersionHistoryStore.getState().selectedRevisionIds).toEqual([])
    })

    it("preserves selectedRevisionIds when enabling compare mode", () => {
      useVersionHistoryStore.getState().selectForCompare("rev-1")
      useVersionHistoryStore.getState().toggleCompareMode() // enable
      expect(useVersionHistoryStore.getState().selectedRevisionIds).toEqual(["rev-1"])
    })
  })

  describe("selectForCompare", () => {
    it("adds a revision to selection", () => {
      useVersionHistoryStore.getState().selectForCompare("rev-1")
      expect(useVersionHistoryStore.getState().selectedRevisionIds).toEqual(["rev-1"])
    })

    it("adds a second revision to selection", () => {
      useVersionHistoryStore.getState().selectForCompare("rev-1")
      useVersionHistoryStore.getState().selectForCompare("rev-2")
      expect(useVersionHistoryStore.getState().selectedRevisionIds).toEqual(["rev-1", "rev-2"])
    })

    it("removes oldest when adding a third (max 2 enforced)", () => {
      useVersionHistoryStore.getState().selectForCompare("rev-1")
      useVersionHistoryStore.getState().selectForCompare("rev-2")
      useVersionHistoryStore.getState().selectForCompare("rev-3")
      expect(useVersionHistoryStore.getState().selectedRevisionIds).toEqual(["rev-2", "rev-3"])
    })

    it("deselects a revision when already selected", () => {
      useVersionHistoryStore.getState().selectForCompare("rev-1")
      useVersionHistoryStore.getState().selectForCompare("rev-2")
      useVersionHistoryStore.getState().selectForCompare("rev-1")
      expect(useVersionHistoryStore.getState().selectedRevisionIds).toEqual(["rev-2"])
    })

    it("deselects the only selected revision", () => {
      useVersionHistoryStore.getState().selectForCompare("rev-1")
      useVersionHistoryStore.getState().selectForCompare("rev-1")
      expect(useVersionHistoryStore.getState().selectedRevisionIds).toEqual([])
    })
  })

  describe("clearSelection", () => {
    it("clears all selected revision IDs", () => {
      useVersionHistoryStore.getState().selectForCompare("rev-1")
      useVersionHistoryStore.getState().selectForCompare("rev-2")
      useVersionHistoryStore.getState().clearSelection()
      expect(useVersionHistoryStore.getState().selectedRevisionIds).toEqual([])
    })
  })

  describe("toggleGroup", () => {
    it("adds a group to expanded set", () => {
      useVersionHistoryStore.getState().toggleGroup("group-1")
      expect(useVersionHistoryStore.getState().expandedGroups.has("group-1")).toBe(true)
    })

    it("removes a group from expanded set on second toggle", () => {
      useVersionHistoryStore.getState().toggleGroup("group-1")
      useVersionHistoryStore.getState().toggleGroup("group-1")
      expect(useVersionHistoryStore.getState().expandedGroups.has("group-1")).toBe(false)
    })

    it("manages multiple groups independently", () => {
      useVersionHistoryStore.getState().toggleGroup("group-1")
      useVersionHistoryStore.getState().toggleGroup("group-2")
      expect(useVersionHistoryStore.getState().expandedGroups.has("group-1")).toBe(true)
      expect(useVersionHistoryStore.getState().expandedGroups.has("group-2")).toBe(true)

      useVersionHistoryStore.getState().toggleGroup("group-1")
      expect(useVersionHistoryStore.getState().expandedGroups.has("group-1")).toBe(false)
      expect(useVersionHistoryStore.getState().expandedGroups.has("group-2")).toBe(true)
    })
  })
})
