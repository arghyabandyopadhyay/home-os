"use client"

import { create } from "zustand"
import type { CollaboratorPresence, ConnectionStatus } from "@/types/collaboration"

type CollaborationState = {
  status: ConnectionStatus
  collaborators: CollaboratorPresence[]
  synced: boolean
  setStatus: (status: ConnectionStatus) => void
  setCollaborators: (collaborators: CollaboratorPresence[]) => void
  setSynced: (synced: boolean) => void
  reset: () => void
}

const DEFAULT_STATE = {
  status: "disconnected" as ConnectionStatus,
  collaborators: [] as CollaboratorPresence[],
  synced: false,
}

export const useCollaborationStore = create<CollaborationState>((set) => ({
  ...DEFAULT_STATE,

  setStatus: (status) => set({ status }),

  setCollaborators: (collaborators) => set({ collaborators }),

  setSynced: (synced) => set({ synced }),

  reset: () => set({ ...DEFAULT_STATE }),
}))
