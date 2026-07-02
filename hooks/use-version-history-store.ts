"use client"

import { create } from "zustand"

type VersionHistoryState = {
  isOpen: boolean
  selectedRevisionIds: string[] // for diff comparison (max 2)
  compareMode: boolean
  expandedGroups: Set<string>
  open: () => void
  close: () => void
  toggleCompareMode: () => void
  selectForCompare: (revisionId: string) => void
  clearSelection: () => void
  toggleGroup: (groupId: string) => void
}

export const useVersionHistoryStore = create<VersionHistoryState>((set) => ({
  isOpen: false,
  selectedRevisionIds: [],
  compareMode: false,
  expandedGroups: new Set(),

  open: () => set({ isOpen: true }),

  close: () => set({ isOpen: false, compareMode: false, selectedRevisionIds: [] }),

  toggleCompareMode: () =>
    set((state) => ({
      compareMode: !state.compareMode,
      selectedRevisionIds: !state.compareMode ? state.selectedRevisionIds : [],
    })),

  selectForCompare: (revisionId) =>
    set((state) => {
      const current = state.selectedRevisionIds
      if (current.includes(revisionId)) {
        return { selectedRevisionIds: current.filter((id) => id !== revisionId) }
      }
      if (current.length >= 2) {
        return { selectedRevisionIds: [current[1], revisionId] }
      }
      return { selectedRevisionIds: [...current, revisionId] }
    }),

  clearSelection: () => set({ selectedRevisionIds: [] }),

  toggleGroup: (groupId) =>
    set((state) => {
      const next = new Set(state.expandedGroups)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return { expandedGroups: next }
    }),
}))
