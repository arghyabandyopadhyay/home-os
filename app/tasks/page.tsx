import { getTasks } from "@/lib/tasks"
import { TasksList } from "@/components/tasks/tasks-list"

export default async function TasksPage() {
  const tasks = await getTasks()

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          Tasks
        </h1>

        <p className="mt-2 text-zinc-400">
          Manage your work and life
        </p>
      </div>

      <TasksList tasks={tasks} />
    </div>
  )
}