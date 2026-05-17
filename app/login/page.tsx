"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast, Toaster } from "sonner";
import { OAuthButtonGroup } from "@/components/auth/oauth-button-group";
import { FooterNav } from "@/components/legal/footer-nav";

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
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorDesc = params.get("error_description");
    if (errorDesc) {
      toast.error(sanitizeErrorMessage(errorDesc));
      // Clean URL without reload
      window.history.replaceState({}, "", "/login");
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
    setLoading(true);
    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert("Account created!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else window.location.href = "/dashboard";
    }
    setLoading(false);
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
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-app mb-6 w-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/30"
        />
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
