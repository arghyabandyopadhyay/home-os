import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { TodayCalendar } from "@/components/dashboard/today-calendar";
import { getGoogleCalendarStatus, getTodayEvents } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [events, googleCalendarConnected] = await Promise.all([
    getTodayEvents(),
    getGoogleCalendarStatus(),
  ]);

  return (
    <div className="min-h-screen bg-app text-app">
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        <header className="panel-app p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10">
              <CalendarDays className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <p className="text-sm text-app-muted">Calendar</p>
              <h1 className="text-3xl font-semibold tracking-tight">
                Today&apos;s schedule
              </h1>
            </div>
          </div>
        </header>

        <TodayCalendar
          initialEvents={events}
          googleCalendarConnected={googleCalendarConnected}
        />
      </div>
    </div>
  );
}
