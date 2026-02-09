"use client";

import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCachedThumbnail, setCachedThumbnail } from "@/lib/thumbnail-cache";
import { supabase } from "@/src/lib/supabase/client";

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

type StatusFilter = "all" | "published" | "draft";
type SortKey = "updated" | "created" | "name" | "responses";

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
  selected,
  onToggleSelect,
}: {
  intake: Intake;
  copiedSlug: string | null;
  onCopyLink: (slug: string) => void;
  onDelete: (id: string, title: string) => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const count = intake.submissions?.[0]?.count || 0;
  const hasSections =
    intake.draft_json?.sections && intake.draft_json.sections.length > 0;
  const showIframe = intake.is_published;

  return (
    <div className={`group flex flex-col bg-white dark:bg-zinc-900 rounded-xl border transition-all hover:shadow-md overflow-hidden ${selected ? "border-blue-400 dark:border-blue-600 ring-1 ring-blue-400/30" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}>
      {/* Preview area */}
      <Link href={`/e/${intake.id}`} className="block relative">
        <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800/50 overflow-hidden relative">
          {/* Selection checkbox */}
          <div
            className={`absolute top-2 left-2 z-10 transition-opacity ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelect(); }}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer ${selected ? "bg-blue-500 border-blue-500" : "bg-white/80 dark:bg-zinc-800/80 border-zinc-300 dark:border-zinc-600 backdrop-blur-sm hover:border-blue-400"}`}>
              {selected && (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </div>
          </div>
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

// ── Sort helpers ─────────────────────────────────────────────────────
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "updated", label: "Last updated" },
  { key: "created", label: "Date created" },
  { key: "name", label: "Name" },
  { key: "responses", label: "Responses" },
];

function sortIntakes(list: Intake[], key: SortKey): Intake[] {
  const sorted = [...list];
  switch (key) {
    case "updated":
      return sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    case "created":
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case "name":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "responses":
      return sorted.sort((a, b) => ((b.submissions?.[0]?.count || 0) - (a.submissions?.[0]?.count || 0)));
    default:
      return sorted;
  }
}

// ── Page (inner) ────────────────────────────────────────────────────
function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Search, filter, sort state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Open AI modal if ?ai=true in URL
  useEffect(() => {
    if (searchParams.get("ai") === "true") {
      setAiModalOpen(true);
      // Clean the URL param without navigation
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams]);

  // Derived filtered + sorted list
  const filtered = useMemo(() => {
    let list = intakes;

    // Status filter
    if (statusFilter === "published") list = list.filter((i) => i.is_published);
    else if (statusFilter === "draft") list = list.filter((i) => !i.is_published);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.title.toLowerCase().includes(q) || i.slug.toLowerCase().includes(q));
    }

    // Sort
    return sortIntakes(list, sortKey);
  }, [intakes, statusFilter, search, sortKey]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [search, statusFilter, sortKey]);

  const loadIntakes = useCallback(async () => {
    try {
      const wsRes = await fetch("/api/workspaces");
      const wsData = wsRes.ok ? await wsRes.json() : null;
      if (wsData?.id) setWorkspaceId(wsData.id);

      const res = await fetch("/api/intakes");
      if (res.ok) {
        const data = await res.json();
        setIntakes(data);
        if (data.length > 0 && !wsData?.id) setWorkspaceId(data[0].workspace_id);
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
      if (wsData?.id) { setWorkspaceId(wsData.id); return wsData.id; }
      const createRes = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Workspace" }),
      });
      if (!createRes.ok) return null;
      const newWs = await createRes.json();
      setWorkspaceId(newWs.id);
      return newWs.id;
    } catch { return null; }
  };

  const createIntake = async () => {
    setCreating(true);
    try {
      const wsId = await ensureWorkspace();
      if (!wsId) { alert("Could not create workspace. Check your Supabase connection."); setCreating(false); return; }
      const res = await fetch("/api/intakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Intake", workspace_id: wsId }),
      });
      if (!res.ok) throw new Error("Failed to create intake");
      const newIntake = await res.json();
      router.push(`/e/${newIntake.id}`);
    } catch (e: any) { alert(e.message); setCreating(false); }
  };

  const deleteIntake = async (id: string, title: string) => {
    setConfirmDialog({
      title: "Delete intake",
      message: `Delete "${title}"? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/intakes/${id}`, { method: "DELETE" });
          if (res.ok) {
            setIntakes((prev) => prev.filter((i) => i.id !== id));
            setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
          }
        } catch (e) { console.error("Delete failed", e); }
      },
    });
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    setConfirmDialog({
      title: "Delete intakes",
      message: `Delete ${count} intake${count !== 1 ? "s" : ""}? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setBulkDeleting(true);
        try {
          const ids = Array.from(selectedIds);
          await Promise.all(ids.map((id) => fetch(`/api/intakes/${id}`, { method: "DELETE" })));
          setIntakes((prev) => prev.filter((i) => !ids.includes(i.id)));
          setSelectedIds(new Set());
        } catch (e) { console.error("Bulk delete failed", e); }
        finally { setBulkDeleting(false); }
      },
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((i) => i.id)));
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/i/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Status counts
  const publishedCount = intakes.filter((i) => i.is_published).length;
  const draftCount = intakes.filter((i) => !i.is_published).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading...</div>
      </div>
    );
  }

  const NAV_ITEMS: { key: StatusFilter; label: string; count: number; icon: React.ReactNode }[] = [
    { key: "all", label: "All Intakes", count: intakes.length, icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
    { key: "published", label: "Published", count: publishedCount, icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> },
    { key: "draft", label: "Drafts", count: draftCount, icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg> },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 h-screen sticky top-0 flex flex-col">
        {/* Logo */}
        <div className="px-4 h-14 flex items-center gap-2.5 border-b border-zinc-100 dark:border-zinc-800/60">
          <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-zinc-800 to-zinc-950 dark:from-white dark:to-zinc-200 rounded-lg shadow-sm">
            <span className="text-white dark:text-zinc-900 font-bold text-sm">I</span>
          </div>
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Intake Studio</span>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            />
          </div>
        </div>

        {/* Nav items */}
        <nav className="px-2 py-1 flex-1">
          <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 mb-1.5">Filter</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors mb-0.5 ${
                statusFilter === item.key
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <span className={statusFilter === item.key ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-500"}>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              <span className={`text-[11px] tabular-nums ${statusFilter === item.key ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-400 dark:text-zinc-500"}`}>{item.count}</span>
            </button>
          ))}

          <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 mt-5 mb-1.5">Sort by</div>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors mb-0.5 ${
                sortKey === opt.key
                  ? "text-zinc-900 dark:text-zinc-100 font-medium"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {sortKey === opt.key && <span className="w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />}
              {sortKey !== opt.key && <span className="w-1 h-1 flex-shrink-0" />}
              {opt.label}
            </button>
          ))}
        </nav>

        {/* Bottom: settings + sign out */}
        <div className="px-2 pb-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 space-y-0.5">
          <Link
            href="/settings"
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Settings
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────── */}
      <main className="flex-1 min-w-0 p-6 overflow-y-auto">
        {intakes.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 border-dashed max-w-lg mx-auto mt-20">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">No intakes yet</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">Create your first client intake form to start collecting structured information.</p>
            <button onClick={createIntake} disabled={creating}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-sm transition-all disabled:opacity-50 inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
              New Intake
            </button>
          </div>
        ) : (
          <>
            {/* ── Top bar: title + create buttons + select all ───── */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {statusFilter === "all" ? "All Intakes" : statusFilter === "published" ? "Published" : "Drafts"}
                </h1>
                <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{filtered.length}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Select all — only visible once at least one card is selected */}
                {selectedIds.size > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 transition-colors"
                  >
                    {selectedIds.size === filtered.length ? "Deselect all" : `${selectedIds.size} selected · Select all`}
                  </button>
                )}

                <button
                  onClick={createIntake}
                  disabled={creating}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creating ? (
                    <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle className="opacity-25" cx="12" cy="12" r="10"/><path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Creating...</>
                  ) : (
                    <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>New Intake</>
                  )}
                </button>
                <button
                  onClick={() => setAiModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/></svg>
                  AI Generate
                </button>
              </div>
            </div>

            {/* ── Grid / no results ──────────────────────────────── */}
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-zinc-400">No intakes match your filters</p>
                <button onClick={() => { setSearch(""); setStatusFilter("all"); }} className="mt-2 text-xs text-blue-500 hover:underline">Clear filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filtered.map((intake) => (
                  <IntakeCard
                    key={intake.id}
                    intake={intake}
                    copiedSlug={copiedSlug}
                    onCopyLink={copyLink}
                    onDelete={deleteIntake}
                    selected={selectedIds.has(intake.id)}
                    onToggleSelect={() => toggleSelect(intake.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── AI Generate Modal ──────────────────────────────────── */}
      {aiModalOpen && (
        <AIGenerateModal
          onClose={() => setAiModalOpen(false)}
          ensureWorkspace={ensureWorkspace}
        />
      )}

      {/* ── Confirmation Dialog ─────────────────────────────────── */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmDialog(null)}>
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400">
                  <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{confirmDialog.title}</h3>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 ml-[52px]">{confirmDialog.message}</p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Wrapped export with Suspense (for useSearchParams) ─────────
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading...</div>
      </div>
    }>
      <DashboardInner />
    </Suspense>
  );
}

// ── AI Generate Modal ──────────────────────────────────────────
function AIGenerateModal({
  onClose,
  ensureWorkspace,
}: {
  onClose: () => void;
  ensureWorkspace: () => Promise<string | null>;
}) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Discovery");
  const [complexity, setComplexity] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      // 1. Generate intake content via AI
      const genRes = await fetch("/api/generate-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, type, complexity }),
      });

      if (!genRes.ok) {
        const errorData = await genRes.json();
        throw new Error(errorData.error || "Failed to generate intake");
      }

      const data = await genRes.json();

      // 2. Ensure workspace
      const wsId = await ensureWorkspace();
      if (!wsId) throw new Error("Could not create workspace");

      // 3. Create intake in DB
      const title = data.metadata?.title || "AI Generated Intake";
      const createRes = await fetch("/api/intakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, workspace_id: wsId }),
      });
      if (!createRes.ok) throw new Error("Failed to create intake");
      const newIntake = await createRes.json();

      // 4. Save generated content as draft
      await fetch(`/api/intakes/${newIntake.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_json: { sections: data.sections, metadata: data.metadata, edges: [] },
          title,
        }),
      });

      // 5. Redirect to editor
      router.push(`/e/${newIntake.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={isGenerating ? undefined : onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Generate with AI</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Describe your needs and AI will build a starting template.</p>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">Describe your business & goals</label>
            <textarea
              placeholder="E.g. I run a digital marketing agency. I need to onboard new clients, understand their budget, current social media presence, and design preferences..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[120px] px-3 py-2.5 rounded-xl text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">Intake type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
              >
                <option value="Discovery">Discovery Call</option>
                <option value="Onboarding">Client Onboarding</option>
                <option value="Project Brief">Project Brief</option>
                <option value="Feedback">Feedback Survey</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">Complexity</label>
              <select
                value={complexity}
                onChange={(e) => setComplexity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
              >
                <option value="simple">Simple (2-3 sections)</option>
                <option value="medium">Medium (4-6 sections)</option>
                <option value="detailed">Detailed (7-10 sections)</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg border border-red-200 dark:border-red-900/50">
              <p className="font-medium">Generation failed</p>
              <p className="opacity-90 mt-0.5">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center gap-2">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !description.trim()}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : error ? "Try again" : "Generate intake"}
          </button>
        </div>
      </div>
    </div>
  );
}
