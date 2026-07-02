"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  User,
  Lock,
  Download,
  Trash2,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PreferencesSection } from "@/components/settings/preferences-section";
import { GoogleIntegrationsSection } from "@/components/settings/google-integrations-section";
import { InstallAppSection } from "@/components/settings/install-app-section";
import { NotificationsSettingsSection } from "@/components/settings/notifications-settings-section";
import { createClientApiClient } from "@/lib/api-client";
import { useDeleteAccount } from "@/hooks/queries/use-account";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import type { ApiClientError } from "@/lib/api-client";

const api = createClientApiClient();

type ConnectionStatus = {
  connected: boolean;
  email: string | null;
};

type SettingsClientProps = {
  calendarConnection: ConnectionStatus;
  contactsConnection: ConnectionStatus;
};

interface UserProfile {
  full_name: string;
  email: string;
}

export function SettingsClient({
  calendarConnection,
  contactsConnection,
}: SettingsClientProps) {
  const [profile, setProfile] = useState<UserProfile>({
    full_name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const supabase = createClient();
  const handleError = useApiErrorHandler();
  const deleteAccountMutation = useDeleteAccount();

  const loadProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setProfile({
          full_name: user.user_metadata?.full_name || "",
          email: user.email || "",
        });
      }
    } catch {
      console.error("Error loading profile");
    }
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  const updateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
        },
      });

      if (error) throw error;

      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully");
    } catch {
      toast.error("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    setLoading(true);
    try {
      const data = await api.get<Record<string, unknown>>("/account/export");

      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], {
        type: "application/json",
      });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `home-os-export-${new Date().toISOString().split("T")[0]}.json`;
      link.click();

      toast.success("Data exported successfully");
    } catch (error) {
      handleError(error as ApiClientError);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await deleteAccountMutation.mutateAsync();

      await supabase.auth.signOut();
      window.location.href = "/login";
      toast.success("Account deleted");
    } catch (error) {
      handleError(error as ApiClientError);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="space-y-8">
      {/* Layout */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 xl:col-span-2">
          {/* Profile */}
          <div className="card-app p-6">
            <div className="mb-8 flex items-center gap-4">
              <div className="rounded-xl bg-blue-500/10 p-3">
                <User className="h-5 w-5 text-blue-400" />
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-app">
                  Profile Settings
                </h2>

                <p className="text-sm text-app-muted">
                  Update your personal information.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-app-muted">
                  Full Name
                </label>

                <Input
                  value={profile.full_name}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  placeholder="Your name"
                  className="input-app h-12"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-app-muted">
                  Email
                </label>

                <Input
                  value={profile.email}
                  disabled
                  className="input-app h-12 opacity-60"
                />

                <p className="mt-2 text-xs text-app-muted">
                  Email cannot be changed
                </p>
              </div>

              <Button
                onClick={updateProfile}
                disabled={loading}
                className="btn-primary-app h-12 w-full"
              >
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </div>

          {/* Google Integrations */}
          <GoogleIntegrationsSection
            calendarConnection={calendarConnection}
            contactsConnection={contactsConnection}
          />

          {/* Password */}
          <div className="card-app p-6">
            <div className="mb-8 flex items-center gap-4">
              <div className="rounded-xl bg-purple-500/10 p-3">
                <Lock className="h-5 w-5 text-purple-400" />
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-app">
                  Security
                </h2>

                <p className="text-sm text-app-muted">
                  Change your password securely.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-app-muted">
                  New Password
                </label>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="input-app h-12 pr-12"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-app-muted transition hover:text-app"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-app-muted">
                  Confirm Password
                </label>

                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="input-app h-12"
                />
              </div>

              <Button
                onClick={updatePassword}
                disabled={loading || !newPassword || !confirmPassword}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card-app border-red-500/20 bg-red-500/5 p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="rounded-xl bg-red-500/10 p-3">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-red-400">
                  Danger Zone
                </h2>

                <p className="text-sm text-red-300/70">
                  Permanent and destructive actions.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-app-elevated p-5">
              <p className="mb-5 text-sm text-app-muted">
                Delete your account and all associated data. This action
                cannot be undone.
              </p>

              <Button
                onClick={deleteAccount}
                disabled={loading}
                variant="destructive"
                className="h-11 rounded-xl"
              >
                {loading ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <PreferencesSection />

          {/* Notifications */}
          <NotificationsSettingsSection />

          {/* Install App */}
          <InstallAppSection />

          {/* Export */}
          <div className="card-app p-6">
            <div className="mb-8 flex items-center gap-4">
              <div className="rounded-xl bg-green-500/10 p-3">
                <Download className="h-5 w-5 text-green-400" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-app">
                  Data Export
                </h2>

                <p className="text-sm text-app-muted">
                  Download all your data.
                </p>
              </div>
            </div>

            <Button
              onClick={exportData}
              disabled={loading}
              className="h-12 w-full rounded-xl bg-green-500 text-black hover:bg-green-400"
            >
              {loading ? "Exporting..." : "Export Data"}
            </Button>
          </div>

          {/* Logout */}
          <Button
            onClick={logout}
            variant="outline"
            className="h-12 w-full rounded-xl border-app text-app hover:bg-app-elevated"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>

          {/* Legal Links */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
            <a href="/privacy" className="text-xs link-muted">
              Privacy
            </a>
            <a href="/terms" className="text-xs link-muted">
              Terms
            </a>
            <a href="/contact" className="text-xs link-muted">
              Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
