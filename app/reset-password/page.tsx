"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validatePasswords } from "@/lib/auth/validation";
import { toast, Toaster } from "sonner";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tokenExpired, setTokenExpired] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
        return;
      }

      // Check if this is a recovery session by inspecting authentication methods
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const methods = data?.currentAuthenticationMethods ?? [];
      const isRecovery = methods.some((entry) =>
        typeof entry === "string"
          ? entry === "recovery" || entry === "otp"
          : entry.method === "recovery" || entry.method === "otp"
      );

      if (!isRecovery) {
        router.replace("/dashboard");
        return;
      }

      setChecking(false);
    }

    checkSession();
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setTokenExpired(false);

    const validation = validatePasswords(password, confirm);
    if (!validation.valid) {
      setError(validation.error || "Invalid password");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setLoading(false);

      // Check for expired/invalid token errors
      const msg = updateError.message.toLowerCase();
      if (
        msg.includes("expired") ||
        msg.includes("invalid") ||
        msg.includes("token")
      ) {
        setTokenExpired(true);
        return;
      }

      // Show the actual error message from Supabase if available
      const errorMessage = updateError.message || "Could not update password. Please try again.";
      toast.error(errorMessage);
      return;
    }

    toast.success("Password updated successfully!");
    setTimeout(() => {
      router.replace("/dashboard");
    }, 2000);
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <p className="text-app-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app p-6">
      <div className="panel-app w-full max-w-md p-8">
        <h1 className="mb-2 text-3xl font-bold text-app">Set new password</h1>
        <p className="mb-6 text-app-muted">Enter your new password below</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="new-password" className="mb-1 block text-sm text-app">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-app mb-4 w-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/30"
            disabled={loading}
          />

          <label htmlFor="confirm-password" className="mb-1 block text-sm text-app">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input-app mb-6 w-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/30"
            disabled={loading}
          />

          {error && (
            <p className="mb-4 text-sm text-red-500">{error}</p>
          )}

          {tokenExpired && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <p className="text-sm text-red-600 dark:text-red-400">
                Your reset link has expired or is invalid.{" "}
                <a
                  href="/login"
                  className="font-medium underline hover:no-underline"
                >
                  Request a new one
                </a>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-app w-full px-4 py-3 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
