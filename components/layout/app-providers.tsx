"use client";

import { UserPreferencesProvider } from "@/components/providers/user-preferences-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <UserPreferencesProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </UserPreferencesProvider>
  );
}
