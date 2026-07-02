"use client";

import { CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { useConnectGoogleCalendar } from "@/hooks/queries/use-calendar";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import type { ApiClientError } from "@/lib/api-client";

export function CalendarEmptyState() {
  const connectCalendar = useConnectGoogleCalendar();
  const handleError = useApiErrorHandler();

  async function handleConnect() {
    try {
      const result = await connectCalendar.mutateAsync();
      window.location.href = result.url;
    } catch (error) {
      handleError(error as ApiClientError);
    }
  }

  return (
    <EmptyState
      module="calendar"
      icon={CalendarDays}
      heading="Your calendar is waiting"
      body="Create your first event or connect Google Calendar to see your schedule here."
      actionLabel="Connect Google Calendar"
      onAction={handleConnect}
    />
  );
}
