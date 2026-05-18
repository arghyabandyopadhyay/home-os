import { getTasks } from "@/lib/tasks";
import { TasksList } from "@/components/tasks/tasks-list";
import { PageShell } from "@/components/layout/page-shell";
import { TasksPageActions } from "@/components/tasks/tasks-page-actions";

export default async function TasksPage() {
  const tasks = await getTasks();

  return (
    <PageShell
      title="Tasks"
      description="Manage your work and life"
      actions={<TasksPageActions />}
    >
      <TasksList tasks={tasks} />
    </PageShell>
  );
}
