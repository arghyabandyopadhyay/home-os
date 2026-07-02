"use client"

import { create } from "zustand"
import type { Workspace, WorkspaceRole, PendingInvitation } from "@/types/workspace"

const STORAGE_KEY = "home-os:active-workspace"

function getStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null
  } catch {
    return null
  }
}

function persistWorkspaceId(id: string | null): void {
  try {
    const storage = getStorage()
    if (!storage) return
    if (id) {
      storage.setItem(STORAGE_KEY, id)
    } else {
      storage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Graceful fallback — continue with in-memory only
  }
}

function loadPersistedWorkspaceId(): string | null {
  try {
    const storage = getStorage()
    if (!storage) return null
    return storage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

type WorkspaceState = {
  activeWorkspaceId: string | null
  workspaces: Workspace[]
  pendingInvitations: PendingInvitation[]
  isLoading: boolean

  // Derived
  activeWorkspace: Workspace | null
  activeRole: WorkspaceRole | null

  // Actions
  setActiveWorkspaceId: (id: string) => void
  setWorkspaces: (workspaces: Workspace[]) => void
  setPendingInvitations: (invitations: PendingInvitation[]) => void
  addWorkspace: (workspace: Workspace) => void
  removeWorkspace: (id: string) => void
  setLoading: (loading: boolean) => void
  initialize: () => void
}

function deriveWorkspace(workspaces: Workspace[], activeWorkspaceId: string | null) {
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) ?? null
  const activeRole: WorkspaceRole | null = activeWorkspace?.role ?? null
  return { activeWorkspace, activeRole }
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  activeWorkspaceId: null,
  workspaces: [],
  pendingInvitations: [],
  isLoading: true,

  // Derived (computed on state changes)
  activeWorkspace: null,
  activeRole: null,

  setActiveWorkspaceId: (id) => {
    const { workspaces } = get()
    const { activeWorkspace, activeRole } = deriveWorkspace(workspaces, id)
    persistWorkspaceId(id)
    set({ activeWorkspaceId: id, activeWorkspace, activeRole })
  },

  setWorkspaces: (workspaces) => {
    const { activeWorkspaceId } = get()
    const { activeWorkspace, activeRole } = deriveWorkspace(workspaces, activeWorkspaceId)
    set({ workspaces, activeWorkspace, activeRole })
  },

  setPendingInvitations: (invitations) => set({ pendingInvitations: invitations }),

  addWorkspace: (workspace) => {
    const { workspaces, activeWorkspaceId } = get()
    const updated = [...workspaces, workspace]
    const { activeWorkspace, activeRole } = deriveWorkspace(updated, activeWorkspaceId)
    set({ workspaces: updated, activeWorkspace, activeRole })
  },

  removeWorkspace: (id) => {
    const { workspaces, activeWorkspaceId } = get()
    const updated = workspaces.filter((w) => w.id !== id)

    // If removing the active workspace, fall back to personal workspace
    let newActiveId = activeWorkspaceId
    if (activeWorkspaceId === id) {
      const personal = updated.find((w) => w.type === "personal")
      newActiveId = personal?.id ?? updated[0]?.id ?? null
      persistWorkspaceId(newActiveId)
    }

    const { activeWorkspace, activeRole } = deriveWorkspace(updated, newActiveId)
    set({
      workspaces: updated,
      activeWorkspaceId: newActiveId,
      activeWorkspace,
      activeRole,
    })
  },

  setLoading: (loading) => set({ isLoading: loading }),

  initialize: () => {
    const persistedId = loadPersistedWorkspaceId()
    if (persistedId) {
      const { workspaces } = get()
      // If workspaces are already loaded, validate the persisted ID
      if (workspaces.length > 0) {
        const exists = workspaces.some((w) => w.id === persistedId)
        if (exists) {
          const { activeWorkspace, activeRole } = deriveWorkspace(workspaces, persistedId)
          set({ activeWorkspaceId: persistedId, activeWorkspace, activeRole })
        } else {
          // Persisted ID no longer valid — fall back to personal workspace
          const personal = workspaces.find((w) => w.type === "personal")
          const fallbackId = personal?.id ?? workspaces[0]?.id ?? null
          persistWorkspaceId(fallbackId)
          const { activeWorkspace, activeRole } = deriveWorkspace(workspaces, fallbackId)
          set({ activeWorkspaceId: fallbackId, activeWorkspace, activeRole })
        }
      } else {
        // Workspaces not loaded yet — store persisted ID, derivation will happen on setWorkspaces
        set({ activeWorkspaceId: persistedId })
      }
    }
  },
}))
