"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, ExternalLink } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { CalendarEvent } from "@/types/calendar";
import type { Task } from "@/types/task";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { DayPanel } from "@/components/calendar/day-panel";
import { EventCreateForm } from "@/components/calendar/event-create-form";

type CalendarViewProps = {
  initialEvents: CalendarEvent[];
  initialTasks: Task[];
  googleCalendarConnected: boolean;
  initialYear: number;
  initialMonth: number;
};

export function CalendarView({
  initialEvents,
  initialTasks,
  googleCalendarConnected,
  initialYear,
  initialMonth,
}: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [tasks] = useState<Task[]>(initialTasks);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(initialYear, initialMonth, 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [backgroundSyncing, setBackgroundSyncing] = useState(false);
  const [reconnectRequired, setReconnectRequired] = useState(false);
  const hasSyncedRef = useRef(false);

  const supabase = createClient();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const fetchMonthEvents = useCallback(
    async (y: number, m: number) => {
      setLoadingMonth(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const start = new Date(y, m, 1);
        const end = new Date(y, m + 1, 0, 23, 59, 59);

        const { data, error } = await supabase
          .from("calendar_events")
          .select("*")
          .eq("user_id", user.id)
          .gte("starts_at", start.toISOString())
          .lte("starts_at", end.toISOString())
          .order("starts_at", { ascending: true });

        if (error) throw error;
        setEvents((data || []) as CalendarEvent[]);
      } catch {
        toast.error("Could not load events");
      } finally {
        setLoadingMonth(false);
      }
    },
    [supabase]
  );

  // Background sync on mount — fires exactly once per mount
  useEffect(() => {
    if (!googleCalendarConnected || hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    const doSync = async () => {
      setBackgroundSyncing(true);
      try {
        const response = await fetch("/api/google-calendar/sync", { method: "POST" });
        if (response.status === 401) {
          const data = await response.json();
          if (data.error === "reconnect_required") {
            setReconnectRequired(true);
          }
        } else if (!response.ok) {
          toast.error("Could not sync Google Calendar");
        } else {
          await fetchMonthEvents(year, month);
        }
      } catch {
        toast.error("Could not sync Google Calendar");
      } finally {
        setBackgroundSyncing(false);
      }
    };

    doSync();
  }, [googleCalendarConnected, year, month, fetchMonthEvents]);

  function goToPrevMonth() {
    const prev = new Date(year, month - 1, 1);
    setCurrentMonth(prev);
    fetchMonthEvents(prev.getFullYear(), prev.getMonth());
  }

  function goToNextMonth() {
    const next = new Date(year, month + 1, 1);
    setCurrentMonth(next);
    fetchMonthEvents(next.getFullYear(), next.getMonth());
  }

  function goToToday() {
    const now = new Date();
    const todayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    setCurrentMonth(todayMonth);
    setSelectedDate(now);
    fetchMonthEvents(now.getFullYear(), now.getMonth());
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setShowCreateForm(false);
  }

  function handleEventCreated(event: CalendarEvent) {
    setEvents((prev) =>
      [...prev, event].sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      )
    );
    setShowCreateForm(false);
  }

  function handleEventUpdated(updated: CalendarEvent) {
    setEvents((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
  }

  function handleEventDeleted(eventId: string) {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  async function syncGoogleCalendar() {
    setSyncing(true);
    try {
      const response = await fetch("/api/google-calendar/sync", {
        method: "POST",
      });

      if (response.status === 401) {
        const data = await response.json();
        if (data.error === "reconnect_required") {
          setReconnectRequired(true);
          toast.error("Google Calendar needs to be reconnected");
          return;
        }
      }

      if (response.status === 404) {
        toast.error("Google Calendar is not connected");
        return;
      }

      if (!response.ok) {
        toast.error("Could not sync Google Calendar");
        return;
      }

      const data = await response.json();
      toast.success(`Synced ${data.synced} events`);
      await fetchMonthEvents(year, month);
    } catch {
      toast.error("Could not sync Google Calendar");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="card-app flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPrevMonth}
            className="rounded-lg p-2 text-app-muted hover:bg-app-elevated hover:text-app"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="min-w-[160px] text-center text-sm font-semibold text-app">
            {monthLabel}
          </h2>
          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded-lg p-2 text-app-muted hover:bg-app-elevated hover:text-app"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="ml-2 rounded-lg border border-app px-3 py-1.5 text-xs font-medium text-app-muted hover:bg-app-elevated hover:text-app"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(true);
              setSelectedDate(null);
            }}
            className="btn-primary-app flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            New event
          </button>

          {backgroundSyncing && (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-app-muted" aria-label="Syncing in background" />
          )}

          {googleCalendarConnected ? (
            <button
              type="button"
              onClick={syncGoogleCalendar}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-lg border border-app bg-app px-3 py-2 text-xs font-medium text-app-muted transition hover:bg-app-elevated hover:text-app disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing" : "Sync Google"}
            </button>
          ) : (
            <Link
              href="/api/google-calendar/connect"
              className="inline-flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-600 transition hover:bg-sky-500/15 dark:text-sky-300"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Connect Google
            </Link>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        {/* Calendar grid */}
        <div className={`card-app p-4 ${loadingMonth ? "opacity-60" : ""}`}>
          <CalendarGrid
            events={events}
            tasks={tasks}
            currentMonth={currentMonth}
            onSelectDate={handleSelectDate}
            selectedDate={selectedDate}
          />
        </div>

        {/* Side panel */}
        <div>
          {showCreateForm && (
            <div className="card-app p-6">
              <EventCreateForm
                defaultDate={selectedDate || new Date()}
                onCreated={handleEventCreated}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          )}

          {selectedDate && !showCreateForm && (
            <DayPanel
              date={selectedDate}
              events={events}
              tasks={tasks}
              onEventUpdated={handleEventUpdated}
              onEventDeleted={handleEventDeleted}
            />
          )}

          {!selectedDate && !showCreateForm && (
            <div className="card-app p-6">
              <p className="text-sm text-app-muted">
                Select a date to view events and tasks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
