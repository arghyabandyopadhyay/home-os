"use client";

import { UserPreferencesProvider } from "@/components/providers/user-preferences-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { LowPerformanceDetector } from "@/components/providers/low-performance-detector";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <UserPreferencesProvider>
      <ThemeProvider>
        <LowPerformanceDetector />
        {children}
      </ThemeProvider>
    </UserPreferencesProvider>
  );
}
