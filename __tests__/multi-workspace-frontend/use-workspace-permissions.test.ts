import { describe, it, expect, beforeEach } from "vitest"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import { renderHook, act } from "@testing-library/react"
import type { Workspace } from "@/types/workspace"

const makeWorkspace = (role: "owner" | "member" | "viewer"): Workspace => ({
  id: `ws-${role}`,
  name: `${role} workspace`,
  type: "shared",
  role,
  memberCount: 3,
  createdAt: "2024-01-01T00:00:00Z",
})

describe("useWorkspacePermissions", () => {
  beforeEach(() => {
    const store = useWorkspaceStore.getState()
    store.setWorkspaces([])
  })

  it("returns all permissions false when no active workspace", () => {
    const { result } = renderHook(() => useWorkspacePermissions())

    expect(result.current.canCreate).toBe(false)
    expect(result.current.canEdit).toBe(false)
    expect(result.current.canDelete).toBe(false)
    expect(result.current.canManageMembers).toBe(false)
    expect(result.current.canManageWorkspace).toBe(false)
    expect(result.current.isReadOnly).toBe(false)
  })

  it("grants full permissions for owner role", () => {
    const ws = makeWorkspace("owner")
    act(() => {
      useWorkspaceStore.getState().setWorkspaces([ws])
      useWorkspaceStore.getState().setActiveWorkspaceId(ws.id)
    })

    const { result } = renderHook(() => useWorkspacePermissions())

    expect(result.current.canCreate).toBe(true)
    expect(result.current.canEdit).toBe(true)
    expect(result.current.canDelete).toBe(true)
    expect(result.current.canManageMembers).toBe(true)
    expect(result.current.canManageWorkspace).toBe(true)
    expect(result.current.isReadOnly).toBe(false)
  })

  it("grants CRUD but not management for member role", () => {
    const ws = makeWorkspace("member")
    act(() => {
      useWorkspaceStore.getState().setWorkspaces([ws])
      useWorkspaceStore.getState().setActiveWorkspaceId(ws.id)
    })

    const { result } = renderHook(() => useWorkspacePermissions())

    expect(result.current.canCreate).toBe(true)
    expect(result.current.canEdit).toBe(true)
    expect(result.current.canDelete).toBe(true)
    expect(result.current.canManageMembers).toBe(false)
    expect(result.current.canManageWorkspace).toBe(false)
    expect(result.current.isReadOnly).toBe(false)
  })

  it("grants read-only for viewer role", () => {
    const ws = makeWorkspace("viewer")
    act(() => {
      useWorkspaceStore.getState().setWorkspaces([ws])
      useWorkspaceStore.getState().setActiveWorkspaceId(ws.id)
    })

    const { result } = renderHook(() => useWorkspacePermissions())

    expect(result.current.canCreate).toBe(false)
    expect(result.current.canEdit).toBe(false)
    expect(result.current.canDelete).toBe(false)
    expect(result.current.canManageMembers).toBe(false)
    expect(result.current.canManageWorkspace).toBe(false)
    expect(result.current.isReadOnly).toBe(true)
  })
})
