"use client";

import { Bell, Palette } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { usePreferences } from "@/components/providers/user-preferences-provider";
import type { ThemePreference } from "@/types/user-preferences";

const notificationLabels: Record<string, string> = {
  email: "Email notifications",
  push: "Push notifications",
  tasks: "Task reminders",
  notes: "Note updates",
};

export function PreferencesSection() {
  const { prefs, update } = usePreferences();
  const notifications = prefs.notifications ?? {
    email: true,
    push: false,
    tasks: true,
    notes: false,
  };

  return (
  <>
    <Card className="border-app bg-app-surface text-app shadow-sm">
      <CardContent className="p-7">
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-xl bg-orange-500/10 p-3">
            <Bell className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Notifications</h2>
            <p className="text-sm text-app-muted">
              Saved to your account across devices.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl border border-app bg-app/50 px-4 py-3"
            >
              <p className="font-medium">
                {notificationLabels[key] ?? key}
              </p>
              <Switch
                checked={value}
                onCheckedChange={(checked) =>
                  update({
                    notifications: { ...notifications, [key]: checked },
                  })
                }
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card className="border-app bg-app-surface text-app shadow-sm">
      <CardContent className="p-7">
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-xl bg-pink-500/10 p-3">
            <Palette className="h-5 w-5 text-pink-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Appearance</h2>
            <p className="text-sm text-app-muted">Theme syncs everywhere.</p>
          </div>
        </div>

        <select
          value={prefs.theme ?? "dark"}
          onChange={(e) =>
            update({ theme: e.target.value as ThemePreference })
          }
          className="h-12 w-full rounded-xl border border-app bg-app px-4 text-app outline-none focus:border-pink-500/50"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="auto">Auto (system)</option>
        </select>
      </CardContent>
    </Card>
  </>
  );
}
