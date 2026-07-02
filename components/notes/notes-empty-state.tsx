"use client";

import { useRouter } from "next/navigation";
import { NotebookPen } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { useCreateNote } from "@/hooks/queries/use-notes";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import type { ApiClientError } from "@/lib/api-client";

export function NotesEmptyState() {
  const router = useRouter();
  const createNoteMutation = useCreateNote();
  const handleError = useApiErrorHandler();

  function handleCreate() {
    createNoteMutation.mutate(
      { title: "Untitled", content: "" },
      {
        onSuccess: (data) => {
          router.push(`/notes/${data.id}`);
          router.refresh();
        },
        onError: (error) => {
          handleError(error as unknown as ApiClientError);
        },
      },
    );
  }

  return (
    <EmptyState
      module="notes"
      icon={NotebookPen}
      heading="Start capturing your thoughts in notes"
      body="Write freely — ideas, reflections, or anything on your mind. Your notes are private and always here."
      actionLabel="Write your first note"
      onAction={handleCreate}
    />
  );
}
