"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import * as Y from "yjs"
import { Awareness } from "y-protocols/awareness"
import {
  ConnectionManager,
  SignalRProvider,
  OfflineStore,
  getCollaboratorColor,
} from "@/lib/collaboration"
import type { CollaboratorPresence, ConnectionStatus } from "@/types/collaboration"
import { useCollaborationStore } from "./use-collaboration-store"

export type UseCollaborationOptions = {
  noteId: string
  userId: string
  displayName: string
  avatarUrl: string | null
  token: string
  onTokenRefresh: () => Promise<string>
}

export type UseCollaborationReturn = {
  /** Yjs document instance for TipTap binding */
  ydoc: Y.Doc
  /** Awareness instance for cursor/presence binding */
  awareness: Awareness
  /** Current connection status */
  status: ConnectionStatus
  /** List of current collaborators */
  collaborators: CollaboratorPresence[]
  /** Whether initial document sync is complete */
  synced: boolean
  /** Trigger manual reconnection */
  reconnect: () => Promise<void>
}

const HUB_URL = process.env.NEXT_PUBLIC_COLLABORATION_HUB_URL ?? ""

export function useCollaboration(options: UseCollaborationOptions): UseCollaborationReturn {
  const { noteId, userId, displayName, avatarUrl, token, onTokenRefresh } = options

  // Use useState with lazy initializer for instances that are passed to TipTap
  // extensions during render — avoids "Cannot access refs during render" lint errors
  const [ydoc] = useState<Y.Doc>(() => new Y.Doc())
  const [awareness] = useState<Awareness>(() => new Awareness(ydoc))

  // Refs for instances that are only accessed in effects/callbacks
  const connectionManagerRef = useRef<ConnectionManager | null>(null)
  const providerRef = useRef<SignalRProvider | null>(null)
  const offlineStoreRef = useRef<OfflineStore | null>(null)
  const statusRef = useRef<ConnectionStatus>("disconnected")

  // Lazily initialize offline store ref
  if (offlineStoreRef.current === null) {
    offlineStoreRef.current = new OfflineStore()
  }

  // Local state for collaborators (derived from awareness)
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([])

  // Zustand store for UI-accessible state
  const { status, synced, setStatus, setCollaborators: setStoreCollaborators, setSynced, reset } =
    useCollaborationStore()

  // Derive collaborators from awareness states, filtering out self
  const deriveCollaborators = useCallback(
    (awarenessInstance: Awareness) => {
      const states = awarenessInstance.getStates()
      const result: CollaboratorPresence[] = []

      states.forEach((state, clientId) => {
        // Skip self
        if (clientId === ydoc.clientID) return
        if (!state.user) return

        const user = state.user as {
          id: string
          name: string
          avatar: string | null
          color: string
        }

        result.push({
          userId: user.id,
          displayName: user.name,
          avatarUrl: user.avatar,
          color: user.color,
          cursorPosition: state.cursor ?? null,
          selectionRange: state.cursor
            ? {
                from: Math.min(state.cursor.anchor, state.cursor.head),
                to: Math.max(state.cursor.anchor, state.cursor.head),
              }
            : null,
          lastActive: Date.now(),
        })
      })

      setCollaborators(result)
      setStoreCollaborators(result)
    },
    [ydoc, setStoreCollaborators]
  )

  // Handle status changes — update store and handle offline/reconnection logic
  const handleStatusChange = useCallback(
    (newStatus: ConnectionStatus) => {
      const previousStatus = statusRef.current
      statusRef.current = newStatus
      setStatus(newStatus)

      // On reconnection: replay pending updates from OfflineStore
      if (
        newStatus === "connected" &&
        (previousStatus === "reconnecting" || previousStatus === "connecting")
      ) {
        const offlineStore = offlineStoreRef.current
        const provider = providerRef.current

        if (offlineStore && provider) {
          offlineStore
            .getPendingUpdates(noteId)
            .then((pendingUpdates) => {
              if (pendingUpdates.length > 0) {
                const connection = connectionManagerRef.current?.getConnection()
                if (connection) {
                  const replayPromises = pendingUpdates.map((pendingUpdate) =>
                    connection
                      .invoke("DocUpdate", {
                        noteId,
                        update: Array.from(pendingUpdate.update),
                      })
                      .catch(() => {
                        // Silent failure — will retry on next reconnection
                      })
                  )
                  Promise.all(replayPromises).then(() => {
                    offlineStore.clearPendingUpdates(noteId)
                  })
                }
              }
            })
            .catch(() => {
              // Failed to read pending updates — not critical
            })
        }
      }
    },
    [noteId, setStatus]
  )

  // Reconnect function — exposed to consumers
  const reconnect = useCallback(async () => {
    const cm = connectionManagerRef.current
    if (cm) {
      await cm.reconnect()
    }
  }, [])

  // Main effect — setup and teardown collaboration instances
  useEffect(() => {
    const offlineStore = offlineStoreRef.current
    let destroyed = false

    // Track Y.Doc updates for offline queue
    const offlineUpdateHandler = (update: Uint8Array, origin: unknown) => {
      if (origin === "remote") return
      if (statusRef.current !== "connected") {
        offlineStore?.queueUpdate(noteId, update).catch(() => {
          // Silent failure
        })
      }
    }

    async function initialize() {
      const color = getCollaboratorColor(userId)

      // Create ConnectionManager
      const connectionManager = new ConnectionManager({
        hubUrl: HUB_URL,
        token,
        onStatusChange: handleStatusChange,
        onTokenRefresh,
      })
      connectionManagerRef.current = connectionManager

      // Create SignalRProvider
      const provider = new SignalRProvider(ydoc, connectionManager, noteId, {
        userId,
        displayName,
        avatarUrl,
        color,
      })
      providerRef.current = provider

      // Subscribe to awareness updates to derive collaborators
      const awarenessHandler = () => {
        if (!destroyed) {
          deriveCollaborators(provider.awareness)
        }
      }
      provider.awareness.on("change", awarenessHandler)

      // Subscribe to doc updates for offline queueing
      ydoc.on("update", offlineUpdateHandler)

      // Attempt connection
      try {
        await connectionManager.connect(noteId)
        await provider.connect()
        if (!destroyed) {
          setSynced(provider.isSynced())
        }
      } catch {
        // Connection failed — load from IndexedDB (offline/solo mode)
        if (!destroyed) {
          const cachedState = await offlineStore?.loadDocumentState(noteId)
          if (cachedState) {
            Y.applyUpdate(ydoc, cachedState)
          }
          setSynced(true) // Mark synced so editor renders with local data
        }
      }
    }

    initialize()

    // Cleanup on unmount
    return () => {
      destroyed = true

      // Remove offline update handler
      ydoc.off("update", offlineUpdateHandler)

      // Save current doc state to IndexedDB
      const state = Y.encodeStateAsUpdate(ydoc)
      offlineStore?.saveDocumentState(noteId, state).catch(() => {
        // Silent failure on save
      })

      // Disconnect and destroy provider
      const provider = providerRef.current
      if (provider) {
        provider.destroy()
        providerRef.current = null
      }

      // Disconnect connection manager
      const cm = connectionManagerRef.current
      if (cm) {
        cm.disconnect().catch(() => {
          // Silent failure on disconnect
        })
        connectionManagerRef.current = null
      }

      // Reset Zustand store
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, userId])

  return {
    ydoc,
    awareness,
    status,
    collaborators,
    synced,
    reconnect,
  }
}
