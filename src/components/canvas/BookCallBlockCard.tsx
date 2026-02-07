import React from "react";
import { BookCallBlock } from "@/types/editor";

export function BookCallBlockCard({ block }: { block: BookCallBlock }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
          Book a Call
        </span>
        {block.requiredToContinue && (
          <span className="text-[10px] font-medium text-red-400">Must click</span>
        )}
      </div>
      {block.title && (
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{block.title}</div>
      )}
      {block.text && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{block.text}</div>
      )}
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          {block.buttonLabel || "Book a Call"}
        </div>
        {block.bookingUrl && (
          <span className="text-[10px] text-zinc-400 truncate max-w-[140px]">{block.bookingUrl}</span>
        )}
      </div>
    </div>
  );
}
