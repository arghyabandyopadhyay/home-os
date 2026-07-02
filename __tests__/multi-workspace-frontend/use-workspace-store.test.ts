/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import type { Workspace, PendingInvitation } from "@/types/workspace"

/**
 * Unit tests for the workspace Zustand store.
 * Validates: Requirements 2.3, 2.4, 2.5, 6.5
 */

// Mock localStorage since jsdom 29+ removed it
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
})()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
})

// Import after localStorage mock is in place
const { useWorkspaceStore } = await import("@/hooks/use-workspace-store")

const mockPersonalWorkspace: Workspace = {
  id: "ws-personal-1",
  name: "Personal",
  type: "personal",
  role: "owner",
  memberCount: 1,
  createdAt: "2024-01-01T00:00:00Z",
}

const mockFamilyWorkspace: Workspace = {
  id: "ws-family-1",
  name: "Family",
  type: "family",
  role: "member",
  memberCount: 4,
  createdAt: "2024-02-01T00:00:00Z",
}

const mockSharedWorkspace: Workspace = {
  id: "ws-shared-1",
  name: "Team",
  type: "shared",
  role: "viewer",
  memberCount: 10,
  createdAt: "2024-03-01T00:00:00Z",
}

const mockInvitation: PendingInvitation = {
  id: "inv-1",
  workspaceId: "ws-new",
  workspaceName: "New Project",
  workspaceType: "shared",
  inviterName: "Jane",
  inviterEmail: "jane@example.com",
  invitedAt: "2024-04-01T00:00:00Z",
}

function resetStore() {
  useWorkspaceStore.setState({
    activeWorkspaceId: null,
    workspaces: [],
    pendingInvitations: [],
    isLoading: true,
    activeWorkspace: null,
    activeRole: null,
  })
}

describe("hooks/use-workspace-store", () => {
  beforeEach(() => {
    resetStore()
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe("initial state", () => {
    it("starts with null activeWorkspaceId", () => {
      expect(useWorkspaceStore.getState().activeWorkspaceId).toBeNull()
    })

    it("starts with empty workspaces", () => {
      expect(useWorkspaceStore.getState().workspaces).toEqual([])
    })

    it("starts with empty pendingInvitations", () => {
      expect(useWorkspaceStore.getState().pendingInvitations).toEqual([])
    })

    it("starts with isLoading true", () => {
      expect(useWorkspaceStore.getState().isLoading).toBe(true)
    })

    it("starts with null activeWorkspace", () => {
      expect(useWorkspaceStore.getState().activeWorkspace).toBeNull()
    })

    it("starts with null activeRole", () => {
      expect(useWorkspaceStore.getState().activeRole).toBeNull()
    })
  })

  describe("setActiveWorkspaceId", () => {
    it("updates activeWorkspaceId", () => {
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace, mockFamilyWorkspace])
      useWorkspaceStore.getState().setActiveWorkspaceId("ws-family-1")
      expect(useWorkspaceStore.getState().activeWorkspaceId).toBe("ws-family-1")
    })

    it("derives activeWorkspace from workspaces list", () => {
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace, mockFamilyWorkspace])
      useWorkspaceStore.getState().setActiveWorkspaceId("ws-family-1")
      expect(useWorkspaceStore.getState().activeWorkspace).toEqual(mockFamilyWorkspace)
    })

    it("derives activeRole from active workspace", () => {
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace, mockFamilyWorkspace])
      useWorkspaceStore.getState().setActiveWorkspaceId("ws-family-1")
      expect(useWorkspaceStore.getState().activeRole).toBe("member")
    })

    it("persists workspace ID to localStorage", () => {
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace])
      useWorkspaceStore.getState().setActiveWorkspaceId("ws-personal-1")
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "home-os:active-workspace",
        "ws-personal-1"
      )
    })

    it("sets activeWorkspace to null if ID not found in workspaces", () => {
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace])
      useWorkspaceStore.getState().setActiveWorkspaceId("nonexistent-id")
      expect(useWorkspaceStore.getState().activeWorkspace).toBeNull()
      expect(useWorkspaceStore.getState().activeRole).toBeNull()
    })
  })

  describe("setWorkspaces", () => {
    it("updates workspaces list", () => {
      const workspaces = [mockPersonalWorkspace, mockFamilyWorkspace]
      useWorkspaceStore.getState().setWorkspaces(workspaces)
      expect(useWorkspaceStore.getState().workspaces).toEqual(workspaces)
    })

    it("re-derives activeWorkspace when workspaces change", () => {
      useWorkspaceStore.setState({ activeWorkspaceId: "ws-personal-1" })
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace, mockFamilyWorkspace])
      expect(useWorkspaceStore.getState().activeWorkspace).toEqual(mockPersonalWorkspace)
      expect(useWorkspaceStore.getState().activeRole).toBe("owner")
    })

    it("sets activeWorkspace to null if active ID no longer in list", () => {
      useWorkspaceStore.setState({ activeWorkspaceId: "ws-removed" })
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace])
      expect(useWorkspaceStore.getState().activeWorkspace).toBeNull()
      expect(useWorkspaceStore.getState().activeRole).toBeNull()
    })
  })

  describe("setPendingInvitations", () => {
    it("updates pending invitations", () => {
      useWorkspaceStore.getState().setPendingInvitations([mockInvitation])
      expect(useWorkspaceStore.getState().pendingInvitations).toEqual([mockInvitation])
    })

    it("can set to empty array", () => {
      useWorkspaceStore.getState().setPendingInvitations([mockInvitation])
      useWorkspaceStore.getState().setPendingInvitations([])
      expect(useWorkspaceStore.getState().pendingInvitations).toEqual([])
    })
  })

  describe("addWorkspace", () => {
    it("appends workspace to the list", () => {
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace])
      useWorkspaceStore.getState().addWorkspace(mockFamilyWorkspace)
      expect(useWorkspaceStore.getState().workspaces).toHaveLength(2)
      expect(useWorkspaceStore.getState().workspaces[1]).toEqual(mockFamilyWorkspace)
    })

    it("re-derives activeWorkspace after adding", () => {
      useWorkspaceStore.setState({ activeWorkspaceId: "ws-family-1" })
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace])
      // activeWorkspace is null because ws-family-1 isn't in the list yet
      expect(useWorkspaceStore.getState().activeWorkspace).toBeNull()

      useWorkspaceStore.getState().addWorkspace(mockFamilyWorkspace)
      expect(useWorkspaceStore.getState().activeWorkspace).toEqual(mockFamilyWorkspace)
    })
  })

  describe("removeWorkspace", () => {
    it("removes workspace from the list", () => {
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace, mockFamilyWorkspace])
      useWorkspaceStore.getState().removeWorkspace("ws-family-1")
      expect(useWorkspaceStore.getState().workspaces).toHaveLength(1)
      expect(useWorkspaceStore.getState().workspaces[0]).toEqual(mockPersonalWorkspace)
    })

    it("falls back to personal workspace when active is removed", () => {
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace, mockFamilyWorkspace])
      useWorkspaceStore.getState().setActiveWorkspaceId("ws-family-1")
      useWorkspaceStore.getState().removeWorkspace("ws-family-1")

      expect(useWorkspaceStore.getState().activeWorkspaceId).toBe("ws-personal-1")
      expect(useWorkspaceStore.getState().activeWorkspace).toEqual(mockPersonalWorkspace)
    })

    it("persists fallback ID to localStorage when active is removed", () => {
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace, mockFamilyWorkspace])
      useWorkspaceStore.getState().setActiveWorkspaceId("ws-family-1")
      vi.clearAllMocks()
      useWorkspaceStore.getState().removeWorkspace("ws-family-1")

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "home-os:active-workspace",
        "ws-personal-1"
      )
    })

    it("does not change activeWorkspaceId when removing a non-active workspace", () => {
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace, mockFamilyWorkspace])
      useWorkspaceStore.getState().setActiveWorkspaceId("ws-personal-1")
      useWorkspaceStore.getState().removeWorkspace("ws-family-1")

      expect(useWorkspaceStore.getState().activeWorkspaceId).toBe("ws-personal-1")
    })
  })

  describe("setLoading", () => {
    it("sets isLoading to false", () => {
      useWorkspaceStore.getState().setLoading(false)
      expect(useWorkspaceStore.getState().isLoading).toBe(false)
    })

    it("sets isLoading to true", () => {
      useWorkspaceStore.getState().setLoading(false)
      useWorkspaceStore.getState().setLoading(true)
      expect(useWorkspaceStore.getState().isLoading).toBe(true)
    })
  })

  describe("initialize", () => {
    it("reads persisted workspace ID from localStorage", () => {
      localStorageMock.setItem("home-os:active-workspace", "ws-personal-1")
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace, mockFamilyWorkspace])
      useWorkspaceStore.getState().initialize()

      expect(useWorkspaceStore.getState().activeWorkspaceId).toBe("ws-personal-1")
      expect(useWorkspaceStore.getState().activeWorkspace).toEqual(mockPersonalWorkspace)
    })

    it("falls back to personal workspace if persisted ID not in list", () => {
      localStorageMock.setItem("home-os:active-workspace", "ws-deleted")
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace, mockFamilyWorkspace])
      useWorkspaceStore.getState().initialize()

      expect(useWorkspaceStore.getState().activeWorkspaceId).toBe("ws-personal-1")
      expect(useWorkspaceStore.getState().activeWorkspace).toEqual(mockPersonalWorkspace)
    })

    it("persists fallback ID when original is invalid", () => {
      localStorageMock.setItem("home-os:active-workspace", "ws-deleted")
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace])
      vi.clearAllMocks()
      useWorkspaceStore.getState().initialize()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "home-os:active-workspace",
        "ws-personal-1"
      )
    })

    it("stores persisted ID even when workspaces not yet loaded", () => {
      localStorageMock.setItem("home-os:active-workspace", "ws-personal-1")
      useWorkspaceStore.getState().initialize()

      expect(useWorkspaceStore.getState().activeWorkspaceId).toBe("ws-personal-1")
    })

    it("does nothing when no persisted ID exists", () => {
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace])
      useWorkspaceStore.getState().initialize()

      expect(useWorkspaceStore.getState().activeWorkspaceId).toBeNull()
    })
  })

  describe("derived state — activeRole", () => {
    it("returns owner for personal workspace", () => {
      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace])
      useWorkspaceStore.getState().setActiveWorkspaceId("ws-personal-1")
      expect(useWorkspaceStore.getState().activeRole).toBe("owner")
    })

    it("returns member for family workspace", () => {
      useWorkspaceStore.getState().setWorkspaces([mockFamilyWorkspace])
      useWorkspaceStore.getState().setActiveWorkspaceId("ws-family-1")
      expect(useWorkspaceStore.getState().activeRole).toBe("member")
    })

    it("returns viewer for shared workspace with viewer role", () => {
      useWorkspaceStore.getState().setWorkspaces([mockSharedWorkspace])
      useWorkspaceStore.getState().setActiveWorkspaceId("ws-shared-1")
      expect(useWorkspaceStore.getState().activeRole).toBe("viewer")
    })
  })

  describe("localStorage graceful degradation", () => {
    it("continues operating if localStorage.setItem throws", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("QuotaExceededError")
      })

      useWorkspaceStore.getState().setWorkspaces([mockPersonalWorkspace])
      // Should not throw
      useWorkspaceStore.getState().setActiveWorkspaceId("ws-personal-1")
      expect(useWorkspaceStore.getState().activeWorkspaceId).toBe("ws-personal-1")
    })

    it("handles localStorage.getItem throwing during initialize", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("SecurityError")
      })

      // Should not throw
      useWorkspaceStore.getState().initialize()
      expect(useWorkspaceStore.getState().activeWorkspaceId).toBeNull()
    })
  })
})
