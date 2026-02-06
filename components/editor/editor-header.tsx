"use client";

import { useEditor } from "@/hooks/use-editor";
import { useState } from "react";
import { ThemeToggle } from "@/src/components/theme/ThemeToggle";
import { IconButton } from "@/src/components/ui/IconButton";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, Rows } from "lucide-react";
import { createPortal } from "react-dom";

export function EditorHeader() {
  const { isPreviewMode, togglePreview, publishIntake, metadata, validation, selectItem } = useEditor();
  const [justPublished, setJustPublished] = useState<string | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  const handlePublish = async () => {
      if (!validation.isValid) {
          setShowValidationDetails(true);
          return;
      }
      const slug = await publishIntake();
      if (!slug) return;
      setJustPublished(slug);
      // Increased timeout to allow user to see/interact
      setTimeout(() => setJustPublished(null), 5000);
  };

  const publishedUrl = justPublished ? `${window.location.origin}/i/${justPublished}` : "";

  return (
    <>
        {/* Validation Issues Panel */}
        {typeof document !== 'undefined' && createPortal(
            <AnimatePresence>
                {showValidationDetails && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-sm"
                            onClick={() => setShowValidationDetails(false)}
                        />
                        <motion.div 
                            initial={{ y: -20, opacity: 0, x: "-50%" }}
                            animate={{ y: 0, opacity: 1, x: "-50%" }}
                            exit={{ y: -20, opacity: 0, x: "-50%" }}
                            className="fixed top-20 left-1/2 z-[100] w-[400px] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden max-h-[80vh]"
                        >
                            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                    {!validation.isValid ? (
                                        <span className="text-red-500">❌ Cannot Publish</span>
                                    ) : (
                                        <span className="text-yellow-500">⚠️ Warnings Found</span>
                                    )}
                                </h3>
                                <button onClick={() => setShowValidationDetails(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">✕</button>
                            </div>
                            
                            <div className="p-4 overflow-y-auto space-y-6">
                                {/* Errors */}
                                {validation.errors.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="text-xs font-semibold text-red-500 uppercase tracking-wider">Blocking Errors</div>
                                        {validation.errors.map((error, idx) => (
                                            <div 
                                                key={idx} 
                                                className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg flex items-start gap-3 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                                onClick={() => {
                                                    if (error.sectionId) {
                                                        selectItem(error.sectionId);
                                                        setShowValidationDetails(false);
                                                    }
                                                }}
                                            >
                                                <span className="mt-0.5 text-red-500 text-sm">❌</span>
                                                <div className="text-sm text-zinc-800 dark:text-zinc-200">
                                                    {error.message}
                                                    {error.sectionId && <div className="text-xs text-zinc-400 mt-1">Click to view section</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Warnings */}
                                {validation.warnings.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">Warnings</div>
                                        {validation.warnings.map((warning, idx) => (
                                            <div 
                                                key={idx} 
                                                className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg flex items-start gap-3 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors"
                                                onClick={() => {
                                                    if (warning.sectionId) {
                                                        selectItem(warning.sectionId);
                                                        setShowValidationDetails(false);
                                                    }
                                                }}
                                            >
                                                <span className="mt-0.5 text-yellow-500 text-sm">⚠️</span>
                                                <div className="text-sm text-zinc-800 dark:text-zinc-200">
                                                    {warning.message}
                                                    {warning.sectionId && <div className="text-xs text-zinc-400 mt-1">Click to view section</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-4">
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{validation.stats.totalSections}</div>
                                        <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Sections</div>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{validation.stats.unreachableSections.length}</div>
                                        <div className="text-xs text-zinc-500 uppercase tracking-wider">Unreachable</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>,
            document.body
        )}

        {typeof document !== 'undefined' && createPortal(
            <AnimatePresence>
                {justPublished && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0, x: "-50%" }}
                        animate={{ y: 0, opacity: 1, x: "-50%" }}
                        exit={{ y: 100, opacity: 0, x: "-50%" }}
                        className="fixed bottom-6 left-1/2 z-[100] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-4 rounded-xl shadow-2xl flex flex-col gap-2 min-w-[300px] border border-zinc-700/50 dark:border-zinc-300/50"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-medium">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Published Successfully
                            </div>
                            <button onClick={() => setJustPublished(null)} className="text-zinc-400 hover:text-white dark:hover:text-zinc-700">✕</button>
                        </div>
                        <div className="text-sm text-zinc-400 dark:text-zinc-500 break-all">
                            {publishedUrl}
                        </div>
                        <div className="flex gap-2 mt-2">
                            <a 
                                href={publishedUrl} 
                                target="_blank" 
                                className="flex-1 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-center py-2 rounded-lg text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                Open
                            </a>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(publishedUrl);
                                    // Could add a toast here for "Copied"
                                }}
                                className="flex-1 bg-zinc-800 dark:bg-zinc-200 text-zinc-300 dark:text-zinc-700 text-center py-2 rounded-lg text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
                            >
                                Copy Link
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body
        )}

    <header className="h-14 flex items-center justify-between px-6 z-20 relative bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg shadow-sm">
             <span className="text-white dark:text-zinc-900 font-bold text-lg">I</span>
        </div>
        <div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 leading-none">Intake Studio</div>
            <div className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px]">{metadata.title}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        
        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

        {/* Validation Status Indicator */}
        <div 
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors select-none
                ${validation.isValid && validation.warnings.length === 0 
                    ? "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800" 
                    : validation.isValid 
                        ? "text-yellow-600 bg-yellow-50 hover:bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30"
                        : "text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                }
            `}
            onClick={() => setShowValidationDetails(!showValidationDetails)}
        >
            {validation.isValid && validation.warnings.length === 0 ? (
                <>
                    <span className="text-green-500 text-base">●</span>
                    Flow Ready
                </>
            ) : validation.isValid ? (
                <>
                    <span className="text-yellow-500 text-base">●</span>
                    {validation.warnings.length} Warning{validation.warnings.length !== 1 ? 's' : ''}
                </>
            ) : (
                <>
                    <span className="text-red-500 text-base">●</span>
                    {validation.errors.length} Issue{validation.errors.length !== 1 ? 's' : ''}
                </>
            )}
        </div>

        <button
          onClick={() => {
            if (confirm("Are you sure you want to clear all content? This cannot be undone.")) {
              // Reset to initial state logic could be added to useEditor, 
              // but for now we'll just reload with cleared storage for a hard reset effect
              localStorage.removeItem("intake-studio-state-v3");
              window.location.reload();
            }
          }}
          className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
          title="Clear all content"
        >
          Clear
        </button>

        <button
          onClick={handlePublish}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out shadow-sm
            ${!validation.isValid 
                ? "bg-zinc-100 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600" 
                : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 hover:scale-105 active:scale-95"
            }
          `}
        >
          Publish
        </button>

        <button
          onClick={togglePreview}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out border border-transparent hover:scale-105 active:scale-95
            ${isPreviewMode 
                ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20 shadow-md" 
                : "bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-200 shadow-sm dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-700"}
          `}
        >
          {isPreviewMode ? "Edit Mode" : "Preview"}
        </button>
      </div>
    </header>
    </>
  );
}
