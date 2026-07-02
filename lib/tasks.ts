import { createServerApiClient } from "@/lib/api-client/server"
import type { Task } from "@/types/task"

// Re-export pure helpers so existing server-side imports still work
export {
  groupTasksBySection,
  filterTodayTasks,
  countTodayIncomplete,
} from "@/lib/tasks-helpers"
export type { TaskSections } from "@/lib/tasks-helpers"

// ─── Server data access ───────────────────────────────────────────────────────

export async function getTasks(): Promise<Task[]> {
  try {
    const api = await createServerApiClient()
    return await api.get<Task[]>("/tasks")
  } catch {
    return []
  }
}

export async function createTask(): Promise<Task | null> {
  try {
    const api = await createServerApiClient()
    return await api.post<Task>("/tasks", { body: { title: "" } })
  } catch {
    return null
  }
}

export async function updateTask(
  id: string,
  updates: Partial<Pick<Task, "title" | "completed" | "priority" | "due_date">>
): Promise<Task | null> {
  try {
    const api = await createServerApiClient()
    return await api.patch<Task>(`/tasks/${id}`, { body: updates })
  } catch {
    return null
  }
}

export async function deleteTask(id: string): Promise<boolean> {
  try {
    const api = await createServerApiClient()
    await api.delete(`/tasks/${id}`)
    return true
  } catch {
    return false
  }
}
