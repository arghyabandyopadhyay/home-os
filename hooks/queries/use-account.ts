import { useMutation } from "@tanstack/react-query"
import { createClientApiClient } from "@/lib/api-client"

const api = createClientApiClient()

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => api.delete<void>("/account"),
  })
}
