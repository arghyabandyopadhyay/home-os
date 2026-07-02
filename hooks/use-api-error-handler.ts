import { useCallback } from "react"
import { toast } from "sonner"
import type { ApiClientError } from "@/lib/api-client"

export function useApiErrorHandler() {
  return useCallback((error: ApiClientError) => {
    if (error.type === "network") {
      toast.error("Connection problem", {
        description: "Unable to reach the server. Check your internet connection.",
      })
      return
    }

    switch (error.code) {
      case "RATE_LIMITED":
        toast.error("Too many requests", {
          description: `Please wait ${error.retryAfter ?? 60} seconds before trying again.`,
        })
        break
      case "UNAUTHORIZED":
        // Middleware handles redirect — no toast needed
        break
      case "VALIDATION_ERROR":
        toast.error("Invalid input", { description: error.message })
        break
      default:
        toast.error("Something went wrong", { description: error.message })
    }
  }, [])
}
