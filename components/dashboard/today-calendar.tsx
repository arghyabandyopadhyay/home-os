"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ExternalLink, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { CalendarEvent } from "@/types/calendar";
import { toDateKey } from "@/lib/date";
import { createClientApiClient } from "@/lib/api-client";
import { useSyncGoogleCalendar, useConnectGoogleCalendar } from "@/hooks/queries/use-calendar";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import type { ApiClientError } from "@/lib/api-client";

const api = createClientApiClient();

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function TodayCalendar({
  initialEvents,
  googleCalendarConnected,
}: {
  initialEvents: CalendarEvent[];
  googleCalendarConnected: boolean;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [adding, setAdding] = useState(false);
  const router = useRouter();
  const syncMutation = useSyncGoogleCalendar();
  const connectCalendar = useConnectGoogleCalendar();
  const handleError = useApiErrorHandler();

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setAdding(true);
    try {
      const startsAt = `${toDateKey()}T${time}:00`;

      const data = await api.post<CalendarEvent>("/calendar/events", {
        body: {
          title: trimmed,
          starts_at: startsAt,
          all_day: false,
        },
      });

      setEvents((prev) =>
        [...prev, data].sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        ),
      );
      setTitle("");
      toast.success("Event added");
      router.refresh();
    } catch (error) {
      handleError(error as unknown as ApiClientError);
    } finally {
      setAdding(false);
    }
  }

  function syncGoogleCalendar() {
    syncMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Google Calendar synced");
        router.refresh();
      },
      onError: (error) => {
        handleError(error as unknown as ApiClientError);
      },
    });
  }

  return (
    <section className="rounded-2xl border border-app bg-app-elevated p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Calendar className="h-5 w-5 text-sky-500" />
          Today&apos;s schedule
        </h2>
        {googleCalendarConnected ? (
          <button
            type="button"
            onClick={syncGoogleCalendar}
            disabled={syncMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-app bg-app px-3 py-2 text-xs font-medium text-app-muted transition hover:bg-app-elevated hover:text-app disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`}
            />
            {syncMutation.isPending ? "Syncing" : "Sync Google"}
          </button>
        ) : (
          <button
            type="button"
            onClick={async () => {
              try {
                const result = await connectCalendar.mutateAsync();
                window.location.href = result.url;
              } catch (error) {
                handleError(error as ApiClientError);
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-600 transition hover:bg-sky-500/15 dark:text-sky-300"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Connect Google
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <p className="mb-4 text-sm text-app-muted">
          No events today. Add one below.
        </p>
      ) : (
        <ul className="mb-4 space-y-2">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-center gap-3 rounded-xl border border-app bg-app/50 px-4 py-2"
            >
              <span className="shrink-0 text-xs font-medium text-sky-500">
                {formatTime(event.starts_at)}
              </span>
              <span className="min-w-0 flex-1 text-sm">{event.title}</span>
              {event.source === "google" && (
                <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-600 dark:text-sky-300">
                  Google
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addEvent} className="flex flex-wrap gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          className="min-w-[140px] flex-1 rounded-lg border border-app bg-app px-3 py-2 text-sm outline-none focus:border-sky-500/50"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-lg border border-app bg-app px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={adding || !title.trim()}
          className="flex items-center gap-1 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-app hover:bg-sky-400 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </form>
    </section>
  );
}
