import { useQuery } from "@tanstack/react-query"
import { createClientApiClient } from "@/lib/api-client"
import type { DocumentContent } from "@/types/document"

const api = createClientApiClient()

export const documentContentKeys = {
  detail: (id: string) => ["document-content", id] as const,
}

export function useDocumentContent(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: documentContentKeys.detail(documentId),
    queryFn: () => api.get<DocumentContent>(`/documents/${documentId}/content`),
    enabled,
    staleTime: 60_000,
  })
}
