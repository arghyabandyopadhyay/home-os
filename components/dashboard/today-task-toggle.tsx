"use client";

import { useRouter } from "next/navigation";
import { useUpdateTask } from "@/hooks/queries/use-tasks";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import type { ApiClientError } from "@/lib/api-client";

export function TodayTaskToggle({
  taskId,
  completed,
}: {
  taskId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const updateTaskMutation = useUpdateTask();
  const handleError = useApiErrorHandler();

  function toggle(next: boolean) {
    updateTaskMutation.mutate(
      { id: taskId, completed: next },
      {
        onSuccess: () => {
          router.refresh();
        },
        onError: (error) => {
          handleError(error as unknown as ApiClientError);
        },
      },
    );
  }

  return (
    <input
      type="checkbox"
      checked={completed}
      onChange={(e) => toggle(e.target.checked)}
      aria-label={completed ? "Mark task incomplete" : "Mark task complete"}
      className="h-4 w-4 shrink-0 rounded border-white/20"
    />
  );
}
