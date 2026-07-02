"use client"

import { useEffect, useRef, useState } from "react"
import { useWorkspaces } from "@/hooks/queries/use-workspaces"
import { usePendingInvitations } from "@/hooks/queries/use-invitations"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"

type WorkspaceProviderProps = {
  children: React.ReactNode
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { data: workspaces, isSuccess: workspacesLoaded } = useWorkspaces()
  const { data: invitations } = usePendingInvitations()

  const store = useWorkspaceStore()
  const initializedRef = useRef(false)
  const previousWorkspaceNameRef = useRef<string | null>(null)
  const [announcement, setAnnouncement] = useState("")

  // Initialize store on first mount — reads persisted workspace ID from localStorage
  useEffect(() => {
    if (!initializedRef.current) {
      store.initialize()
      initializedRef.current = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync workspace list into the store once loaded
  useEffect(() => {
    if (workspacesLoaded && workspaces) {
      store.setWorkspaces(workspaces)

      // If no active workspace after initialization, fall back to Personal
      const { activeWorkspaceId } = useWorkspaceStore.getState()
      if (!activeWorkspaceId && workspaces.length > 0) {
        const personal = workspaces.find((w) => w.type === "personal")
        const fallbackId = personal?.id ?? workspaces[0]?.id
        if (fallbackId) {
          store.setActiveWorkspaceId(fallbackId)
        }
      }

      // Mark loading complete
      store.setLoading(false)
    }
  }, [workspacesLoaded, workspaces]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync pending invitations into the store
  useEffect(() => {
    if (invitations) {
      store.setPendingInvitations(invitations)
    }
  }, [invitations]) // eslint-disable-line react-hooks/exhaustive-deps

  // Track workspace name changes for ARIA announcement
  const activeWorkspaceName = store.activeWorkspace?.name ?? null

  useEffect(() => {
    if (activeWorkspaceName && previousWorkspaceNameRef.current !== null) {
      // Only announce when switching (not on initial load)
      if (previousWorkspaceNameRef.current !== activeWorkspaceName) {
        setAnnouncement(`Switched to ${activeWorkspaceName}`)
      }
    }
    previousWorkspaceNameRef.current = activeWorkspaceName
  }, [activeWorkspaceName])

  return (
    <>
      {children}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </>
  )
}
