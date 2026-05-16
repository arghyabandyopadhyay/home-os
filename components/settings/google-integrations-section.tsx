"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Calendar, Users, Link2, Unlink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

  const handleCalendarDisconnect = async () => {
    setLoading("calendar-disconnect");
    try {
      const res = await fetch("/api/google-calendar/disconnect", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to disconnect");
      }
      setCalendarStatus({ connected: false, email: null });
      toast.success("Google Calendar disconnected");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to disconnect";
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  const handleCalendarSync = async () => {
    setLoading("calendar-sync");
    try {
      const res = await fetch("/api/google-calendar/sync", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sync");
      }
      toast.success("Calendar synced successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to sync";
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  const handleContactsSync = async () => {
    setLoading("contacts-sync");
    try {
      const res = await fetch("/api/google-contacts/sync", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to import contacts");
      }
      const data = await res.json();
      toast.success(
        `Contacts imported: ${data.imported ?? 0} new, ${data.updated ?? 0} updated`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to import contacts";
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="border border-app panel-app text-app shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      <CardContent className="p-7">
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-xl bg-sky-500/10 p-3">
            <Link2 className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-app">
              Google Integrations
            </h2>
            <p className="text-sm text-app-muted/70">
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
                  asChild
                  size="sm"
                  className="rounded-xl bg-sky-500 text-white hover:bg-sky-400"
                >
                  <a href="/api/google-calendar/connect" aria-label="Connect Google Calendar">
                    <Link2 className="mr-2 h-4 w-4" />
                    Connect
                  </a>
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
                  asChild
                  size="sm"
                  className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-400"
                >
                  <a href="/api/google-contacts/connect" aria-label="Connect Google Contacts">
                    <Link2 className="mr-2 h-4 w-4" />
                    Connect
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
