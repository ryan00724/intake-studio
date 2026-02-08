import React from "react";
import { QuoteBlock } from "@/types/editor";

interface QuoteBlockCardProps {
  block: QuoteBlock;
}

export function QuoteBlockCard({ block }: QuoteBlockCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
          Quote
        </span>
      </div>
      <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 py-1">
        <p className="text-sm text-zinc-700 dark:text-zinc-300 italic leading-relaxed break-words">
          {block.text || "Empty quote"}
        </p>
        {block.attribution && (
          <footer className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            — {block.attribution}
          </footer>
        )}
      </blockquote>
    </div>
  );
}
