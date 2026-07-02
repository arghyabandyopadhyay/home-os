"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, X, Plus, Home, Users } from "lucide-react"
import { AppModal } from "@/components/shared/app-modal"
import { useCreateWorkspace } from "@/hooks/queries/use-workspaces"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { DURATION, EASING } from "@/lib/motion"
import type { WorkspaceType } from "@/types/workspace"

// ─── Types ───────────────────────────────────────────────────────────────────

type CreateWorkspaceModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 1 | 2

// ─── Validation ──────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return "Workspace name is required"
  if (trimmed.length > 50) return "Name must be 50 characters or fewer"
  return null
}

function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return "Email is required"
  if (!EMAIL_REGEX.test(trimmed)) return "Please enter a valid email address"
  return null
}

// ─── Step Transition Variants ────────────────────────────────────────────────

const stepVariants = {
  enter: { opacity: 0, x: 16 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
}

const stepTransition = {
  duration: DURATION.normal,
  ease: EASING.entrance,
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CreateWorkspaceModal({
  open,
  onOpenChange,
}: CreateWorkspaceModalProps) {
  const prefersReducedMotion = useReducedMotion()
  const createWorkspace = useCreateWorkspace()
  const { addWorkspace, setActiveWorkspaceId } = useWorkspaceStore()

  // Form state
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState("")
  const [type, setType] = useState<WorkspaceType>("family")
  const [emailInput, setEmailInput] = useState("")
  const [emails, setEmails] = useState<string[]>([])
  const [nameError, setNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Reset form when modal closes
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setStep(1)
        setName("")
        setType("family")
        setEmailInput("")
        setEmails([])
        setNameError(null)
        setEmailError(null)
        setSubmitError(null)
        createWorkspace.reset()
      }
      onOpenChange(isOpen)
    },
    [onOpenChange, createWorkspace]
  )

  // Step 1 → Step 2
  const handleNext = useCallback(() => {
    const error = validateName(name)
    if (error) {
      setNameError(error)
      return
    }
    setNameError(null)
    setStep(2)
  }, [name])

  // Add email to list
  const handleAddEmail = useCallback(() => {
    const trimmed = emailInput.trim()
    const error = validateEmail(trimmed)
    if (error) {
      setEmailError(error)
      return
    }
    if (emails.includes(trimmed.toLowerCase())) {
      setEmailError("This email has already been added")
      return
    }
    setEmails((prev) => [...prev, trimmed.toLowerCase()])
    setEmailInput("")
    setEmailError(null)
  }, [emailInput, emails])

  // Remove email from list
  const handleRemoveEmail = useCallback((email: string) => {
    setEmails((prev) => prev.filter((e) => e !== email))
  }, [])

  // Submit
  const handleSubmit = useCallback(async () => {
    setSubmitError(null)
    try {
      const workspace = await createWorkspace.mutateAsync({
        name: name.trim(),
        type,
        inviteEmails: emails.length > 0 ? emails : undefined,
      })
      addWorkspace(workspace)
      setActiveWorkspaceId(workspace.id)
      handleOpenChange(false)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create workspace. Please try again."
      setSubmitError(message)
    }
  }, [name, type, emails, createWorkspace, addWorkspace, setActiveWorkspaceId, handleOpenChange])

  const isSubmitting = createWorkspace.isPending

  const motionProps = prefersReducedMotion
    ? { initial: undefined, animate: undefined, exit: undefined, transition: { duration: 0 } }
    : { variants: stepVariants, initial: "enter", animate: "center", exit: "exit", transition: stepTransition }

  return (
    <AppModal open={open} onOpenChange={handleOpenChange} size="md">
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-app">Create workspace</h2>
          <p className="text-sm text-app-muted mt-1">
            {step === 1 ? "Choose a name and type for your workspace." : "Invite members to collaborate."}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2" aria-hidden="true">
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-[var(--home-accent)]" : "bg-app-elevated"}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-[var(--home-accent)]" : "bg-app-elevated"}`} />
        </div>

        {/* Steps content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step-1" {...motionProps}>
              <StepOne
                name={name}
                onNameChange={(v) => { setName(v); setNameError(null) }}
                nameError={nameError}
                type={type}
                onTypeChange={setType}
              />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="step-2" {...motionProps}>
              <StepTwo
                emailInput={emailInput}
                onEmailInputChange={(v) => { setEmailInput(v); setEmailError(null) }}
                emailError={emailError}
                emails={emails}
                onAddEmail={handleAddEmail}
                onRemoveEmail={handleRemoveEmail}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        {submitError && (
          <p className="text-sm text-red-500" role="alert">
            {submitError}
          </p>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2 text-sm text-app-muted hover:bg-app-elevated hover:text-app transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2 text-sm text-app-muted hover:bg-app-elevated hover:text-app transition-colors"
            >
              Cancel
            </button>

            {step === 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary-app rounded-lg px-4 py-2 text-sm"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary-app flex items-center gap-2 rounded-lg px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting && (
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                )}
                {isSubmitting ? "Creating…" : "Create workspace"}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppModal>
  )
}

// ─── Step 1: Name + Type ─────────────────────────────────────────────────────

function StepOne({
  name,
  onNameChange,
  nameError,
  type,
  onTypeChange,
}: {
  name: string
  onNameChange: (value: string) => void
  nameError: string | null
  type: WorkspaceType
  onTypeChange: (type: WorkspaceType) => void
}) {
  return (
    <div className="space-y-4">
      {/* Name input */}
      <div>
        <label htmlFor="workspace-name" className="block text-sm font-medium text-app mb-1.5">
          Workspace name
        </label>
        <input
          id="workspace-name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Family Home, Design Team"
          maxLength={50}
          className="input-app w-full"
          aria-invalid={!!nameError}
          aria-describedby={nameError ? "name-error" : undefined}
        />
        {nameError && (
          <p id="name-error" className="text-sm text-red-500 mt-1" role="alert">
            {nameError}
          </p>
        )}
        <p className="text-xs text-app-muted mt-1">{name.trim().length}/50 characters</p>
      </div>

      {/* Type selection */}
      <fieldset>
        <legend className="block text-sm font-medium text-app mb-2">Workspace type</legend>
        <div className="grid grid-cols-2 gap-3">
          <TypeRadioCard
            type="family"
            label="Family"
            description="For your household"
            icon={<Home size={20} aria-hidden="true" />}
            selected={type === "family"}
            onSelect={() => onTypeChange("family")}
          />
          <TypeRadioCard
            type="shared"
            label="Shared"
            description="For a team or group"
            icon={<Users size={20} aria-hidden="true" />}
            selected={type === "shared"}
            onSelect={() => onTypeChange("shared")}
          />
        </div>
      </fieldset>
    </div>
  )
}

// ─── Type Radio Card ─────────────────────────────────────────────────────────

function TypeRadioCard({
  type,
  label,
  description,
  icon,
  selected,
  onSelect,
}: {
  type: WorkspaceType
  label: string
  description: string
  icon: React.ReactNode
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${label} workspace — ${description}`}
      onClick={onSelect}
      className={`
        flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors cursor-pointer text-center
        ${selected
          ? "border-[var(--home-accent)] bg-app-elevated"
          : "border-app hover:bg-app-elevated"
        }
      `}
    >
      <div className={`${selected ? "text-[var(--home-accent)]" : "text-app-muted"}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-app">{label}</p>
        <p className="text-xs text-app-muted">{description}</p>
      </div>
    </button>
  )
}

// ─── Step 2: Invite Members ──────────────────────────────────────────────────

function StepTwo({
  emailInput,
  onEmailInputChange,
  emailError,
  emails,
  onAddEmail,
  onRemoveEmail,
}: {
  emailInput: string
  onEmailInputChange: (value: string) => void
  emailError: string | null
  emails: string[]
  onAddEmail: () => void
  onRemoveEmail: (email: string) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="invite-email" className="block text-sm font-medium text-app mb-1.5">
          Invite members (optional)
        </label>
        <div className="flex items-center gap-2">
          <input
            id="invite-email"
            type="email"
            value={emailInput}
            onChange={(e) => onEmailInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                onAddEmail()
              }
            }}
            placeholder="email@example.com"
            className="input-app flex-1"
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
          />
          <button
            type="button"
            onClick={onAddEmail}
            className="btn-primary-app rounded-lg p-2 shrink-0"
            aria-label="Add email"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
        {emailError && (
          <p id="email-error" className="text-sm text-red-500 mt-1" role="alert">
            {emailError}
          </p>
        )}
      </div>

      {/* Email list */}
      {emails.length > 0 && (
        <ul className="space-y-2" aria-label="Invited members">
          {emails.map((email) => (
            <li
              key={email}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-app-elevated"
            >
              <span className="text-sm text-app truncate">{email}</span>
              <button
                type="button"
                onClick={() => onRemoveEmail(email)}
                className="text-app-muted hover:text-app transition-colors shrink-0 ml-2"
                aria-label={`Remove ${email}`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {emails.length === 0 && (
        <p className="text-sm text-app-muted py-2">
          No invitations yet. You can skip this step and invite members later.
        </p>
      )}
    </div>
  )
}
