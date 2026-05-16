"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { CalendarEvent } from "@/types/calendar";

type EventEditFormProps = {
  event: CalendarEvent;
  onSave: (updated: CalendarEvent) => void;
  onCancel: () => void;
};

function toLocalDateTimeValue(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function EventEditForm({ event, onSave, onCancel }: EventEditFormProps) {
  const [title, setTitle] = useState(event.title);
  const [startsAt, setStartsAt] = useState(toLocalDateTimeValue(event.starts_at));
  const [endsAt, setEndsAt] = useState(
    event.ends_at ? toLocalDateTimeValue(event.ends_at) : ""
  );
  const [description, setDescription] = useState(event.description || "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; startsAt?: string }>({});

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: { title?: string; startsAt?: string } = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!startsAt) newErrors.startsAt = "Start time is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      const updatePayload: Record<string, unknown> = {
        title: title.trim(),
        starts_at: new Date(startsAt).toISOString(),
        description: description.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (endsAt) {
        updatePayload.ends_at = new Date(endsAt).toISOString();
      } else {
        updatePayload.ends_at = null;
      }

      const { data, error } = await supabase
        .from("calendar_events")
        .update(updatePayload)
        .eq("id", event.id)
        .select()
        .single();

      if (error) throw error;

      onSave(data as CalendarEvent);
      toast.success("Event updated");
    } catch {
      toast.error("Could not update event");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-app">Edit event</h3>

      <div>
        <label htmlFor="event-title" className="mb-1 block text-xs font-medium text-app-muted">
          Title
        </label>
        <input
          id="event-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-app w-full"
          placeholder="Event title"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-500">{errors.title}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="event-start" className="mb-1 block text-xs font-medium text-app-muted">
            Start
          </label>
          <input
            id="event-start"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="input-app w-full"
          />
          {errors.startsAt && (
            <p className="mt-1 text-xs text-red-500">{errors.startsAt}</p>
          )}
        </div>
        <div>
          <label htmlFor="event-end" className="mb-1 block text-xs font-medium text-app-muted">
            End (optional)
          </label>
          <input
            id="event-end"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="input-app w-full"
          />
        </div>
      </div>

      <div>
        <label htmlFor="event-description" className="mb-1 block text-xs font-medium text-app-muted">
          Description (optional)
        </label>
        <textarea
          id="event-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="input-app w-full resize-none"
          placeholder="Add a description…"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary-app px-4 py-2 text-sm"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-app px-4 py-2 text-sm text-app-muted hover:bg-app-elevated"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
