"use client";

import { useMemo } from "react";
import type { CalendarEvent } from "@/types/calendar";
import type { Task } from "@/types/task";

type CalendarGridProps = {
  events: CalendarEvent[];
  tasks: Task[];
  currentMonth: Date;
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();

  const days: (Date | null)[] = [];

  // Fill leading empty cells
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // Fill actual days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  return days;
}

function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return events.filter((event) => {
    const eventDate = new Date(event.starts_at);
    const eventDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}`;
    return eventDateStr === dateStr;
  });
}

function getTasksForDate(tasks: Task[], date: Date): Task[] {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return tasks.filter((task) => {
    if (!task.due_date) return false;
    return task.due_date.slice(0, 10) === dateStr;
  });
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({
  events,
  tasks,
  currentMonth,
  onSelectDate,
  selectedDate,
}: CalendarGridProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const days = useMemo(() => getMonthDays(year, month), [year, month]);

  return (
    <div className="w-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px border-b border-app pb-2 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-app-muted"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-px">
        {days.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="min-h-[80px]" />;
          }

          const dayEvents = getEventsForDate(events, date);
          const dayTasks = getTasksForDate(tasks, date);
          const itemCount = dayEvents.length + dayTasks.length;
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const today = isToday(date);

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`min-h-[80px] rounded-xl border p-1.5 text-left transition-colors ${
                isSelected
                  ? "border-sky-500 bg-sky-500/10"
                  : "border-transparent hover:bg-app-elevated"
              } ${today ? "ring-1 ring-sky-500/50" : ""}`}
              aria-label={`${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}${today ? ", today" : ""}${itemCount > 0 ? `, ${itemCount} items` : ""}`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  today
                    ? "bg-sky-500 text-white"
                    : "text-app"
                }`}
              >
                {date.getDate()}
              </span>

              <div className="mt-0.5 space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={`truncate rounded px-1 text-[10px] leading-tight ${
                      event.source === "google"
                        ? "bg-sky-500/10 text-sky-600 dark:text-sky-300"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                    }`}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length < 3 &&
                  dayTasks.slice(0, 3 - dayEvents.length).map((task) => (
                    <div
                      key={task.id}
                      className="truncate rounded bg-amber-500/10 px-1 text-[10px] leading-tight text-amber-600 dark:text-amber-300"
                    >
                      {task.title}
                    </div>
                  ))}
                {itemCount > 3 && (
                  <span className="block text-[9px] text-app-muted">
                    +{itemCount - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
