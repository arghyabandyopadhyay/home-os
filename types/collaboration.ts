export type ConnectionStatus = "connected" | "connecting" | "reconnecting" | "disconnected"

export type CursorPosition = {
  /** Absolute position in the ProseMirror document */
  anchor: number
  head: number
}

export type SelectionRange = {
  from: number
  to: number
}

export type CollaboratorPresence = {
  userId: string
  displayName: string
  avatarUrl: string | null
  color: string
  cursorPosition: CursorPosition | null
  selectionRange: SelectionRange | null
  lastActive: number
}

export type CollaborationConfig = {
  noteId: string
  userId: string
  displayName: string
  avatarUrl: string | null
  token: string
}

export type SignalRProviderEvents = {
  onStatusChange: (status: ConnectionStatus) => void
  onSynced: (synced: boolean) => void
  onError: (error: Error) => void
}

export type OfflineUpdate = {
  id: string
  noteId: string
  update: Uint8Array
  timestamp: number
}
