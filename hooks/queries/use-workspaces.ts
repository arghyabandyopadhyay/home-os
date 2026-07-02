"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClientApiClient } from "@/lib/api-client"
import type {
  Workspace,
  WorkspaceMember,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  WorkspaceRole,
} from "@/types/workspace"

const api = createClientApiClient()

export const workspaceKeys = {
  all: ["workspaces"] as const,
  list: () => [...workspaceKeys.all, "list"] as const,
  detail: (id: string) => [...workspaceKeys.all, "detail", id] as const,
  members: (id: string) => [...workspaceKeys.all, "members", id] as const,
  invitees: (id: string) => [...workspaceKeys.all, "invitees", id] as const,
}

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.list(),
    queryFn: () => api.get<Workspace[]>("/workspaces"),
    staleTime: 60_000,
  })
}

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.members(workspaceId),
    queryFn: () =>
      api.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`),
    enabled: !!workspaceId,
  })
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateWorkspaceRequest) =>
      api.post<Workspace>("/workspaces", { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.list() })
    },
  })
}

export function useUpdateWorkspace(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateWorkspaceRequest) =>
      api.patch<Workspace>(`/workspaces/${workspaceId}`, { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all })
    },
  })
}

export function useDeleteWorkspace(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.delete<void>(`/workspaces/${workspaceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.list() })
    },
  })
}

export function useLeaveWorkspace(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      api.delete<void>(`/workspaces/${workspaceId}/members/me`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.list() })
    },
  })
}

export function useUpdateMemberRole(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: WorkspaceRole }) =>
      api.patch<WorkspaceMember>(
        `/workspaces/${workspaceId}/members/${memberId}`,
        { body: { role } }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.members(workspaceId),
      })
    },
  })
}

export function useRemoveMember(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: string) =>
      api.delete<void>(
        `/workspaces/${workspaceId}/members/${memberId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.members(workspaceId),
      })
    },
  })
}
