"use client";

import { useState } from "react";
import { useEditor } from "@/hooks/use-editor";
import { ExperienceRenderer } from "@/src/components/experience/ExperienceRenderer";
import { PersonalizationParams } from "@/src/lib/experience/personalize";
import { useSearchParams } from "next/navigation";

type PreviewMode = "guided" | "document";

export function PreviewLayout() {
  const { togglePreview, sections, metadata } = useEditor();
  const [mode, setMode] = useState<PreviewMode>(metadata.mode || "guided");
  
  const searchParams = useSearchParams();
  const personalization: PersonalizationParams = {
      client: searchParams?.get("client") || undefined,
      company: searchParams?.get("company") || undefined,
      project: searchParams?.get("project") || undefined
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-black">
      {/* Preview Header */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-4 z-50 relative">
        <div className="flex items-center gap-4">
           <button 
              onClick={togglePreview}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
           >
              ← Back to Editor
           </button>
           <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
           <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-md p-1">
              <button
                onClick={() => setMode("guided")}
                className={`px-3 py-1 rounded-sm text-xs font-medium transition-all ${mode === "guided" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"}`}
              >
                Guided
              </button>
              <button
                onClick={() => setMode("document")}
                className={`px-3 py-1 rounded-sm text-xs font-medium transition-all ${mode === "document" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"}`}
              >
                Document
              </button>
           </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
           Experience Preview
        </div>

        <div className="flex items-center gap-3">
            {/* Any right side actions could go here */}
        </div>
      </header>

      {/* Preview Content */}
      <main className="flex-1 overflow-y-auto relative h-full">
        <ExperienceRenderer
            sections={sections}
            mode={mode}
            personalization={personalization}
            title={metadata.title}
            intro={metadata.description}
            estimatedTime={metadata.estimatedTime}
            closingMessage={metadata.completionText}
            completionNextSteps={metadata.completionNextSteps}
            completionButtonLabel={metadata.completionButtonLabel}
            completionButtonUrl={metadata.completionButtonUrl}
            theme={metadata.theme}
        />
      </main>
    </div>
  );
}
