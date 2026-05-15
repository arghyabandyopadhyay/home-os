"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function TodayTaskToggle({
  taskId,
  completed,
}: {
  taskId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function toggle(next: boolean) {
    const { error } = await supabase
      .from("tasks")
      .update({ completed: next })
      .eq("id", taskId);

    if (error) {
      toast.error("Could not update task");
      return;
    }

    router.refresh();
  }

  return (
    <input
      type="checkbox"
      checked={completed}
      onChange={(e) => toggle(e.target.checked)}
      className="h-4 w-4 shrink-0 rounded border-white/20"
    />
  );
}
