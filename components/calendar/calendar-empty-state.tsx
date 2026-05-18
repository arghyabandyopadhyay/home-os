"use client";

import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";

export function CalendarEmptyState() {
  const router = useRouter();

  return (
    <EmptyState
      module="calendar"
      icon={CalendarDays}
      heading="Your calendar is waiting"
      body="Create your first event or connect Google Calendar to see your schedule here."
      actionLabel="Connect Google Calendar"
      onAction={() => router.push("/api/google-calendar/connect")}
    />
  );
}
