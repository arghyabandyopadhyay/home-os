"use client"

import { useState, useCallback } from "react"
import { Loader2, Send, ChevronDown } from "lucide-react"
import { useInviteMember } from "@/hooks/queries/use-invitations"
import type { WorkspaceRole } from "@/types/workspace"

type InviteMemberFormProps = {
  workspaceId: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ROLE_OPTIONS: { value: WorkspaceRole; label: string }[] = [
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
]

export function InviteMemberForm({ workspaceId }: InviteMemberFormProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<WorkspaceRole>("member")
  const [error, setError] = useState<string | null>(null)

  const inviteMember = useInviteMember(workspaceId)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      const trimmedEmail = email.trim()

      // Client-side email validation
      if (!trimmedEmail) {
        setError("Email is required")
        return
      }
      if (!EMAIL_REGEX.test(trimmedEmail)) {
        setError("Please enter a valid email address")
        return
      }

      try {
        await inviteMember.mutateAsync({ email: trimmedEmail, role })
        // Clear inputs on success
        setEmail("")
        setRole("member")
      } catch (err: unknown) {
        // Handle 409 conflict — show inline error
        if (err instanceof Error) {
          const message = err.message.toLowerCase()
          if (message.includes("already a member")) {
            setError("Already a member")
          } else if (message.includes("already invited")) {
            setError("Already invited")
          } else {
            setError(err.message || "Failed to send invitation")
          }
        } else {
          setError("Failed to send invitation")
        }
      }
    },
    [email, role, inviteMember]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-start gap-2">
        {/* Email input */}
        <div className="flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError(null)
            }}
            placeholder="email@example.com"
            className="input-app w-full"
            aria-label="Member email address"
            aria-invalid={!!error}
            aria-describedby={error ? "invite-error" : undefined}
          />
        </div>

        {/* Role selector */}
        <div className="relative shrink-0">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as WorkspaceRole)}
            className="input-app appearance-none pr-7 pl-3 py-2 text-sm rounded-lg cursor-pointer"
            aria-label="Role for invited member"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-app-muted"
            aria-hidden="true"
          />
        </div>

        {/* Invite button */}
        <button
          type="submit"
          disabled={inviteMember.isPending}
          className="btn-primary-app flex items-center gap-2 rounded-lg px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          aria-label="Send invitation"
        >
          {inviteMember.isPending ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <Send size={14} aria-hidden="true" />
          )}
          Invite
        </button>
      </div>

      {/* Inline error */}
      {error && (
        <p id="invite-error" className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
