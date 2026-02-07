"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Intake {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  workspace_id: string;
  submissions: { count: number }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const loadIntakes = useCallback(async () => {
    try {
      const res = await fetch("/api/intakes");
      if (res.ok) {
        const data = await res.json();
        setIntakes(data);
        if (data.length > 0) {
          setWorkspaceId(data[0].workspace_id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Auto-create workspace on first visit if none exist
    async function init() {
      await loadIntakes();
    }
    init();
  }, [loadIntakes]);

  const ensureWorkspace = async (): Promise<string | null> => {
    if (workspaceId) return workspaceId;

    try {
      // Try to find an existing workspace via server API
      const wsRes = await fetch("/api/workspaces");
      const wsData = wsRes.ok ? await wsRes.json() : null;

      if (wsData?.id) {
        setWorkspaceId(wsData.id);
        return wsData.id;
      }

      // Create a default workspace via server API
      const createRes = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Workspace" }),
      });

      if (!createRes.ok) {
        console.error("Failed to create workspace");
        return null;
      }

      const newWs = await createRes.json();
      setWorkspaceId(newWs.id);
      return newWs.id;
    } catch (err) {
      console.error("Failed to ensure workspace:", err);
      return null;
    }
  };

  const createIntake = async () => {
    setCreating(true);
    try {
      const wsId = await ensureWorkspace();
      if (!wsId) {
        alert("Could not create workspace. Check your Supabase connection.");
        setCreating(false);
        return;
      }

      const res = await fetch("/api/intakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Intake",
          workspace_id: wsId,
        }),
      });

      if (!res.ok) throw new Error("Failed to create intake");

      const newIntake = await res.json();
      router.push(`/e/${newIntake.id}`);
    } catch (e: any) {
      alert(e.message);
      setCreating(false);
    }
  };

  const deleteIntake = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/intakes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setIntakes((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/i/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
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
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg shadow-sm">
              <span className="text-white dark:text-zinc-900 font-bold text-lg">I</span>
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Intake Studio</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/create/ai"
              className="px-4 py-2 rounded-lg text-sm font-medium text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20 transition-colors flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 0-4 4c0 2 1.5 3.5 3 4.5V12H9a4 4 0 0 0-4 4v1h14v-1a4 4 0 0 0-4-4h-2v-1.5c1.5-1 3-2.5 3-4.5a4 4 0 0 0-4-4Z"/><path d="M15 22v-2"/><path d="M9 22v-2"/><path d="M12 22v-2"/></svg>
              AI Generate
            </Link>
            <button
              onClick={createIntake}
              disabled={creating}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle className="opacity-25" cx="12" cy="12" r="10"/><path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                  New Intake
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Your Intakes</h1>
          <span className="text-sm text-zinc-400">{intakes.length} intake{intakes.length !== 1 ? "s" : ""}</span>
        </div>

        {intakes.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 border-dashed">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">No intakes yet</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">Create your first client intake form to start collecting structured information.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={createIntake}
                disabled={creating}
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                Create Intake
              </button>
              <Link
                href="/create/ai"
                className="px-5 py-2.5 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Generate with AI
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {intakes.map((intake) => (
              <div
                key={intake.id}
                className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-sm"
              >
                <div className="flex items-center justify-between p-5">
                  <Link href={`/e/${intake.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{intake.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-zinc-400 font-mono">/{intake.slug}</span>
                          <span className="text-zinc-200 dark:text-zinc-700">|</span>
                          <span className="text-xs text-zinc-400">{timeAgo(intake.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 ml-4">
                    {intake.is_published ? (
                      <span className="px-2.5 py-1 text-[11px] font-medium bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-full">Published</span>
                    ) : (
                      <span className="px-2.5 py-1 text-[11px] font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 rounded-full">Draft</span>
                    )}

                    {/* Responses badge */}
                    {(() => {
                      const count = intake.submissions?.[0]?.count || 0;
                      return (
                        <Link
                          href={`/e/${intake.id}/submissions`}
                          onClick={(e) => e.stopPropagation()}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
                            count > 0
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                              : "bg-zinc-50 text-zinc-400 dark:bg-zinc-800/50 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          }`}
                          title={`${count} response${count !== 1 ? "s" : ""}`}
                        >
                          {count > 0 ? `${count} response${count !== 1 ? "s" : ""}` : "No responses"}
                        </Link>
                      );
                    })()}

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/e/${intake.id}`}
                        className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </Link>

                      {intake.is_published && (
                        <>
                          <a
                            href={`/i/${intake.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="View published"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </a>
                          <button
                            onClick={() => copyLink(intake.slug)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title={copiedSlug === intake.slug ? "Copied!" : "Copy link"}
                          >
                            {copiedSlug === intake.slug ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            )}
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => deleteIntake(intake.id, intake.title)}
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
