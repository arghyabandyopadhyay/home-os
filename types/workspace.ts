export type WorkspaceType = "personal" | "family" | "shared"

export type WorkspaceRole = "owner" | "member" | "viewer"

export type Workspace = {
  id: string
  name: string
  type: WorkspaceType
  role: WorkspaceRole
  memberCount: number
  createdAt: string
}

export type WorkspaceMember = {
  id: string
  userId: string
  email: string
  name: string
  avatarUrl: string | null
  role: WorkspaceRole
  joinedAt: string
}

export type PendingInvitation = {
  id: string
  workspaceId: string
  workspaceName: string
  workspaceType: WorkspaceType
  inviterName: string
  inviterEmail: string
  invitedAt: string
}

export type WorkspaceInvitee = {
  id: string
  email: string
  role: WorkspaceRole
  status: "pending" | "accepted" | "declined"
  invitedAt: string
}

export type CreateWorkspaceRequest = {
  name: string
  type: WorkspaceType
  inviteEmails?: string[]
}

export type UpdateWorkspaceRequest = {
  name?: string
}

export type InviteMemberRequest = {
  email: string
  role: WorkspaceRole
}
