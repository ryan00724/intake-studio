"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCachedThumbnail, setCachedThumbnail } from "@/lib/thumbnail-cache";

interface Intake {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  workspace_id: string;
  draft_json?: {
    metadata?: { title?: string; theme?: any; description?: string };
    sections?: any[];
  };
  submissions: { count: number }[];
}

// ── Cached iframe preview ──────────────────────────────────────────
function IframePreview({
  slug,
  intakeId,
  updatedAt,
}: {
  slug: string;
  intakeId: string;
  updatedAt: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.2);
  const [cachedSrc, setCachedSrc] = useState<string | null | undefined>(undefined); // undefined = loading cache check

  // Check IndexedDB for a cached thumbnail
  useEffect(() => {
    let cancelled = false;
    getCachedThumbnail(intakeId, updatedAt).then((url) => {
      if (!cancelled) setCachedSrc(url);
    });
    return () => { cancelled = true; };
  }, [intakeId, updatedAt]);

  // Measure container for scale
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setScale(entry.contentRect.width / 1280);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // After iframe loads, capture it with html2canvas and cache
  const handleIframeLoad = useCallback(async () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc?.body) return;
      // Wait a bit for rendering to settle (videos, animations, etc.)
      await new Promise((r) => setTimeout(r, 1500));
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(doc.body, {
        width: 1280,
        height: 900,
        scale: 0.5, // Capture at half resolution for smaller cache size
        useCORS: true,
        logging: false,
        windowWidth: 1280,
        windowHeight: 900,
      });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      setCachedSrc(dataUrl);
      await setCachedThumbnail(intakeId, updatedAt, dataUrl);
    } catch {
      // Capture failed (cross-origin, etc.) -- keep showing iframe
    }
  }, [intakeId, updatedAt]);

  // Still checking cache
  if (cachedSrc === undefined) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
        <div className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-500 dark:border-t-zinc-400 animate-spin" />
      </div>
    );
  }

  // Cached image available
  if (cachedSrc) {
    return (
      <div ref={containerRef} className="w-full h-full overflow-hidden">
        <img
          src={cachedSrc}
          alt="Preview"
          className="w-full h-full object-cover object-top"
        />
      </div>
    );
  }

  // No cache -- render live iframe and capture on load
  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden relative">
      <iframe
        ref={iframeRef}
        src={`/i/${slug}`}
        title="Preview"
        loading="lazy"
        tabIndex={-1}
        onLoad={handleIframeLoad}
        className="absolute top-0 left-0 border-0 pointer-events-none"
        style={{
          width: "1280px",
          height: "900px",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

// ── Placeholder for draft / empty intakes ──────────────────────────
function DraftPlaceholder({ title, theme }: { title: string; theme?: any }) {
  const accent = theme?.accentColor || "#3b82f6";
  const bg = theme?.background?.color;
  const letter = (title || "U").charAt(0).toUpperCase();

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2"
      style={{
        background: bg
          ? bg
          : `linear-gradient(135deg, ${accent}22 0%, ${accent}08 100%)`,
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg"
        style={{ backgroundColor: accent }}
      >
        {letter}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        Draft
      </span>
    </div>
  );
}

// ── Intake card ────────────────────────────────────────────────────
function IntakeCard({
  intake,
  copiedSlug,
  onCopyLink,
  onDelete,
}: {
  intake: Intake;
  copiedSlug: string | null;
  onCopyLink: (slug: string) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const count = intake.submissions?.[0]?.count || 0;
  const hasSections =
    intake.draft_json?.sections && intake.draft_json.sections.length > 0;
  const showIframe = intake.is_published;

  return (
    <div className="group flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-md overflow-hidden">
      {/* Preview area */}
      <Link href={`/e/${intake.id}`} className="block">
        <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800/50 overflow-hidden relative">
          {showIframe ? (
            <IframePreview
              slug={intake.slug}
              intakeId={intake.id}
              updatedAt={intake.updated_at}
            />
          ) : (
            <DraftPlaceholder
              title={intake.title}
              theme={intake.draft_json?.metadata?.theme}
            />
          )}
        </div>
      </Link>

      {/* Info area */}
      <div className="px-3 pb-3 pt-2 flex flex-col gap-1.5">
        {/* Title row */}
        <Link href={`/e/${intake.id}`} className="block min-w-0">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate leading-tight">
            {intake.title}
          </h3>
        </Link>

        {/* Meta row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {intake.is_published ? (
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" />
            ) : (
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            )}
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
              {timeAgo(intake.updated_at)}
            </span>
          </div>

          {count > 0 && (
            <Link
              href={`/e/${intake.id}/submissions`}
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] font-medium text-blue-500 dark:text-blue-400 hover:underline flex-shrink-0"
            >
              {count} response{count !== 1 ? "s" : ""}
            </Link>
          )}
        </div>

        {/* Hover actions */}
        <div className="flex items-center gap-1 -mx-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity h-7">
          <Link
            href={`/e/${intake.id}`}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Edit"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Link>

          {intake.is_published && (
            <>
              <a
                href={`/i/${intake.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="View published"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              <button
                onClick={() => onCopyLink(intake.slug)}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title={copiedSlug === intake.slug ? "Copied!" : "Copy link"}
              >
                {copiedSlug === intake.slug ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </>
          )}

          <div className="flex-1" />

          <button
            onClick={() => onDelete(intake.id, intake.title)}
            className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helper ─────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ── Page ───────────────────────────────────────────────────────────
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
    loadIntakes();
  }, [loadIntakes]);

  const ensureWorkspace = async (): Promise<string | null> => {
    if (workspaceId) return workspaceId;
    try {
      const wsRes = await fetch("/api/workspaces");
      const wsData = wsRes.ok ? await wsRes.json() : null;
      if (wsData?.id) {
        setWorkspaceId(wsData.id);
        return wsData.id;
      }
      const createRes = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Workspace" }),
      });
      if (!createRes.ok) return null;
      const newWs = await createRes.json();
      setWorkspaceId(newWs.id);
      return newWs.id;
    } catch {
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
        body: JSON.stringify({ title: "Untitled Intake", workspace_id: wsId }),
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
      if (res.ok) setIntakes((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/i/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading...</div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-zinc-800 to-zinc-950 dark:from-white dark:to-zinc-200 rounded-lg shadow-sm">
              <span className="text-white dark:text-zinc-900 font-bold text-lg">I</span>
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              Intake Studio
            </span>
          </div>
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={createIntake}
              disabled={creating}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {creating ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle className="opacity-25" cx="12" cy="12" r="10"/><path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                  New Intake
                </>
              )}
            </button>
            <span className="text-[11px] text-zinc-300 dark:text-zinc-600 px-1 select-none">or</span>
            <Link
              href="/create/ai"
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-700/60 hover:text-zinc-900 dark:hover:text-zinc-100 hover:shadow-sm transition-all flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/></svg>
              AI Generate
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Your Intakes
          </h1>
          <span className="text-sm text-zinc-400">
            {intakes.length} intake{intakes.length !== 1 ? "s" : ""}
          </span>
        </div>

        {intakes.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 border-dashed">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              No intakes yet
            </h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
              Create your first client intake form to start collecting structured information.
            </p>
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={createIntake}
                  disabled={creating}
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                  New Intake
                </button>
                <span className="text-xs text-zinc-300 dark:text-zinc-600 px-1.5 select-none">or</span>
                <Link
                  href="/create/ai"
                  className="px-5 py-2 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-700/60 hover:text-zinc-900 dark:hover:text-zinc-100 hover:shadow-sm transition-all flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/></svg>
                  AI Generate
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {intakes.map((intake) => (
              <IntakeCard
                key={intake.id}
                intake={intake}
                copiedSlug={copiedSlug}
                onCopyLink={copyLink}
                onDelete={deleteIntake}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
