"use client"

import { Plus } from "lucide-react"

export function TasksPageActions() {
  function handleAddTask() {
    // Dispatch a custom event that TasksList listens for
    window.dispatchEvent(new CustomEvent("tasks:create"))
  }

  return (
    <button
      onClick={handleAddTask}
      className="btn-primary-app flex items-center gap-2 px-4 py-2.5 text-sm"
    >
      <Plus size={16} aria-hidden="true" />
      Add Task
    </button>
  )
}
