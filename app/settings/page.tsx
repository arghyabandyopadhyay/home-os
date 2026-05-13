"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  User,
  Lock,
  Bell,
  Palette,
  Download,
  Trash2,
  LogOut,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

interface UserProfile {
  full_name: string;
  email: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile>({
    full_name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [theme, setTheme] = useState("dark");
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    tasks: true,
    notes: false,
  });
  const supabase = createClient();

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
    let isMounted = true;

    if (isMounted) {
      loadProfile();
    }

    return () => {
      isMounted = false;
    };
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [notes, tasks, contacts, books] = await Promise.all([
        supabase.from("notes").select("*").eq("user_id", user.id),
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("contacts").select("*").eq("user_id", user.id),
        supabase.from("books").select("*").eq("user_id", user.id),
      ]);

      const data = {
        exportedAt: new Date().toISOString(),
        notes: notes.data || [],
        tasks: tasks.data || [],
        contacts: contacts.data || [],
        books: books.data || [],
      };

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
    } catch {
      toast.error("Failed to export data");
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
      const { error } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user?.id || "",
      );

      if (error) throw error;

      await supabase.auth.signOut();
      window.location.href = "/login";
      toast.success("Account deleted");
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Ambient Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-8 px-6 py-10">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-5xl font-semibold tracking-tight text-white">
              Settings
            </h1>

            <p className="mt-3 text-lg text-zinc-300/80">
              Manage your account, preferences and workspace.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#111118]/80 px-5 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-lg font-bold text-white">
              {profile.full_name?.charAt(0) || "U"}
            </div>

            <div>
              <p className="font-medium text-white">
                {profile.full_name || "User"}
              </p>

              <p className="text-sm text-zinc-300/70">{profile.email}</p>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 xl:col-span-2">
            {/* Profile */}
            <Card className="border border-white/10 bg-[#111118]/80 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              ></motion.div>
              <CardContent className="p-7">
                <div className="mb-8 flex items-center gap-4">
                  <div className="rounded-xl bg-blue-500/10 p-3">
                    <User className="h-5 w-5 text-blue-400" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      Profile Settings
                    </h2>

                    <p className="text-sm text-zinc-300/70">
                      Update your personal information.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm text-white/90">
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
                      className="h-12 border-white/10 bg-black/30 text-white placeholder:text-zinc-500 focus-visible:border-blue-500/50 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/90">
                      Email
                    </label>

                    <Input
                      value={profile.email}
                      disabled
                      className="h-12 border-white/5 bg-black/20 text-zinc-300"
                    />

                    <p className="mt-2 text-xs text-zinc-400">
                      Email cannot be changed
                    </p>
                  </div>

                  <Button
                    onClick={updateProfile}
                    disabled={loading}
                    className="h-12 w-full rounded-xl bg-white text-black hover:bg-zinc-200"
                  >
                    {loading ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Password */}
            <Card className="border border-white/10 bg-[#111118]/80 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              <CardContent className="p-7">
                <div className="mb-8 flex items-center gap-4">
                  <div className="rounded-xl bg-purple-500/10 p-3">
                    <Lock className="h-5 w-5 text-purple-400" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      Security
                    </h2>

                    <p className="text-sm text-zinc-300/70">
                      Change your password securely.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm text-white/90">
                      New Password
                    </label>

                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="h-12 border-white/10 bg-black/30 pr-12 text-white placeholder:text-zinc-500 focus-visible:border-purple-500/50 focus-visible:ring-2 focus-visible:ring-purple-500/20"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-white"
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
                    <label className="mb-2 block text-sm text-white/90">
                      Confirm Password
                    </label>

                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="h-12 border-white/10 bg-black/30 text-white placeholder:text-zinc-500 focus-visible:border-purple-500/50 focus-visible:ring-2 focus-visible:ring-purple-500/20"
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
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border border-red-500/20 bg-red-500/5 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              <CardContent className="p-7">
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

                <div className="rounded-2xl border border-red-500/20 bg-black/30 p-5">
                  <p className="mb-5 text-sm text-zinc-300/80">
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
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Notifications */}
            <Card className="border border-white/10 bg-[#111118]/80 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              <CardContent className="p-7">
                <div className="mb-8 flex items-center gap-4">
                  <div className="rounded-xl bg-orange-500/10 p-3">
                    <Bell className="h-5 w-5 text-orange-400" />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Notifications
                    </h2>

                    <p className="text-sm text-zinc-300/70">
                      Control alerts and reminders.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-white">
                          {key === "email"
                            ? "Email notifications"
                            : key === "push"
                              ? "Push notifications"
                              : key === "tasks"
                                ? "Task reminders"
                                : "Note updates"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setNotifications((prev) => ({
                            ...prev,
                            [key]: !prev[key as keyof typeof notifications],
                          }))
                        }
                        className={`relative h-6 w-11 rounded-full transition ${
                          value ? "bg-blue-500" : "bg-zinc-700"
                        }`}
                      >
                        <div
                          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                            value ? "left-6" : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card className="border border-white/10 bg-[#111118]/80 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              <CardContent className="p-7">
                <div className="mb-8 flex items-center gap-4">
                  <div className="rounded-xl bg-pink-500/10 p-3">
                    <Palette className="h-5 w-5 text-pink-400" />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Appearance
                    </h2>

                    <p className="text-sm text-zinc-300/70">
                      Customize your interface.
                    </p>
                  </div>
                </div>

                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-pink-500/50"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </CardContent>
            </Card>

            {/* Export */}
            <Card className="border border-white/10 bg-[#111118]/80 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              <CardContent className="p-7">
                <div className="mb-8 flex items-center gap-4">
                  <div className="rounded-xl bg-green-500/10 p-3">
                    <Download className="h-5 w-5 text-green-400" />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Data Export
                    </h2>

                    <p className="text-sm text-zinc-300/70">
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
              </CardContent>
            </Card>

            {/* Logout */}
            <Button
              onClick={logout}
              variant="outline"
              className="h-12 w-full rounded-xl border-white/10 bg-[#111118]/80 text-white hover:bg-white/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
