"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClientApiClient } from "@/lib/api-client"
import type { PendingInvitation, InviteMemberRequest } from "@/types/workspace"
import { workspaceKeys } from "./use-workspaces"

const api = createClientApiClient()

export const invitationKeys = {
  all: ["invitations"] as const,
  pending: () => [...invitationKeys.all, "pending"] as const,
}

export function usePendingInvitations() {
  return useQuery({
    queryKey: invitationKeys.pending(),
    queryFn: () => api.get<PendingInvitation[]>("/invitations/pending"),
    refetchInterval: 60_000,
  })
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) =>
      api.post(`/invitations/${invitationId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.all })
      queryClient.invalidateQueries({ queryKey: workspaceKeys.list() })
    },
  })
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) =>
      api.post(`/invitations/${invitationId}/decline`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.all })
    },
  })
}

export function useInviteMember(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InviteMemberRequest) =>
      api.post(`/workspaces/${workspaceId}/invitations`, { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.invitees(workspaceId),
      })
    },
  })
}

export function useCancelInvitation(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) =>
      api.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.invitees(workspaceId),
      })
    },
  })
}
