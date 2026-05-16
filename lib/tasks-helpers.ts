import { Task } from "@/types/task"

// ─── Pure helper functions ────────────────────────────────────────────────────

/**
 * Returns the ISO date string for the end of `today` (23:59:59 local time
 * expressed as a comparable string in YYYY-MM-DD format).
 */
function todayEndKey(today: Date): string {
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, "0")
  const d = String(today.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export type TaskSections = {
  today: Task[]
  upcoming: Task[]
  completed: Task[]
}

/**
 * Groups tasks into Today / Upcoming / Completed sections.
 *
 * - Today:    !completed && due_date <= today 23:59:59
 * - Upcoming: !completed && (due_date > today OR due_date IS NULL)
 *             — dated tasks first, then undated
 * - Completed: completed === true
 */
export function groupTasksBySection(tasks: Task[], today: Date): TaskSections {
  const todayKey = todayEndKey(today)

  const todayTasks: Task[] = []
  const upcomingDated: Task[] = []
  const upcomingUndated: Task[] = []
  const completedTasks: Task[] = []

  for (const task of tasks) {
    if (task.completed) {
      completedTasks.push(task)
      continue
    }
    if (task.due_date === null) {
      upcomingUndated.push(task)
    } else {
      const dueDateKey = task.due_date.slice(0, 10)
      if (dueDateKey <= todayKey) {
        todayTasks.push(task)
      } else {
        upcomingDated.push(task)
      }
    }
  }

  // Sort today tasks by due_date ascending (overdue first)
  todayTasks.sort((a, b) => {
    if (a.due_date === null) return 1
    if (b.due_date === null) return -1
    return a.due_date.localeCompare(b.due_date)
  })

  // Sort upcoming dated tasks by due_date ascending
  upcomingDated.sort((a, b) => {
    if (a.due_date === null) return 1
    if (b.due_date === null) return -1
    return a.due_date.localeCompare(b.due_date)
  })

  return {
    today: todayTasks,
    upcoming: [...upcomingDated, ...upcomingUndated],
    completed: completedTasks,
  }
}

/**
 * Returns only tasks that belong in the Today section.
 */
export function filterTodayTasks(tasks: Task[], today: Date): Task[] {
  return groupTasksBySection(tasks, today).today
}

/**
 * Returns the count of incomplete tasks due today or overdue.
 */
export function countTodayIncomplete(tasks: Task[], today: Date): number {
  return filterTodayTasks(tasks, today).length
}
