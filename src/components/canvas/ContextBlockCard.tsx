import React from "react";
import { ContextBlock } from "@/types/editor";
import { Panel } from "@/src/components/ui/Panel";

interface ContextBlockCardProps {
  block: ContextBlock;
}

export function ContextBlockCard({ block }: ContextBlockCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
         <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
            Context
         </span>
      </div>
      <div className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap text-sm leading-relaxed break-words">
        {block.text || "Empty context block"}
      </div>
    </div>
  );
}
