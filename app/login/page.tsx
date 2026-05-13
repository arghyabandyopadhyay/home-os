"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        alert(error.message);
      } else {
        alert("Account created!");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
      } else {
        window.location.href = "/dashboard";
      }
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111118]/80 p-8 shadow-[0_10px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <h1 className="mb-2 text-3xl font-bold">
          {isSignup ? "Create account" : "Welcome back"}
        </h1>

        <p className="mb-6 text-zinc-400">Sign in to Home OS</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 outline-none"
        />

        <button
          onClick={handleAuth}
          disabled={loading}
          className="mb-4 w-full rounded-xl bg-white px-4 py-3 font-medium text-black transition hover:opacity-90"
        >
          {loading ? "Loading..." : isSignup ? "Create Account" : "Login"}
        </button>

        <button
          onClick={() => setIsSignup(!isSignup)}
          className="text-sm text-zinc-400"
        >
          {isSignup ? "Already have an account?" : "Create an account"}
        </button>
      </div>
    </div>
  );
}
