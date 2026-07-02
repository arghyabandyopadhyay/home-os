import * as Y from "yjs"
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness"
import type { ConnectionManager } from "./connection-manager"
import type { ConnectionStatus } from "@/types/collaboration"

export type SignalRProviderConfig = {
  userId: string
  displayName: string
  avatarUrl: string | null
  color: string
}

export class SignalRProvider {
  doc: Y.Doc
  awareness: Awareness
  private synced = false
  private connectionManager: ConnectionManager
  private noteId: string
  private config: SignalRProviderConfig
  private updateHandler: ((update: Uint8Array, origin: unknown) => void) | null = null
  private awarenessChangeHandler:
    | ((changes: { added: number[]; updated: number[]; removed: number[] }, origin: string | null) => void)
    | null = null

  constructor(
    doc: Y.Doc,
    connectionManager: ConnectionManager,
    noteId: string,
    config: SignalRProviderConfig
  ) {
    this.doc = doc
    this.connectionManager = connectionManager
    this.noteId = noteId
    this.config = config
    this.awareness = new Awareness(doc)

    // Set local awareness state with user identity
    this.awareness.setLocalState({
      user: {
        id: config.userId,
        name: config.displayName,
        avatar: config.avatarUrl,
        color: config.color,
      },
      cursor: null,
    })
  }

  /** Start synchronization — request full doc state from server */
  async connect(): Promise<void> {
    const connection = this.connectionManager.getConnection()
    if (!connection) return

    // Register hub event handlers for sync protocol
    connection.on("SyncStep2", (data: { update: number[] | Uint8Array }) => {
      const update = new Uint8Array(data.update)
      Y.applyUpdate(this.doc, update)
      this.synced = true
    })

    // Incoming remote document deltas
    connection.on("DocUpdate", (data: { update: number[] | Uint8Array; senderId: string }) => {
      const update = new Uint8Array(data.update)
      Y.applyUpdate(this.doc, update, "remote")
    })

    // Incoming remote awareness updates
    connection.on("AwarenessUpdate", (data: { update: number[] | Uint8Array; senderId: string }) => {
      const update = new Uint8Array(data.update)
      applyAwarenessUpdate(this.awareness, update, "remote")
    })

    // Send initial sync request with local state vector
    const stateVector = Y.encodeStateVector(this.doc)
    await connection.invoke("SyncStep1", {
      noteId: this.noteId,
      stateVector: Array.from(stateVector),
    })

    // Subscribe to local doc updates → broadcast to hub
    this.updateHandler = (update: Uint8Array, origin: unknown) => {
      // Don't echo remote updates back to the server
      if (origin === "remote") return

      const conn = this.connectionManager.getConnection()
      if (conn && this.connectionManager.getStatus() === ("connected" as ConnectionStatus)) {
        conn
          .invoke("DocUpdate", {
            noteId: this.noteId,
            update: Array.from(update),
          })
          .catch(() => {
            // Silently fail — offline queue in the hook layer handles persistence
          })
      }
    }
    this.doc.on("update", this.updateHandler)

    // Subscribe to local awareness changes → broadcast to hub
    this.awarenessChangeHandler = (
      _changes: { added: number[]; updated: number[]; removed: number[] },
      origin: string | null
    ) => {
      // Don't echo remote awareness updates back
      if (origin === "remote") return

      const conn = this.connectionManager.getConnection()
      if (conn && this.connectionManager.getStatus() === ("connected" as ConnectionStatus)) {
        const awarenessUpdate = encodeAwarenessUpdate(this.awareness, [this.doc.clientID])
        conn
          .invoke("AwarenessUpdate", {
            noteId: this.noteId,
            update: Array.from(awarenessUpdate),
          })
          .catch(() => {
            // Silently fail
          })
      }
    }
    this.awareness.on("change", this.awarenessChangeHandler)
  }

  /** Stop synchronization, flush pending updates */
  disconnect(): void {
    // Remove local Y.Doc update handler
    if (this.updateHandler) {
      this.doc.off("update", this.updateHandler)
      this.updateHandler = null
    }

    // Remove awareness change handler
    if (this.awarenessChangeHandler) {
      this.awareness.off("change", this.awarenessChangeHandler)
      this.awarenessChangeHandler = null
    }

    // Remove self from awareness so other clients see us leave
    removeAwarenessStates(this.awareness, [this.doc.clientID], "local")

    // Unsubscribe from hub events
    const connection = this.connectionManager.getConnection()
    if (connection) {
      connection.off("SyncStep2")
      connection.off("DocUpdate")
      connection.off("AwarenessUpdate")
    }

    this.synced = false
  }

  /** Whether initial sync is complete */
  isSynced(): boolean {
    return this.synced
  }

  /** Destroy provider, clean up all listeners and awareness */
  destroy(): void {
    this.disconnect()
    this.awareness.destroy()
  }
}
