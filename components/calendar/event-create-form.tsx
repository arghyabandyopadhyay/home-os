"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { CalendarEvent } from "@/types/calendar";
import { createClientApiClient } from "@/lib/api-client";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import type { ApiClientError } from "@/lib/api-client";

const api = createClientApiClient();

type EventCreateFormProps = {
  defaultDate: Date;
  onCreated: (event: CalendarEvent) => void;
  onCancel: () => void;
};

function toLocalDateTimeValue(date: Date, time: string = "09:00"): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T${time}`;
}

export function EventCreateForm({
  defaultDate,
  onCreated,
  onCancel,
}: EventCreateFormProps) {
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(toLocalDateTimeValue(defaultDate));
  const [endsAt, setEndsAt] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; startsAt?: string }>({});
  const handleError = useApiErrorHandler();

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
      const body: Record<string, unknown> = {
        title: title.trim(),
        starts_at: new Date(startsAt).toISOString(),
        all_day: false,
        description: description.trim() || null,
      };

      if (endsAt) {
        body.ends_at = new Date(endsAt).toISOString();
      }

      const data = await api.post<CalendarEvent>("/calendar/events", { body });

      onCreated(data);
      toast.success("Event created");
    } catch (error) {
      handleError(error as ApiClientError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-app">New event</h3>

      <div>
        <label htmlFor="new-event-title" className="mb-1 block text-xs font-medium text-app-muted">
          Title
        </label>
        <input
          id="new-event-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-app w-full"
          placeholder="Event title"
          autoFocus
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-500">{errors.title}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="new-event-start" className="mb-1 block text-xs font-medium text-app-muted">
            Start
          </label>
          <input
            id="new-event-start"
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
          <label htmlFor="new-event-end" className="mb-1 block text-xs font-medium text-app-muted">
            End (optional)
          </label>
          <input
            id="new-event-end"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="input-app w-full"
          />
        </div>
      </div>

      <div>
        <label htmlFor="new-event-description" className="mb-1 block text-xs font-medium text-app-muted">
          Description (optional)
        </label>
        <textarea
          id="new-event-description"
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
          {saving ? "Creating…" : "Create event"}
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
