"use client";

import { useRouter } from "next/navigation";
import { NotebookPen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/shared/empty-state";

export function NotesEmptyState() {
  const router = useRouter();
  const supabase = createClient();

  async function handleCreate() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: "Untitled",
        content: "",
      })
      .select()
      .single();

    if (error || !data) return;

    router.push(`/notes/${data.id}`);
    router.refresh();
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
