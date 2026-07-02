"use client"

import { useState } from "react"
import { ChevronDown, Plus, Check } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { WorkspaceAvatar } from "@/components/workspace/workspace-avatar"
import { WorkspaceTypeBadge } from "@/components/workspace/workspace-type-badge"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"
import { useAcceptInvitation, useDeclineInvitation } from "@/hooks/queries/use-invitations"
import { cn } from "@/lib/utils"

type WorkspaceSwitcherProps = {
  compact?: boolean
}

export function WorkspaceSwitcher({ compact }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const queryClient = useQueryClient()
  const {
    activeWorkspace,
    activeWorkspaceId,
    activeRole,
    workspaces,
    pendingInvitations,
    setActiveWorkspaceId,
  } = useWorkspaceStore()

  const acceptInvitation = useAcceptInvitation()
  const declineInvitation = useDeclineInvitation()

  const pendingCount = pendingInvitations.length

  // 8.5: Workspace switching logic
  function handleWorkspaceSwitch(workspaceId: string) {
    if (workspaceId === activeWorkspaceId) {
      setOpen(false)
      setSheetOpen(false)
      return
    }
    setActiveWorkspaceId(workspaceId)
    setOpen(false)
    setSheetOpen(false)
    // Invalidate all workspace-scoped queries to trigger refetches
    queryClient.invalidateQueries()
  }

  // 8.3: Invitation actions
  function handleAcceptInvitation(invitationId: string) {
    acceptInvitation.mutate(invitationId)
  }

  function handleDeclineInvitation(invitationId: string) {
    declineInvitation.mutate(invitationId)
  }

  // 8.4: Create workspace action
  function handleCreateWorkspace() {
    setOpen(false)
    setSheetOpen(false)
    setShowCreateModal(true)
  }

  if (!activeWorkspace) {
    // 8.6: Loading skeleton when no active workspace yet
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-8 h-8 rounded-full bg-app-elevated animate-pulse" />
        {!compact && (
          <div className="flex-1 h-4 rounded bg-app-elevated animate-pulse" />
        )}
      </div>
    )
  }

  // 10.1: Mobile bottom sheet for compact mode (viewport < 768px)
  if (compact) {
    return (
      <>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            className={cn(
              "flex items-center justify-center relative",
              "w-9 h-9 rounded-xl",
              "bg-app-surface border border-app",
              "hover:bg-app-elevated transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
              "cursor-pointer select-none"
            )}
            aria-label={`Switch workspace, current: ${activeWorkspace.name}`}
          >
            <WorkspaceAvatar workspace={activeWorkspace} size="sm" />
            {pendingCount > 0 && (
              <span
                className={cn(
                  "absolute -top-1 -right-1",
                  "inline-flex items-center justify-center",
                  "min-w-[16px] h-[16px] px-0.5 rounded-full",
                  "bg-red-500 text-white text-[9px] font-semibold leading-none"
                )}
                aria-label={`${pendingCount} pending invitation${pendingCount > 1 ? "s" : ""}`}
              >
                {pendingCount}
              </span>
            )}
          </SheetTrigger>

          <SheetContent
            side="bottom"
            className="!rounded-t-2xl max-h-[80vh] overflow-y-auto"
            showCloseButton={false}
          >
            <SheetTitle className="px-4 pt-4 pb-2 text-sm font-semibold text-app">
              Workspaces
            </SheetTitle>

            {/* Workspace list */}
            <div className="px-2 pb-2" role="menu" aria-label="Workspaces">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  role="menuitem"
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-3 rounded-xl",
                    "transition-colors cursor-pointer",
                    workspace.id === activeWorkspaceId
                      ? "bg-app-elevated"
                      : "hover:bg-app-elevated"
                  )}
                  onClick={() => handleWorkspaceSwitch(workspace.id)}
                >
                  <WorkspaceAvatar workspace={workspace} size="md" />
                  <span className="flex-1 text-sm text-app text-left truncate">
                    {workspace.name}
                  </span>
                  <WorkspaceTypeBadge type={workspace.type} />
                  {workspace.id === activeWorkspaceId && (
                    <Check
                      size={16}
                      className="text-app-muted shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Pending invitations */}
            {pendingInvitations.length > 0 && (
              <div className="px-4 py-2 border-t border-app">
                <p className="text-xs font-medium text-app-muted mb-2">
                  Pending Invitations
                </p>
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="py-2 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-app truncate flex-1">
                        {invitation.workspaceName}
                      </span>
                      <span className="text-xs text-app-muted truncate">
                        from {invitation.inviterName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className={cn(
                          "px-3 py-1.5 text-xs rounded-lg",
                          "bg-app-elevated hover:bg-app-surface",
                          "text-app border border-app",
                          "transition-colors cursor-pointer"
                        )}
                        aria-label={`Accept invitation to ${invitation.workspaceName}`}
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        disabled={acceptInvitation.isPending}
                      >
                        Accept
                      </button>
                      <button
                        className={cn(
                          "px-3 py-1.5 text-xs rounded-lg",
                          "hover:bg-app-elevated",
                          "text-app-muted",
                          "transition-colors cursor-pointer"
                        )}
                        aria-label={`Decline invitation to ${invitation.workspaceName}`}
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        disabled={declineInvitation.isPending}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Create workspace */}
            <div className="px-2 pb-4 border-t border-app pt-2">
              <button
                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-app-elevated transition-colors cursor-pointer"
                onClick={handleCreateWorkspace}
              >
                <Plus size={18} className="text-app-muted" aria-hidden="true" />
                <span className="text-sm text-app">Create workspace</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* 8.4: CreateWorkspaceModal placeholder — will be implemented separately */}
        {showCreateModal && (
          // TODO: Replace with <CreateWorkspaceModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
          <div aria-hidden="true" />
        )}
      </>
    )
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        {/* 8.1: Dropdown trigger */}
        <DropdownMenuTrigger
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 rounded-xl",
            "bg-app-surface border border-app",
            "hover:bg-app-elevated transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
            "cursor-pointer select-none"
          )}
          aria-label={`Switch workspace, current: ${activeWorkspace.name}`}
          aria-haspopup="menu"
        >
          <WorkspaceAvatar workspace={activeWorkspace} size="sm" />
          <div className="flex-1 min-w-0">
            <span className="block text-left text-sm text-app truncate">
              {activeWorkspace.name}
            </span>
            {activeRole === "viewer" && (
              <span
                className="block text-left text-[10px] text-app-muted leading-tight"
                aria-label="You have read-only access to this workspace"
              >
                Read-only
              </span>
            )}
          </div>
          <ChevronDown
            size={14}
            className="text-app-muted shrink-0"
            aria-hidden="true"
          />
          {pendingCount > 0 && (
            <span
              className={cn(
                "inline-flex items-center justify-center",
                "min-w-[18px] h-[18px] px-1 rounded-full",
                "bg-red-500 text-white text-[10px] font-semibold leading-none"
              )}
              aria-label={`${pendingCount} pending invitation${pendingCount > 1 ? "s" : ""}`}
            >
              {pendingCount}
            </span>
          )}
        </DropdownMenuTrigger>

        {/* 8.2: Dropdown content — 10.3: fade-in 150ms ease-out */}
        <DropdownMenuContent
          className="w-72 duration-150 ease-out"
          role="menu"
          aria-label="Workspaces"
          align="start"
          sideOffset={8}
        >
          {/* Workspace list */}
          <DropdownMenuGroup>
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                role="menuitem"
                className={cn(
                  "flex items-center gap-2 px-2 py-2 cursor-pointer",
                  workspace.id === activeWorkspaceId && "bg-app-elevated"
                )}
                onSelect={() => handleWorkspaceSwitch(workspace.id)}
              >
                <WorkspaceAvatar workspace={workspace} size="sm" />
                <span className="flex-1 text-sm text-app truncate">
                  {workspace.name}
                </span>
                <WorkspaceTypeBadge type={workspace.type} />
                {workspace.id === activeWorkspaceId && (
                  <Check
                    size={14}
                    className="text-app-muted shrink-0"
                    aria-hidden="true"
                  />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          {/* 8.3: Pending invitations section */}
          {pendingInvitations.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Pending Invitations</DropdownMenuLabel>
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="px-2 py-2 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-app truncate flex-1">
                        {invitation.workspaceName}
                      </span>
                      <span className="text-xs text-app-muted truncate">
                        from {invitation.inviterName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className={cn(
                          "px-2 py-1 text-xs rounded-md",
                          "bg-app-elevated hover:bg-app-surface",
                          "text-app border border-app",
                          "transition-colors cursor-pointer"
                        )}
                        aria-label={`Accept invitation to ${invitation.workspaceName}`}
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        disabled={acceptInvitation.isPending}
                      >
                        Accept
                      </button>
                      <button
                        className={cn(
                          "px-2 py-1 text-xs rounded-md",
                          "hover:bg-app-elevated",
                          "text-app-muted",
                          "transition-colors cursor-pointer"
                        )}
                        aria-label={`Decline invitation to ${invitation.workspaceName}`}
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        disabled={declineInvitation.isPending}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </DropdownMenuGroup>
            </>
          )}

          {/* 8.4: Create workspace action */}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center gap-2 px-2 py-2 cursor-pointer"
            onSelect={handleCreateWorkspace}
          >
            <Plus size={16} className="text-app-muted" aria-hidden="true" />
            <span className="text-sm text-app">Create workspace</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 8.4: CreateWorkspaceModal placeholder — will be implemented separately */}
      {showCreateModal && (
        // TODO: Replace with <CreateWorkspaceModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
        <div aria-hidden="true" />
      )}
    </>
  )
}
