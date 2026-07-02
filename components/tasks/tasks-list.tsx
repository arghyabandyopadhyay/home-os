"use client"

import { useEffect, useRef, useState } from "react"
import { Task } from "@/types/task"
import { groupTasksBySection, countTodayIncomplete } from "@/lib/tasks-helpers"
import { toast } from "sonner"
import { Calendar, CheckSquare, ChevronDown } from "lucide-react"
import { v4 as uuid } from "uuid"
import { formatDueLabel } from "@/lib/date"
import { EmptyState } from "@/components/shared/empty-state"
import { useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/queries/use-tasks"
import { useApiErrorHandler } from "@/hooks/use-api-error-handler"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import type { ApiClientError } from "@/lib/api-client"

// ─── Priority helpers ─────────────────────────────────────────────────────────

type Priority = "low" | "medium" | "high"

const PRIORITY_DOT: Record<Priority, string> = {
  low: "bg-green-500",
  medium: "bg-yellow-400",
  high: "bg-red-500",
}

const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

function PriorityDot({ priority }: { priority: Task["priority"] }) {
  if (!priority) return null
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${PRIORITY_DOT[priority]}`}
      aria-label={`Priority: ${PRIORITY_LABEL[priority]}`}
      title={`Priority: ${PRIORITY_LABEL[priority]}`}
    />
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  label,
  count,
}: {
  label: string
  count?: number
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-xs uppercase tracking-[0.24em] text-app-muted">
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-app-elevated px-2 py-0.5 text-xs text-app-muted">
          {count}
        </span>
      )}
    </div>
  )
}

// ─── Single task row ──────────────────────────────────────────────────────────

type LocalTask = Task & { isNew?: boolean }

type TaskRowProps = {
  task: LocalTask
  isReadOnly: boolean
  onToggle: (id: string, completed: boolean) => void
  onUpdateTitle: (id: string, title: string) => void
  onSaveTitle: (id: string, title: string) => void
  onUpdateDueDate: (id: string, dueDate: string | null) => void
  onUpdatePriority: (id: string, priority: Task["priority"]) => void
  onDelete: (id: string) => void
}

function TaskRow({
  task,
  isReadOnly,
  onToggle,
  onUpdateTitle,
  onSaveTitle,
  onUpdateDueDate,
  onUpdatePriority,
  onDelete,
}: TaskRowProps) {
  const [validationMsg, setValidationMsg] = useState("")

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const value = e.target.value
    if (!value.trim()) {
      setValidationMsg("Title cannot be blank.")
      e.target.focus()
      return
    }
    setValidationMsg("")
    onSaveTitle(task.id, value)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  return (
    <div className="item-app flex flex-col gap-1">
      {/* Primary row: checkbox + title (+ controls on desktop) */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => onToggle(task.id, e.target.checked)}
          disabled={isReadOnly}
          className="h-5 w-5 shrink-0"
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        />

        <PriorityDot priority={task.priority} />

        <input
          autoFocus={task.title === "" && task.isNew}
          value={task.title}
          onChange={(e) => {
            setValidationMsg("")
            onUpdateTitle(task.id, e.target.value)
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Task title…"
          readOnly={isReadOnly}
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-app-muted ${
            task.completed ? "text-app-muted line-through" : "text-app"
          }`}
        />

        {/* Desktop-only controls */}
        <select
          value={task.priority ?? ""}
          onChange={(e) =>
            onUpdatePriority(
              task.id,
              (e.target.value as Priority) || null,
            )
          }
          disabled={isReadOnly}
          className="hidden shrink-0 rounded-lg border border-app bg-app-elevated px-2 py-1 text-xs text-app-muted sm:block"
          aria-label="Task priority"
        >
          <option value="">No priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          <input
            type="date"
            value={task.due_date?.slice(0, 10) ?? ""}
            onChange={(e) =>
              onUpdateDueDate(
                task.id,
                e.target.value ? `${e.target.value}T12:00:00` : null,
              )
            }
            disabled={isReadOnly}
            className="rounded-lg border border-app bg-app-elevated px-2 py-1 text-xs text-app-muted"
            title="Due date"
            aria-label="Due date"
          />
          {task.due_date && (
            <span className="flex items-center gap-1 text-xs text-app-muted">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {formatDueLabel(task.due_date)}
            </span>
          )}
        </div>

        {!isReadOnly && (
          <button
            onClick={() => onDelete(task.id)}
            className="hidden shrink-0 text-sm text-red-400 transition hover:text-red-300 sm:block"
            aria-label="Delete task"
          >
            Delete
          </button>
        )}
      </div>

      {/* Mobile-only controls row */}
      <div className="ml-8 flex flex-wrap items-center gap-2 sm:hidden">
        <select
          value={task.priority ?? ""}
          onChange={(e) =>
            onUpdatePriority(
              task.id,
              (e.target.value as Priority) || null,
            )
          }
          disabled={isReadOnly}
          className="rounded-lg border border-app bg-app-elevated px-2 py-1 text-xs text-app-muted"
          aria-label="Task priority"
        >
          <option value="">No priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <input
          type="date"
          value={task.due_date?.slice(0, 10) ?? ""}
          onChange={(e) =>
            onUpdateDueDate(
              task.id,
              e.target.value ? `${e.target.value}T12:00:00` : null,
            )
          }
          disabled={isReadOnly}
          className="rounded-lg border border-app bg-app-elevated px-2 py-1 text-xs text-app-muted"
          title="Due date"
          aria-label="Due date"
        />

        {task.due_date && (
          <span className="flex items-center gap-1 text-xs text-app-muted">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            {formatDueLabel(task.due_date)}
          </span>
        )}

        {!isReadOnly && (
          <button
            onClick={() => onDelete(task.id)}
            className="text-sm text-red-400 transition hover:text-red-300"
            aria-label="Delete task"
          >
            Delete
          </button>
        )}
      </div>

      {validationMsg && (
        <p className="ml-8 text-xs text-red-400" role="alert">
          {validationMsg}
        </p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TasksList({ tasks: initialTasks }: { tasks: Task[] }) {
  const [tasks, setTasks] = useState<LocalTask[]>(initialTasks)
  const tasksRef = useRef<LocalTask[]>(initialTasks)
  const [viewMode, setViewMode] = useState<"today" | "all">("all")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const ITEMS_PER_SECTION = 5

  const createTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()
  const deleteTaskMutation = useDeleteTask()
  const handleError = useApiErrorHandler()
  const { isReadOnly } = useWorkspacePermissions()

  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  // Listen for create task event from the page header action button
  useEffect(() => {
    function handleCreateEvent() {
      if (!isReadOnly) {
        createTask()
      }
    }
    window.addEventListener("tasks:create", handleCreateEvent)
    return () => window.removeEventListener("tasks:create", handleCreateEvent)
  })

  const today = new Date()
  const sections = groupTasksBySection(tasks, today)
  const todayCount = countTodayIncomplete(tasks, today)

  // In "today" mode we only show the today section (+ completed)
  const visibleSections =
    viewMode === "today"
      ? { today: sections.today, upcoming: [], completed: sections.completed }
      : sections

  // ── Mutations ──────────────────────────────────────────────────────────────

  function createTask() {
    const optimisticTask: LocalTask = {
      id: uuid(),
      title: "",
      completed: false,
      due_date: null,
      created_at: new Date().toISOString(),
      priority: null,
      updated_at: new Date().toISOString(),
      isNew: true,
    }
    setTasks((prev) => [optimisticTask, ...prev])
  }

  function updateTitle(id: string, title: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title } : t)),
    )
  }

  async function saveTitle(id: string, title: string) {
    const task = tasksRef.current.find((t) => t.id === id)
    if (!task) return
    if (!title.trim()) return

    if (task.isNew) {
      createTaskMutation.mutate(
        { title },
        {
          onSuccess: (data) => {
            setTasks((prev) =>
              prev.map((t) => (t.id === id ? { ...data, isNew: false } : t)),
            )
          },
          onError: (error) => {
            handleError(error as unknown as ApiClientError)
            setTasks((prev) => prev.filter((t) => t.id !== id))
          },
        },
      )
      return
    }

    const previous = tasksRef.current
    updateTaskMutation.mutate(
      { id, title },
      {
        onError: (error) => {
          handleError(error as unknown as ApiClientError)
          setTasks(previous)
        },
      },
    )
  }

  async function toggleTask(id: string, completed: boolean) {
    const previous = tasksRef.current
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t)),
    )

    updateTaskMutation.mutate(
      { id, completed },
      {
        onError: (error) => {
          handleError(error as unknown as ApiClientError)
          setTasks(previous)
        },
      },
    )
  }

  async function updateDueDate(id: string, dueDate: string | null) {
    const previous = tasksRef.current
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, due_date: dueDate } : t)),
    )

    const task = tasksRef.current.find((t) => t.id === id)
    if (task?.isNew) return

    updateTaskMutation.mutate(
      { id, due_date: dueDate ?? undefined },
      {
        onError: (error) => {
          handleError(error as unknown as ApiClientError)
          setTasks(previous)
        },
      },
    )
  }

  async function updatePriority(id: string, priority: Task["priority"]) {
    const previous = tasksRef.current
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, priority } : t)),
    )

    const task = tasksRef.current.find((t) => t.id === id)
    if (task?.isNew) return

    updateTaskMutation.mutate(
      { id, priority: priority ?? undefined },
      {
        onError: (error) => {
          handleError(error as unknown as ApiClientError)
          setTasks(previous)
        },
      },
    )
  }

  async function deleteTask(id: string) {
    const previous = tasksRef.current
    const task = tasksRef.current.find((t) => t.id === id)
    setTasks((prev) => prev.filter((t) => t.id !== id))

    if (task?.isNew) return

    deleteTaskMutation.mutate(id, {
      onError: (error) => {
        handleError(error as unknown as ApiClientError)
        setTasks(previous)
      },
    })
  }

  // ── Shared row props factory ───────────────────────────────────────────────

  const rowProps = {
    isReadOnly,
    onToggle: toggleTask,
    onUpdateTitle: updateTitle,
    onSaveTitle: saveTitle,
    onUpdateDueDate: updateDueDate,
    onUpdatePriority: updatePriority,
    onDelete: deleteTask,
  }

  // ── Progressive disclosure helper ─────────────────────────────────────────

  function toggleSection(section: string) {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  function getVisibleItems(items: LocalTask[], section: string) {
    if (expandedSections[section]) return items
    return items.slice(0, ITEMS_PER_SECTION)
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (tasks.length === 0) {
    return (
      <EmptyState
        module="tasks"
        icon={CheckSquare}
        heading="Your tasks live here"
        body="Capture what needs doing — from daily errands to long-term goals. Start with your first task."
        actionLabel={isReadOnly ? undefined : "Create your first task"}
        onAction={isReadOnly ? undefined : createTask}
      />
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center gap-3">
        <span className="text-sm uppercase tracking-[0.24em] text-app-muted">
          Your tasks
        </span>

        {/* Today / All toggle */}
        <div className="flex overflow-hidden rounded-xl border border-app">
          <button
            onClick={() => setViewMode("today")}
            className={`px-3 py-1.5 text-xs transition ${
              viewMode === "today"
                ? "bg-app-elevated text-app"
                : "text-app-muted hover:text-app"
            }`}
          >
            Today
            {todayCount > 0 && (
              <span className="ml-1.5 rounded-full bg-app px-1.5 py-0.5 text-xs text-app-muted">
                {todayCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`px-3 py-1.5 text-xs transition ${
              viewMode === "all"
                ? "bg-app-elevated text-app"
                : "text-app-muted hover:text-app"
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Today section */}
      <section aria-label="Today's tasks" className="card-app p-6">
        <SectionHeader label="Today" count={todayCount} />
        {visibleSections.today.length === 0 ? (
          <div className="rounded-xl border border-dashed border-app p-6 text-center text-sm text-app-muted">
            You&apos;re all caught up for today.
          </div>
        ) : (
          <div className="space-y-2">
            {getVisibleItems(visibleSections.today, "today").map((task) => (
              <TaskRow key={task.id} task={task} {...rowProps} />
            ))}
            {visibleSections.today.length > ITEMS_PER_SECTION && !expandedSections["today"] && (
              <button
                onClick={() => toggleSection("today")}
                className="flex w-full items-center justify-center gap-1 rounded-xl py-2 text-xs text-app-muted transition hover:text-app"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                Show {visibleSections.today.length - ITEMS_PER_SECTION} more
              </button>
            )}
          </div>
        )}
      </section>

      {/* Upcoming section — hidden in Today mode */}
      {viewMode === "all" && (
        <section aria-label="Upcoming tasks" className="card-app p-6">
          <SectionHeader label="Upcoming" />
          {visibleSections.upcoming.length === 0 ? (
            <div className="rounded-xl border border-dashed border-app p-6 text-center text-sm text-app-muted">
              No upcoming tasks.
            </div>
          ) : (
            <div className="space-y-2">
              {getVisibleItems(visibleSections.upcoming, "upcoming").map((task) => (
                <TaskRow key={task.id} task={task} {...rowProps} />
              ))}
              {visibleSections.upcoming.length > ITEMS_PER_SECTION && !expandedSections["upcoming"] && (
                <button
                  onClick={() => toggleSection("upcoming")}
                  className="flex w-full items-center justify-center gap-1 rounded-xl py-2 text-xs text-app-muted transition hover:text-app"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  Show {visibleSections.upcoming.length - ITEMS_PER_SECTION} more
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* Completed section */}
      <section aria-label="Completed tasks" className="card-app p-6">
        <SectionHeader label="Completed" />
        {visibleSections.completed.length === 0 ? (
          <div className="rounded-xl border border-dashed border-app p-6 text-center text-sm text-app-muted">
            No completed tasks yet.
          </div>
        ) : (
          <div className="space-y-2">
            {getVisibleItems(visibleSections.completed, "completed").map((task) => (
              <TaskRow key={task.id} task={task} {...rowProps} />
            ))}
            {visibleSections.completed.length > ITEMS_PER_SECTION && !expandedSections["completed"] && (
              <button
                onClick={() => toggleSection("completed")}
                className="flex w-full items-center justify-center gap-1 rounded-xl py-2 text-xs text-app-muted transition hover:text-app"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                Show {visibleSections.completed.length - ITEMS_PER_SECTION} more
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
