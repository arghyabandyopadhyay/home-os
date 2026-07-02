"use client";

import { UserPreferencesProvider } from "@/components/providers/user-preferences-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { LowPerformanceDetector } from "@/components/providers/low-performance-detector";
import { WorkspaceProvider } from "@/components/providers/workspace-provider";
import { QueryProvider } from "@/providers/query-provider";
import { NotificationProvider } from "@/components/notifications/notification-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <WorkspaceProvider>
        <UserPreferencesProvider>
          <ThemeProvider>
            <LowPerformanceDetector />
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </ThemeProvider>
        </UserPreferencesProvider>
      </WorkspaceProvider>
    </QueryProvider>
  );
}
