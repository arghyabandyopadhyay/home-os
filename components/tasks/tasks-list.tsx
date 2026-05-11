"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Task } from "@/types/task"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { v4 as uuid } from "uuid"

export function TasksList({
  tasks: initialTasks,
}: {
  tasks: Task[]
}) {
  type LocalTask = Task & {
    isNew?: boolean
    user_id?: string
  }

  const supabase = createClient()
  const tasksRef = useRef<LocalTask[]>(initialTasks)
  const [tasks, setTasks] =
    useState<LocalTask[]>(initialTasks)

  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  function createTask() {
    const optimisticTask: LocalTask = {
      id: uuid(),
      title: "",
      completed: false,
      due_date: null,
      created_at: new Date().toISOString(),
      isNew: true,
    }

    setTasks((prev) => [optimisticTask, ...prev])
  }

  async function toggleTask(
    id: string,
    completed: boolean
  ) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              completed,
            }
          : task
      )
    )

    const { error } = await supabase
      .from("tasks")
      .update({
        completed,
      })
      .eq("id", id)

    if (error) {
      toast.error(
        "Failed to update task"
      )
    }
  }

  async function saveTitle(
    id: string,
    title: string
  ) {
    const task = tasksRef.current.find(
      (task) => task.id === id
    )
    if (!task) return

    if (!title.trim()) {
      return
    }

    if (task.isNew) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        toast.error("Failed to authenticate")
        return
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title,
          completed: false,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) {
        toast.error("Failed to create task")
        setTasks((prev) =>
          prev.filter((task) => task.id !== id)
        )
        return
      }

      setTasks((prev) =>
        prev.map((task) =>
          task.id === id
            ? {
                ...data,
                isNew: false,
              }
            : task
        )
      )
      return
    }

    const { error } = await supabase
      .from("tasks")
      .update({
        title,
      })
      .eq("id", id)

    if (error) {
      toast.error("Failed to update task")
    }
  }

  function updateTitle(
    id: string,
    title: string
  ) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              title,
            }
          : task
      )
    )
  }

  async function deleteTask(id: string) {
    const task = tasks.find((task) => task.id === id)

    setTasks((prev) =>
      prev.filter((task) => task.id !== id)
    )

    if (task?.isNew) return

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)

    if (error) {
      toast.error(
        "Failed to delete task"
      )
    }
  }

  return (
    <div className="space-y-3">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm uppercase tracking-[0.24em] text-zinc-500">
          Your tasks
        </div>

        <button
          onClick={createTask}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-medium text-black transition hover:opacity-90"
        >
          <Plus size={18} />
          Add Task
        </button>
      </div>

      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-4"
        >
          <input
            type="checkbox"
            checked={task.completed}
            onChange={(e) =>
              toggleTask(
                task.id,
                e.target.checked
              )
            }
            className="h-5 w-5"
          />

          <input
            autoFocus={task.title === ""}
            value={task.title}
            onChange={(e) =>
              updateTitle(
                task.id,
                e.target.value
              )
            }
            onBlur={(e) =>
              saveTitle(task.id, e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
            className={`flex-1 bg-transparent outline-none placeholder:text-zinc-600 ${
              task.completed
                ? "text-zinc-500 line-through"
                : ""
            }`}
          />

          <button
            onClick={() =>
              deleteTask(task.id)
            }
            className="text-sm text-red-400 transition hover:text-red-300"
          >
            Delete
          </button>
        </div>
      ))}

      {tasks.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-zinc-500">
          No tasks yet
        </div>
      )}
    </div>
  )
}