"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";
import { OAuthButtonGroup } from "@/components/auth/oauth-button-group";
import { FooterNav } from "@/components/legal/footer-nav";
import { validateEmail } from "@/lib/auth/validation";

function sanitizeErrorMessage(raw: string): string {
  let message = raw.slice(0, 200);
  // Remove stack trace lines
  message = message.replace(/\s*at\s+.*/g, "");
  // Remove JSON-like content
  message = message.replace(/\{[^}]*\}/g, "");
  // Remove HTTP status codes like "404" or "500"
  message = message.replace(/\b[1-5]\d{2}\b/g, "");
  // Trim whitespace
  message = message.trim();
  return message || "Authentication failed";
}

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetEmailError, setResetEmailError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorDesc = params.get("error_description");
    if (errorDesc) {
      toast.error(sanitizeErrorMessage(errorDesc));
      // Clean URL without reload
      window.history.replaceState({}, "", "/login");
    }
    if (params.get("mode") === "signup") {
      setIsSignup(true);
    }
  }, []);

  async function handleAuth() {
    if (!email.trim()) {
      alert("Please enter your email");
      return;
    }
    if (!password.trim()) {
      alert("Please enter your password");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    if (isSignup && !fullName.trim()) {
      alert("Please enter your name");
      return;
    }
    if (isSignup && password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);
    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      });
      if (error) alert(error.message);
      else alert("Account created!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else window.location.href = "/dashboard";
    }
    setLoading(false);
  }

  async function handleResetPassword() {
    setResetEmailError("");

    const validation = validateEmail(resetEmail);
    if (!validation.valid) {
      setResetEmailError(validation.error || "Please enter a valid email address");
      return;
    }

    setResetLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?type=recovery`;
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo,
      });

      // Anti-enumeration: show same message for success and "user not found" errors
      if (!error || error.message?.toLowerCase().includes("not found") || error.message?.toLowerCase().includes("not registered")) {
        setResetSuccess(true);
      } else {
        // Network or server error — show toast and re-enable button
        toast.error("Could not send reset link. Please try again.");
      }
    } catch {
      toast.error("Could not send reset link. Please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  if (forgotPassword) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-app p-6">
        <div className="panel-app w-full max-w-md p-8">
          <h1 className="mb-2 text-3xl font-bold text-app">Reset password</h1>
          <p className="mb-6 text-app-muted">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          {resetSuccess ? (
            <div className="space-y-4">
              <p className="text-app" role="status">
                If an account exists with that email, we&apos;ve sent a password reset link.
              </p>
              <button
                type="button"
                onClick={() => {
                  setForgotPassword(false);
                  setResetSuccess(false);
                  setResetEmail("");
                  setResetEmailError("");
                }}
                className="text-sm text-app-muted hover:text-app"
              >
                Back to login
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={resetEmail}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    if (resetEmailError) setResetEmailError("");
                  }}
                  maxLength={254}
                  className="input-app w-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/30"
                  aria-describedby={resetEmailError ? "reset-email-error" : undefined}
                  aria-invalid={resetEmailError ? true : undefined}
                />
                {resetEmailError && (
                  <p
                    id="reset-email-error"
                    className="mt-2 text-sm text-red-500"
                    role="alert"
                  >
                    {resetEmailError}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="btn-primary-app w-full px-4 py-3 disabled:opacity-50"
              >
                {resetLoading ? "Sending..." : "Send reset link"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotPassword(false);
                  setResetEmailError("");
                  setResetEmail("");
                }}
                className="text-sm text-app-muted hover:text-app"
              >
                Back to login
              </button>
            </div>
          )}
        </div>
        <div className="mt-8">
          <FooterNav />
        </div>
        <Toaster richColors position="top-right" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app p-6">
      <div className="panel-app w-full max-w-md p-8">
        <h1 className="mb-2 text-3xl font-bold text-app">
          {isSignup ? "Create account" : "Welcome back"}
        </h1>
        <p className="mb-6 text-app-muted">Sign in to Home OS</p>

        <OAuthButtonGroup onError={(message) => toast.error(message)} />

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 border-t border-app" />
          <span className="text-app-muted text-xs">or</span>
          <div className="flex-1 border-t border-app" />
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-app mb-4 w-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        {isSignup && (
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="input-app mb-4 w-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        )}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-app mb-4 w-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        {isSignup && (
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="input-app mb-4 w-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        )}

        <div className="mb-4">
          <button
            type="button"
            onClick={() => setForgotPassword(true)}
            className="text-sm text-app-muted hover:text-app"
            aria-label="Reset your password"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="button"
          onClick={handleAuth}
          disabled={loading}
          className="btn-primary-app mb-4 w-full px-4 py-3 disabled:opacity-50"
        >
          {loading ? "Loading..." : isSignup ? "Create Account" : "Login"}
        </button>
        <button
          type="button"
          onClick={() => setIsSignup(!isSignup)}
          className="text-sm text-app-muted hover:text-app"
        >
          {isSignup ? "Already have an account?" : "Create an account"}
        </button>
      </div>
      <div className="mt-8">
        <FooterNav />
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
