"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { Submission } from "@/types/editor";

interface BlockMeta {
  label: string;
  type: string;
  inputType?: string;
  sectionTitle?: string;
}

type BlockMap = Record<string, BlockMeta>;
type ViewMode = "list" | "table";

// ── Helpers ─────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAnswer(value: unknown): string {
  if (value === null || value === undefined) return "–";
  if (typeof value === "string") return value || "–";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "–";
    if (value[0]?.url) return value.map((v: any) => v.title || v.url).join(", ");
    if (value[0]?.bucket) return value.map((v: any) => `${v.bucket}: ${v.id}`).join(", ");
    return value.join(", ");
  }
  if (typeof value === "object") {
    if ("clicked" in (value as any)) return (value as any).clicked ? "Clicked" : "Not clicked";
    return JSON.stringify(value);
  }
  return String(value);
}

/** Get a human-readable preview from the first few answer values */
function getPreview(answers: Record<string, unknown>, blockMap: BlockMap, max = 2): string {
  const entries = Object.entries(answers);
  const previews: string[] = [];
  for (const [blockId, value] of entries) {
    if (previews.length >= max) break;
    const formatted = formatAnswer(value);
    if (formatted && formatted !== "–") {
      const label = blockMap[blockId]?.label || blockId;
      previews.push(`${label}: ${formatted.length > 60 ? formatted.slice(0, 60) + "…" : formatted}`);
    }
  }
  return previews.join(" · ") || "No answers";
}

/** Build CSV content from submissions + blockMap */
function buildCsv(submissions: Submission[], blockMap: BlockMap, blockOrder: string[]): string {
  // Headers: Date, then each block label
  const headers = ["Date", ...blockOrder.map((id) => blockMap[id]?.label || id)];
  const escape = (s: string) => {
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = submissions.map((sub) => {
    const date = formatDate(sub.created_at);
    const cells = blockOrder.map((id) => formatAnswer(sub.answers?.[id]));
    return [date, ...cells].map(escape).join(",");
  });

  return [headers.map(escape).join(","), ...rows].join("\n");
}

// ── Icons (inline SVGs) ─────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// ── Main Page ───────────────────────────────────────────────────────

export default function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [blockMap, setBlockMap] = useState<BlockMap>({});
  const [blockOrder, setBlockOrder] = useState<string[]>([]);
  const [intakeTitle, setIntakeTitle] = useState("Intake");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // ── Load data ───────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [subsRes, intakeRes] = await Promise.all([
          fetch(`/api/intakes/${id}/submissions`),
          fetch(`/api/intakes/${id}`),
        ]);

        if (subsRes.ok) setSubmissions(await subsRes.json());

        if (intakeRes.ok) {
          const intake = await intakeRes.json();
          setIntakeTitle(intake.title || "Intake");

          const draft = intake.draft_json || {};
          const sections = draft.sections || [];
          const map: BlockMap = {};
          const order: string[] = [];
          for (const section of sections) {
            for (const block of section.blocks || []) {
              // Skip presentation-only blocks
              if (["context", "heading", "divider", "image_display", "video_embed", "quote"].includes(block.type)) continue;
              map[block.id] = {
                label: block.label || block.title || block.text || block.type,
                type: block.type,
                inputType: block.inputType,
                sectionTitle: section.title,
              };
              order.push(block.id);
            }
          }
          setBlockMap(map);
          setBlockOrder(order);
        }
      } catch (e) {
        console.error("Failed to load submissions:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // ── Search filter ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return submissions;
    const q = search.toLowerCase();
    return submissions.filter((sub) => {
      // Search in date
      if (formatDate(sub.created_at).toLowerCase().includes(q)) return true;
      // Search in answer values
      for (const val of Object.values(sub.answers || {})) {
        if (formatAnswer(val).toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [submissions, search]);

  // ── Selection helpers ───────────────────────────────────────────
  const toggleSelect = (subId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(subId)) next.delete(subId);
      else next.add(subId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    }
  };

  // ── Delete ──────────────────────────────────────────────────────
  const handleDelete = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const label = ids.length === 1 ? "this submission" : `${ids.length} submissions`;
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/intakes/${id}/submissions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => !ids.includes(s.id)));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          ids.forEach((i) => next.delete(i));
          return next;
        });
        if (expandedId && ids.includes(expandedId)) setExpandedId(null);
      }
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      setDeleting(false);
    }
  }, [id, expandedId]);

  // ── Export ──────────────────────────────────────────────────────
  const exportCsv = () => {
    const csv = buildCsv(filtered, blockMap, blockOrder);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${intakeTitle.replace(/[^a-z0-9]/gi, "_")}_submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(filtered, null, 2));
  };

  // ── Loading ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading submissions...</div>
      </div>
    );
  }

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Back to Dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </Link>
            <div className="leading-tight">
              <h1 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{intakeTitle}</h1>
              <p className="text-[11px] text-zinc-400">
                {submissions.length} response{submissions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/e/${id}`}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Editor
            </Link>
          </div>
        </div>
      </header>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      {submissions.length > 0 && (
        <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
            {/* Left: search */}
            <div className="flex-1 max-w-sm relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              >
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search responses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1.5">
              {/* View toggle */}
              <div className="flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => setView("list")}
                  className={`p-1.5 rounded-md transition-colors ${view === "list" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-400 hover:text-zinc-600"}`}
                  title="List view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                </button>
                <button
                  onClick={() => setView("table")}
                  className={`p-1.5 rounded-md transition-colors ${view === "table" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-400 hover:text-zinc-600"}`}
                  title="Table view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /></svg>
                </button>
              </div>

              {/* Export CSV */}
              <button
                onClick={exportCsv}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                title="Download CSV"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                CSV
              </button>

              {/* Copy JSON */}
              <button
                onClick={copyJson}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                title="Copy as JSON"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                JSON
              </button>

              {/* Bulk delete */}
              {selectedIds.size > 0 && (
                <button
                  onClick={() => handleDelete(Array.from(selectedIds))}
                  disabled={deleting}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                  Delete {selectedIds.size}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {submissions.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 border-dashed">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">No submissions yet</h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              Share your published intake link with clients to start collecting responses.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-zinc-400">No results for &ldquo;{search}&rdquo;</p>
            <button onClick={() => setSearch("")} className="mt-2 text-xs text-blue-500 hover:underline">Clear search</button>
          </div>
        ) : view === "table" ? (
          /* ── Table View ──────────────────────────────────────── */
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="w-10 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">#</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                    {blockOrder.map((bId) => (
                      <th key={bId} className="px-3 py-2.5 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap max-w-[200px]">
                        {blockMap[bId]?.label || bId}
                      </th>
                    ))}
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filtered.map((sub, idx) => (
                    <tr key={sub.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(sub.id)}
                          onChange={() => toggleSelect(sub.id)}
                          className="w-3.5 h-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-zinc-400 text-xs font-medium">{submissions.length - submissions.indexOf(sub)}</td>
                      <td className="px-3 py-2.5 text-zinc-500 text-xs whitespace-nowrap">{formatShortDate(sub.created_at)}</td>
                      {blockOrder.map((bId) => (
                        <td key={bId} className="px-3 py-2.5 text-zinc-900 dark:text-zinc-100 text-xs max-w-[200px] truncate">
                          {formatAnswer(sub.answers?.[bId])}
                        </td>
                      ))}
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => handleDelete([sub.id])}
                          className="p-1 rounded text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── List View ───────────────────────────────────────── */
          <div className="space-y-2">
            {/* Select all row */}
            <div className="flex items-center gap-3 px-1 mb-1">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-3.5 h-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px] text-zinc-400">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${filtered.length} response${filtered.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            {filtered.map((sub, idx) => {
              const isExpanded = expandedId === sub.id;
              const answerEntries = Object.entries(sub.answers || {}).filter(
                ([blockId]) => blockMap[blockId] // Only show known blocks
              );

              return (
                <div
                  key={sub.id}
                  className={`bg-white dark:bg-zinc-900 rounded-xl border overflow-hidden transition-all ${
                    selectedIds.has(sub.id)
                      ? "border-blue-300 dark:border-blue-700"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  {/* Summary row */}
                  <div className="flex items-center gap-3 pr-4">
                    <div className="pl-4 py-4 flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(sub.id)}
                        onChange={() => toggleSelect(sub.id)}
                        className="w-3.5 h-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                      className="flex-1 flex items-center justify-between py-4 pr-1 text-left hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors rounded-r-xl"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[11px] font-semibold text-zinc-500 flex-shrink-0">
                          {submissions.length - submissions.indexOf(sub)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {formatDate(sub.created_at)}
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5 truncate max-w-md">
                            {getPreview(sub.answers || {}, blockMap)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <span className="text-[11px] text-zinc-400">{answerEntries.length} answer{answerEntries.length !== 1 ? "s" : ""}</span>
                        <ChevronIcon open={isExpanded} />
                      </div>
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-zinc-100 dark:border-zinc-800">
                      {answerEntries.length === 0 ? (
                        <div className="px-5 py-4">
                          <p className="text-sm text-zinc-400 italic">No answers recorded.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                          {answerEntries.map(([blockId, value]) => {
                            const block = blockMap[blockId];
                            return (
                              <div key={blockId} className="px-5 py-3 flex gap-4">
                                <div className="w-1/3 flex-shrink-0">
                                  <div className="text-xs font-medium text-zinc-500">
                                    {block?.label || blockId}
                                  </div>
                                  {block?.sectionTitle && (
                                    <div className="text-[10px] text-zinc-400 mt-0.5">{block.sectionTitle}</div>
                                  )}
                                </div>
                                <div className="text-sm text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap break-words min-w-0">
                                  {formatAnswer(value)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Metadata + actions */}
                      <div className="px-5 py-3 bg-zinc-50/50 dark:bg-zinc-800/20 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[11px] text-zinc-400">
                          {sub.metadata?.completedAt && (
                            <span>Completed {formatDate(sub.metadata.completedAt)}</span>
                          )}
                          {sub.metadata?.sectionPath && (
                            <span>{sub.metadata.sectionPath.length} section{sub.metadata.sectionPath.length !== 1 ? "s" : ""} visited</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete([sub.id])}
                          disabled={deleting}
                          className="text-[11px] text-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
