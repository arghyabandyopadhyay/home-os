"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function QuickCapture() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function capture(asNote: boolean) {
    const text = value.trim();
    if (!text) return;

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Sign in to capture");
        return;
      }

      if (asNote) {
        const { data, error } = await supabase
          .from("notes")
          .insert({
            user_id: user.id,
            title: text.slice(0, 80),
            content: text,
          })
          .select("id")
          .single();

        if (error) throw error;
        setValue("");
        toast.success("Note saved");
        router.push(`/notes/${data.id}`);
        router.refresh();
        return;
      }

      const { error } = await supabase.from("tasks").insert({
        user_id: user.id,
        title: text,
        completed: false,
      });

      if (error) throw error;
      setValue("");
      toast.success("Task added");
      router.refresh();
    } catch {
      toast.error("Could not save");
    } finally {
      setLoading(false);
    }
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
        rows={2}
        className="mb-3 w-full resize-none rounded-xl border border-app bg-app-elevated px-4 py-3 text-sm text-app outline-none placeholder:text-app-muted focus:border-blue-500/40"
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
