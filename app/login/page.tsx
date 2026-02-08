"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/src/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Check if user is already authenticated
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const redirect = searchParams.get("redirect") || "/dashboard";
        router.replace(redirect);
      } else {
        setChecking(false);
      }
    });
  }, [router, searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Redirect to the originally intended page, or dashboard
        const redirect = searchParams.get("redirect") || "/dashboard";
        router.push(redirect);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show nothing while checking auth status
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-500 dark:border-t-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8 border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl font-bold text-center mb-6 text-zinc-900 dark:text-zinc-100">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </h1>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
            className="text-blue-600 hover:underline"
          >
            {mode === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-500 dark:border-t-zinc-400 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
