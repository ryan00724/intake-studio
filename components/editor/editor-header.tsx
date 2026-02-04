"use client";

import { useEditor } from "@/hooks/use-editor";
import { useState } from "react";
import { ThemeToggle } from "@/src/components/theme/ThemeToggle";
import { IconButton } from "@/src/components/ui/IconButton";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, Rows } from "lucide-react";
import { createPortal } from "react-dom";

export function EditorHeader() {
  const { isPreviewMode, togglePreview, publishIntake, metadata } = useEditor();
  const [justPublished, setJustPublished] = useState<string | null>(null);

  const handlePublish = async () => {
      const slug = await publishIntake();
      if (!slug) return;
      setJustPublished(slug);
      // Increased timeout to allow user to see/interact
      setTimeout(() => setJustPublished(null), 5000);
  };

  const publishedUrl = justPublished ? `${window.location.origin}/i/${justPublished}` : "";

  return (
    <>
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
          className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 shadow-sm"
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
