"use client";

import { useEditor } from "@/hooks/use-editor";
import { useState } from "react";
import { ThemeToggle } from "@/src/components/theme/ThemeToggle";
import { IconButton } from "@/src/components/ui/IconButton";

export function EditorHeader() {
  const { isPreviewMode, togglePreview, publishIntake, metadata } = useEditor();
  const [justPublished, setJustPublished] = useState<string | null>(null);

  const handlePublish = async () => {
      const slug = await publishIntake();
      if (!slug) return;
      setJustPublished(slug);
      setTimeout(() => setJustPublished(null), 3000);
  };

  const publishedUrl = justPublished ? `${window.location.origin}/i/${justPublished}` : "";

  return (
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
        
        {justPublished && (
            <div className="text-xs text-green-600 font-medium mr-2 animate-pulse bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                Published! <a href={publishedUrl} target="_blank" className="underline hover:text-green-700 dark:hover:text-green-400">View Live</a>
            </div>
        )}
        
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
  );
}
