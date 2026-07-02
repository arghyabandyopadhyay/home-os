"use client"

import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: (failureCount, error) => {
              // Don't retry 403 errors
              if (error && typeof error === "object" && "status" in error && (error as { status: number }).status === 403) {
                return false
              }
              return failureCount < 3
            },
          },
        },
        mutationCache: new MutationCache({
          onError: (error) => {
            if (error && typeof error === "object" && "status" in error && (error as { status: number }).status === 403) {
              toast.error("You don't have permission to perform this action")
            }
          },
        }),
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
