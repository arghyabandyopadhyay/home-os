"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useCreateTask } from "@/hooks/queries/use-tasks";
import { useCreateNote } from "@/hooks/queries/use-notes";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import type { ApiClientError } from "@/lib/api-client";

export function QuickCapture() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const createTaskMutation = useCreateTask();
  const createNoteMutation = useCreateNote();
  const handleError = useApiErrorHandler();

  function capture(asNote: boolean) {
    const text = value.trim();
    if (!text) return;

    setLoading(true);

    if (asNote) {
      createNoteMutation.mutate(
        { title: text.slice(0, 80), content: text },
        {
          onSuccess: (data) => {
            setValue("");
            toast.success("Note saved");
            router.push(`/notes/${data.id}`);
            router.refresh();
            setLoading(false);
          },
          onError: (error) => {
            handleError(error as unknown as ApiClientError);
            setLoading(false);
          },
        },
      );
      return;
    }

    createTaskMutation.mutate(
      { title: text },
      {
        onSuccess: () => {
          setValue("");
          toast.success("Task added");
          router.refresh();
          setLoading(false);
        },
        onError: (error) => {
          handleError(error as unknown as ApiClientError);
          setLoading(false);
        },
      },
    );
  }

  return (
    <div className="rounded-2xl border border-app bg-app-surface p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-app-muted">
        <Plus className="h-4 w-4" />
        Quick capture
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What's on your mind? Save as a task or note…"
        aria-label="Quick capture — save as a task or note"
        rows={2}
        className="mb-3 w-full resize-none rounded-xl border border-app bg-app-elevated px-4 py-3 text-sm text-app placeholder:text-app-muted focus:border-blue-500/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--home-muted)]"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            capture(false);
          }
        }}
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading || !value.trim()}
          onClick={() => capture(false)}
          className="btn-primary-app flex-1 px-4 py-2 text-sm disabled:opacity-40"
        >
          Add task
        </button>
        <button
          type="button"
          disabled={loading || !value.trim()}
          onClick={() => capture(true)}
          className="flex-1 rounded-xl border border-app px-4 py-2 text-sm text-app transition hover:bg-app-elevated disabled:opacity-40"
        >
          Save note
        </button>
      </div>
    </div>
  );
}
