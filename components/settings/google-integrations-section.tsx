"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Calendar, Users, Link2, Unlink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useDisconnectGoogleCalendar,
  useSyncGoogleCalendar,
  useConnectGoogleCalendar,
} from "@/hooks/queries/use-calendar";
import {
  useConnectGoogleContacts,
  useSyncGoogleContacts,
} from "@/hooks/queries/use-contacts";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import type { ApiClientError } from "@/lib/api-client";

type ConnectionStatus = {
  connected: boolean;
  email: string | null;
};

type GoogleIntegrationsSectionProps = {
  calendarConnection: ConnectionStatus;
  contactsConnection: ConnectionStatus;
};

export function GoogleIntegrationsSection({
  calendarConnection,
  contactsConnection,
}: GoogleIntegrationsSectionProps) {
  const [calendarStatus, setCalendarStatus] = useState(calendarConnection);
  const [contactsStatus] = useState(contactsConnection);
  const [loading, setLoading] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler();

  const disconnectCalendar = useDisconnectGoogleCalendar();
  const syncCalendar = useSyncGoogleCalendar();
  const connectCalendar = useConnectGoogleCalendar();
  const connectContacts = useConnectGoogleContacts();
  const syncContacts = useSyncGoogleContacts();

  const handleCalendarConnect = async () => {
    setLoading("calendar-connect");
    try {
      const result = await connectCalendar.mutateAsync();
      window.location.href = result.url;
    } catch (error) {
      handleApiError(error as ApiClientError);
    } finally {
      setLoading(null);
    }
  };

  const handleCalendarDisconnect = async () => {
    setLoading("calendar-disconnect");
    try {
      await disconnectCalendar.mutateAsync();
      setCalendarStatus({ connected: false, email: null });
      toast.success("Google Calendar disconnected");
    } catch (error) {
      handleApiError(error as ApiClientError);
    } finally {
      setLoading(null);
    }
  };

  const handleCalendarSync = async () => {
    setLoading("calendar-sync");
    try {
      await syncCalendar.mutateAsync();
      toast.success("Calendar synced successfully");
    } catch (error) {
      handleApiError(error as ApiClientError);
    } finally {
      setLoading(null);
    }
  };

  const handleContactsConnect = async () => {
    setLoading("contacts-connect");
    try {
      const result = await connectContacts.mutateAsync();
      window.location.href = result.url;
    } catch (error) {
      handleApiError(error as ApiClientError);
    } finally {
      setLoading(null);
    }
  };

  const handleContactsSync = async () => {
    setLoading("contacts-sync");
    try {
      const data = await syncContacts.mutateAsync();
      toast.success(
        `Contacts imported: ${data.imported ?? 0} new, ${data.updated ?? 0} updated`,
      );
    } catch (error) {
      handleApiError(error as ApiClientError);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="card-app p-6">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-xl bg-sky-500/10 p-3">
          <Link2 className="h-5 w-5 text-sky-400" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-app">
            Google Integrations
          </h2>
          <p className="text-sm text-app-muted">
            Connect your Google services.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Google Calendar */}
        <div className="rounded-2xl border border-app bg-app-elevated p-5">
          <div className="mb-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-sky-400" />
            <h3 className="text-lg font-medium text-app">Google Calendar</h3>
          </div>

          <p className="mb-4 text-sm text-app-muted">
            {calendarStatus.connected
              ? `Connected as ${calendarStatus.email}`
              : "Not connected"}
          </p>

          <div className="flex flex-wrap gap-3">
            {calendarStatus.connected ? (
              <>
                <Button
                  onClick={handleCalendarSync}
                  disabled={loading !== null}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-app text-app hover:bg-app-elevated"
                  aria-label="Sync Google Calendar now"
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${loading === "calendar-sync" ? "animate-spin" : ""}`}
                  />
                  {loading === "calendar-sync" ? "Syncing..." : "Sync now"}
                </Button>
                <Button
                  onClick={handleCalendarDisconnect}
                  disabled={loading !== null}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10"
                  aria-label="Disconnect Google Calendar"
                >
                  <Unlink className="mr-2 h-4 w-4" />
                  {loading === "calendar-disconnect"
                    ? "Disconnecting..."
                    : "Disconnect"}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleCalendarConnect}
                disabled={loading !== null}
                size="sm"
                className="rounded-xl bg-sky-500 text-white hover:bg-sky-400"
                aria-label="Connect Google Calendar"
              >
                <Link2 className="mr-2 h-4 w-4" />
                {loading === "calendar-connect" ? "Connecting..." : "Connect"}
              </Button>
            )}
          </div>
        </div>

        {/* Google Contacts */}
        <div className="rounded-2xl border border-app bg-app-elevated p-5">
          <div className="mb-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-medium text-app">Google Contacts</h3>
          </div>

          <p className="mb-4 text-sm text-app-muted">
            {contactsStatus.connected
              ? `Connected as ${contactsStatus.email}`
              : "Not connected"}
          </p>

          <div className="flex flex-wrap gap-3">
            {contactsStatus.connected ? (
              <Button
                onClick={handleContactsSync}
                disabled={loading !== null}
                variant="outline"
                size="sm"
                className="rounded-xl border-app text-app hover:bg-app-elevated"
                aria-label="Re-import Google Contacts"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${loading === "contacts-sync" ? "animate-spin" : ""}`}
                />
                {loading === "contacts-sync" ? "Importing..." : "Re-import"}
              </Button>
            ) : (
              <Button
                onClick={handleContactsConnect}
                disabled={loading !== null}
                size="sm"
                className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-400"
                aria-label="Connect Google Contacts"
              >
                <Link2 className="mr-2 h-4 w-4" />
                {loading === "contacts-connect" ? "Connecting..." : "Connect"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
