export type NotificationPreferences = {
  email: boolean;
  push: boolean;
  tasks: boolean;
  notes: boolean;
};

export type ThemePreference = "light" | "dark" | "auto";

export type UserPreferences = {
  onboardingComplete?: boolean;
  pinnedNoteIds?: string[];
  theme?: ThemePreference;
  notifications?: NotificationPreferences;
};

export const defaultUserPreferences: UserPreferences = {
  onboardingComplete: false,
  pinnedNoteIds: [],
  theme: "dark",
  notifications: {
    email: true,
    push: false,
    tasks: true,
    notes: false,
  },
};
