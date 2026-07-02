"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef, useEffect } from "react"
import { createClientApiClient } from "@/lib/api-client"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"
import { documentKeys } from "@/hooks/queries/use-documents"
import type { Document } from "@/types/document"

const api = createClientApiClient()

export function useDocumentStatusPoller(documents: Document[]) {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspaceStore()
  const consecutiveFailuresRef = useRef(0)

  const hasActiveProcessing = documents.some(
    (doc) => doc.processing.status === "pending" || doc.processing.status === "processing"
  )

  const activeIds = documents
    .filter((doc) => doc.processing.status === "pending" || doc.processing.status === "processing")
    .map((doc) => doc.id)

  const query = useQuery({
    queryKey: ["document-status", activeIds],
    queryFn: async () => {
      const result = await api.get<Document[]>("/documents/status", {
        params: { ids: activeIds.join(",") },
      })
      // Reset failure counter on success
      consecutiveFailuresRef.current = 0
      // Update documents cache
      if (activeWorkspaceId) {
        queryClient.setQueryData<Document[]>(
          documentKeys.all(activeWorkspaceId),
          (prev) =>
            prev?.map((doc) => {
              const updated = result.find((u) => u.id === doc.id)
              return updated ?? doc
            }) ?? []
        )
      }
      return result
    },
    enabled: hasActiveProcessing && activeIds.length > 0,
    refetchInterval: consecutiveFailuresRef.current >= 3 ? false : 5_000,
    refetchIntervalInBackground: false,
    retry: false,
  })

  // Track consecutive failures via effect on error state changes
  useEffect(() => {
    if (query.isError) {
      consecutiveFailuresRef.current += 1
    }
  }, [query.isError, query.dataUpdatedAt, query.errorUpdatedAt])

  return {
    ...query,
    consecutiveFailures: consecutiveFailuresRef.current,
    isPollPaused: consecutiveFailuresRef.current >= 3,
  }
}
