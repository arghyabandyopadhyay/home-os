"use client";

import { useState } from "react";
import { Calendar, CheckCircle2, Circle, Clock, Pencil, Trash2 } from "lucide-react";
import type { CalendarEvent } from "@/types/calendar";
import type { Task } from "@/types/task";
import { EventEditForm } from "@/components/calendar/event-edit-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { createClientApiClient } from "@/lib/api-client";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import type { ApiClientError } from "@/lib/api-client";

const api = createClientApiClient();

type DayPanelProps = {
  date: Date;
  events: CalendarEvent[];
  tasks: Task[];
  onEventUpdated: (event: CalendarEvent) => void;
  onEventDeleted: (eventId: string) => void;
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return events
    .filter((event) => {
      const eventDate = new Date(event.starts_at);
      const eventDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}`;
      return eventDateStr === dateStr;
    })
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    );
}

function getTasksForDate(tasks: Task[], date: Date): Task[] {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return tasks.filter((task) => {
    if (!task.due_date) return false;
    return task.due_date.slice(0, 10) === dateStr;
  });
}

export function DayPanel({
  date,
  events,
  tasks,
  onEventUpdated,
  onEventDeleted,
}: DayPanelProps) {
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const handleError = useApiErrorHandler();

  const dayEvents = getEventsForDate(events, date);
  const dayTasks = getTasksForDate(tasks, date);

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  async function handleDelete(eventId: string) {
    setDeletingId(eventId);
    try {
      await api.delete<void>(`/calendar/events/${eventId}`);
      onEventDeleted(eventId);
      toast.success("Event deleted");
    } catch (error) {
      handleError(error as ApiClientError);
    } finally {
      setDeletingId(null);
    }
  }

  if (editingEvent) {
    return (
      <div className="card-app p-6">
        <EventEditForm
          event={editingEvent}
          onSave={(updated) => {
            onEventUpdated(updated);
            setEditingEvent(null);
          }}
          onCancel={() => setEditingEvent(null)}
        />
      </div>
    );
  }

  return (
    <div className="card-app p-6">
      <h3 className="mb-4 text-sm font-semibold text-app">{formattedDate}</h3>

      {/* Events section */}
      {dayEvents.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-app-muted">
            <Calendar className="h-3.5 w-3.5" />
            Events
          </h4>
          <ul className="space-y-2">
            {dayEvents.map((event) => (
              <li
                key={event.id}
                className="group flex items-start gap-3 rounded-xl border border-app bg-app/50 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-sky-500">
                      <Clock className="inline h-3 w-3 mr-0.5" />
                      {formatTime(event.starts_at)}
                      {event.ends_at && ` – ${formatTime(event.ends_at)}`}
                    </span>
                    {event.source === "google" && (
                      <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-600 dark:text-sky-300">
                        Google
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-app">
                    {event.title}
                  </p>
                  {event.description && (
                    <p className="mt-1 text-xs text-app-muted line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  {event.location && (
                    <p className="mt-1 text-xs text-app-muted">
                      📍 {event.location}
                    </p>
                  )}
                </div>

                {event.source === "home_os" && (
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setEditingEvent(event)}
                      className="rounded-lg p-1.5 text-app-muted hover:bg-app-elevated hover:text-app"
                      aria-label="Edit event"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-app-muted hover:bg-red-500/10 hover:text-red-500"
                          aria-label="Delete event"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete event</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &ldquo;{event.title}&rdquo;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => handleDelete(event.id)}
                            disabled={deletingId === event.id}
                          >
                            {deletingId === event.id ? "Deleting…" : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tasks section */}
      {dayTasks.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-app-muted">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Tasks due
          </h4>
          <ul className="space-y-1.5">
            {dayTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-2 rounded-xl border border-app bg-app/50 px-4 py-2"
              >
                {task.completed ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-app-muted" />
                )}
                <span
                  className={`text-sm ${task.completed ? "text-app-muted line-through" : "text-app"}`}
                >
                  {task.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dayEvents.length === 0 && dayTasks.length === 0 && (
        <p className="text-sm text-app-muted">Nothing scheduled for this day.</p>
      )}
    </div>
  );
}
