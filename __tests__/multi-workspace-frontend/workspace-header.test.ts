import { describe, it, expect, beforeEach } from "vitest"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"
import { getWorkspaceHeaders } from "@/lib/api-client/workspace-header"

describe("getWorkspaceHeaders", () => {
  beforeEach(() => {
    // Reset store state before each test
    useWorkspaceStore.setState({
      activeWorkspaceId: null,
      workspaces: [],
      pendingInvitations: [],
      isLoading: true,
      activeWorkspace: null,
      activeRole: null,
    })
  })

  it("returns empty object when no active workspace is set", () => {
    const headers = getWorkspaceHeaders()
    expect(headers).toEqual({})
  })

  it("returns X-Workspace-Id header when active workspace is set", () => {
    useWorkspaceStore.setState({ activeWorkspaceId: "workspace-123" })

    const headers = getWorkspaceHeaders()
    expect(headers).toEqual({ "X-Workspace-Id": "workspace-123" })
  })

  it("returns the current workspace ID from the store at call time", () => {
    useWorkspaceStore.setState({ activeWorkspaceId: "ws-aaa" })
    expect(getWorkspaceHeaders()).toEqual({ "X-Workspace-Id": "ws-aaa" })

    useWorkspaceStore.setState({ activeWorkspaceId: "ws-bbb" })
    expect(getWorkspaceHeaders()).toEqual({ "X-Workspace-Id": "ws-bbb" })
  })

  it("returns empty object when activeWorkspaceId is explicitly null", () => {
    useWorkspaceStore.setState({ activeWorkspaceId: null })
    const headers = getWorkspaceHeaders()
    expect(headers).toEqual({})
  })
})
