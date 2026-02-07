"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { Submission, IntakeBlock } from "@/types/editor";

interface BlockMap {
  [blockId: string]: { label: string; type: string; inputType?: string };
}

export default function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [blockMap, setBlockMap] = useState<BlockMap>({});
  const [intakeTitle, setIntakeTitle] = useState("Intake");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // Fetch submissions and intake data in parallel
        const [subsRes, intakeRes] = await Promise.all([
          fetch(`/api/intakes/${id}/submissions`),
          fetch(`/api/intakes/${id}`),
        ]);

        if (subsRes.ok) {
          const data = await subsRes.json();
          setSubmissions(data);
        }

        if (intakeRes.ok) {
          const intake = await intakeRes.json();
          setIntakeTitle(intake.title || "Intake");

          // Build blockId -> label map from draft_json
          const draft = intake.draft_json || {};
          const sections = draft.sections || [];
          const map: BlockMap = {};
          for (const section of sections) {
            for (const block of section.blocks || []) {
              map[block.id] = {
                label: block.label || block.title || block.text || block.type,
                type: block.type,
                inputType: block.inputType,
              };
            }
          }
          setBlockMap(map);
        }
      } catch (e) {
        console.error("Failed to load submissions:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatAnswer = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string") return value;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") return String(value);
    if (Array.isArray(value)) {
      // LinkPreviewItems or other arrays
      if (value.length === 0) return "-";
      if (value[0]?.url) return value.map((v: any) => v.title || v.url).join(", ");
      return value.join(", ");
    }
    if (typeof value === "object") {
      // book_call clicked state
      if ("clicked" in value) return value.clicked ? "Clicked" : "Not clicked";
      return JSON.stringify(value);
    }
    return String(value);
  };

  const copyAllAsJson = () => {
    navigator.clipboard.writeText(JSON.stringify(submissions, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Back to Dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
            <div>
              <h1 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{intakeTitle}</h1>
              <p className="text-xs text-zinc-400">Submissions</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/e/${id}`}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Open Editor
            </Link>
            {submissions.length > 0 && (
              <button
                onClick={copyAllAsJson}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy JSON
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {submissions.length} Response{submissions.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 border-dashed">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">No submissions yet</h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              Share your published intake link with clients to start collecting responses.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub, idx) => {
              const isExpanded = expandedId === sub.id;
              const answerEntries = Object.entries(sub.answers || {});

              return (
                <div
                  key={sub.id}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all"
                >
                  {/* Summary row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-500">
                        {submissions.length - idx}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {formatDate(sub.created_at)}
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {answerEntries.length} answer{answerEntries.length !== 1 ? "s" : ""}
                          {sub.metadata?.completedAt && " — completed"}
                        </div>
                      </div>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>

                  {/* Expanded answers */}
                  {isExpanded && (
                    <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-4 space-y-3">
                      {answerEntries.length === 0 ? (
                        <p className="text-sm text-zinc-400 italic">No answers recorded.</p>
                      ) : (
                        answerEntries.map(([blockId, value]) => {
                          const block = blockMap[blockId];
                          return (
                            <div key={blockId} className="flex flex-col gap-0.5">
                              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                {block?.label || blockId}
                              </div>
                              <div className="text-sm text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap break-words">
                                {formatAnswer(value)}
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* Metadata section */}
                      {sub.metadata && Object.keys(sub.metadata).length > 0 && (
                        <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800">
                          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Metadata</div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500">
                            {sub.metadata.completedAt && (
                              <div>
                                <span className="text-zinc-400">Completed: </span>
                                {formatDate(sub.metadata.completedAt)}
                              </div>
                            )}
                            {sub.metadata.sectionPath && (
                              <div>
                                <span className="text-zinc-400">Sections visited: </span>
                                {sub.metadata.sectionPath.length}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
