import React from "react";
import { LinkPreviewBlock } from "@/types/editor";

export function LinkPreviewBlockCard({ block }: { block: LinkPreviewBlock }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
          Link Preview
        </span>
        {block.required && (
          <span className="text-[10px] font-medium text-red-400">Required</span>
        )}
      </div>
      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {block.label || "Untitled Link Preview"}
      </div>
      {block.helperText && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{block.helperText}</div>
      )}
      <div className="flex items-center gap-2 p-2.5 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/30">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <span className="text-xs text-zinc-400">Clients paste URLs here</span>
        {block.maxItems && (
          <span className="ml-auto text-[10px] text-zinc-400">Max {block.maxItems}</span>
        )}
      </div>
    </div>
  );
}
