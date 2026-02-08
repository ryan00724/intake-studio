"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();

  // User info
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || "");
        setUserId(user.id);
      }
      setLoading(false);
    });
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);

    if (newPassword.length < 6) {
      setPwMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwMessage({ type: "success", text: "Password updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwMessage({ type: "error", text: err.message || "Failed to update password." });
    } finally {
      setPwLoading(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMessage(null);

    if (!newEmail || newEmail === email) {
      setEmailMessage({ type: "error", text: "Please enter a different email address." });
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setEmailMessage({ type: "success", text: "Confirmation email sent to your new address. Check your inbox." });
      setNewEmail("");
    } catch (err: any) {
      setEmailMessage({ type: "error", text: err.message || "Failed to update email." });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-1.5 -ml-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* ── Profile info ─────────────────────────────────────── */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Profile</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Email</label>
              <p className="text-sm text-zinc-900 dark:text-zinc-100">{email}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">User ID</label>
              <p className="text-xs text-zinc-400 font-mono select-all">{userId}</p>
            </div>
          </div>
        </section>

        {/* ── Change email ─────────────────────────────────────── */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Change email</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            A confirmation will be sent to your new email address.
          </p>
          <form onSubmit={handleEmailChange} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">New email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={email}
                className="w-full px-3 py-2 rounded-lg text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>
            {emailMessage && (
              <p className={`text-xs ${emailMessage.type === "success" ? "text-green-600" : "text-red-500"}`}>
                {emailMessage.text}
              </p>
            )}
            <button
              type="submit"
              disabled={emailLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {emailLoading ? "Sending..." : "Update email"}
            </button>
          </form>
        </section>

        {/* ── Change password ──────────────────────────────────── */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Change password</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Must be at least 6 characters.
          </p>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
                minLength={6}
              />
            </div>
            {pwMessage && (
              <p className={`text-xs ${pwMessage.type === "success" ? "text-green-600" : "text-red-500"}`}>
                {pwMessage.text}
              </p>
            )}
            <button
              type="submit"
              disabled={pwLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {pwLoading ? "Updating..." : "Update password"}
            </button>
          </form>
        </section>

        {/* ── Sign out ─────────────────────────────────────────── */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Session</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Sign out of your account on this device.
          </p>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Sign out
          </button>
        </section>

        {/* ── Danger zone ──────────────────────────────────────── */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-900/40 p-6">
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Danger zone</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                Type <span className="font-mono text-red-500">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-lg text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>
            <button
              disabled={deleteConfirm !== "DELETE"}
              onClick={() => alert("Account deletion requires a server-side admin endpoint. Contact support to delete your account.")}
              className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Delete account
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
