import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { getMonthEvents, getGoogleCalendarStatus } from "@/lib/calendar";
import { getTasks } from "@/lib/tasks";
import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "@/components/calendar/calendar-view";
import { PageShell } from "@/components/layout/page-shell";
import { CalendarEmptyState } from "@/components/calendar/calendar-empty-state";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const [events, tasks, googleCalendarConnected] = await Promise.all([
    getMonthEvents(now.getFullYear(), now.getMonth()),
    getTasks(),
    getGoogleCalendarStatus(),
  ]);

  const hasEvents = events.length > 0;

  return (
    <PageShell
      title="Calendar"
      description="Your schedule at a glance"
      actions={
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-app-muted" aria-hidden="true" />
        </div>
      }
    >
      {hasEvents || googleCalendarConnected ? (
        <CalendarView
          initialEvents={events}
          initialTasks={tasks}
          googleCalendarConnected={googleCalendarConnected}
          initialYear={now.getFullYear()}
          initialMonth={now.getMonth()}
        />
      ) : (
        <div className="card-app">
          <CalendarEmptyState />
        </div>
      )}
    </PageShell>
  );
}
