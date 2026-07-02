export { ConnectionManager } from "./connection-manager"
export type { ConnectionManagerConfig } from "./connection-manager"
export { SignalRProvider } from "./signalr-provider"
export type { SignalRProviderConfig } from "./signalr-provider"
export { OfflineStore } from "./offline-store"
export { getCollaboratorColor, hashUserId, COLLABORATOR_COLORS } from "./collaborator-colors"
export { migrateContent } from "./content-migration"

// Re-export collaboration types
export type {
  ConnectionStatus,
  CollaboratorPresence,
  CursorPosition,
  SelectionRange,
  CollaborationConfig,
  SignalRProviderEvents,
  OfflineUpdate,
} from "@/types/collaboration"
