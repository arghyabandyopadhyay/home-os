import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClientApiClient } from "@/lib/api-client"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"
import type { Task } from "@/types/task"

const api = createClientApiClient()

export const taskKeys = {
  all: (workspaceId: string) => ["tasks", workspaceId] as const,
  detail: (workspaceId: string, id: string) => ["tasks", workspaceId, id] as const,
}

export function useTasks() {
  const { activeWorkspaceId } = useWorkspaceStore()

  return useQuery({
    queryKey: taskKeys.all(activeWorkspaceId ?? ""),
    queryFn: () => api.get<Task[]>("/tasks"),
    enabled: !!activeWorkspaceId,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspaceStore()

  return useMutation({
    mutationFn: (input: { title: string; priority?: string; due_date?: string }) =>
      api.post<Task>("/tasks", { body: input }),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: taskKeys.all(activeWorkspaceId) })
      }
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspaceStore()

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string; title?: string; completed?: boolean; priority?: string; due_date?: string }) =>
      api.patch<Task>(`/tasks/${id}`, { body: updates }),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: taskKeys.all(activeWorkspaceId) })
      }
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspaceStore()

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/tasks/${id}`),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: taskKeys.all(activeWorkspaceId) })
      }
    },
  })
}
