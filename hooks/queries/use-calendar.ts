import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClientApiClient } from "@/lib/api-client"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"
import type { CalendarEvent } from "@/types/calendar"

const api = createClientApiClient()

export const calendarKeys = {
  all: (workspaceId: string) => ["calendar", workspaceId] as const,
  events: (workspaceId: string, year: number, month: number) =>
    [...calendarKeys.all(workspaceId), "events", year, month] as const,
  connection: (workspaceId: string) =>
    [...calendarKeys.all(workspaceId), "connection"] as const,
}

export function useCalendarEvents(year: number, month: number) {
  const { activeWorkspaceId } = useWorkspaceStore()

  return useQuery({
    queryKey: calendarKeys.events(activeWorkspaceId ?? "", year, month),
    queryFn: () => api.get<CalendarEvent[]>("/calendar/events", { params: { year, month } }),
    enabled: !!activeWorkspaceId,
  })
}

export function useCalendarConnection() {
  const { activeWorkspaceId } = useWorkspaceStore()

  return useQuery({
    queryKey: calendarKeys.connection(activeWorkspaceId ?? ""),
    queryFn: () => api.get<{ connected: boolean }>("/calendar/connection"),
    enabled: !!activeWorkspaceId,
  })
}

export function useConnectGoogleCalendar() {
  const { activeWorkspaceId } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<{ url: string }>("/calendar/connect"),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: calendarKeys.connection(activeWorkspaceId) })
      }
    },
  })
}

export function useDisconnectGoogleCalendar() {
  const { activeWorkspaceId } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<{ success: boolean }>("/calendar/disconnect"),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: calendarKeys.connection(activeWorkspaceId) })
        queryClient.invalidateQueries({ queryKey: calendarKeys.all(activeWorkspaceId) })
      }
    },
  })
}

export function useSyncGoogleCalendar() {
  const { activeWorkspaceId } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<{ synced: number }>("/calendar/sync"),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: calendarKeys.all(activeWorkspaceId) })
      }
    },
  })
}
