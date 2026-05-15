"use client";

import { createContext, useContext } from "react";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import type { UserPreferences } from "@/types/user-preferences";

type PreferencesContextValue = {
  prefs: UserPreferences;
  loading: boolean;
  update: (
    patch: Partial<UserPreferences>,
  ) => Promise<UserPreferences>;
  reload: () => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(
  null,
);

export function UserPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useUserPreferences();
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within UserPreferencesProvider");
  }
  return ctx;
}
