"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FooterNav } from "@/components/legal/footer-nav";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

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
    </div>
  );
}
