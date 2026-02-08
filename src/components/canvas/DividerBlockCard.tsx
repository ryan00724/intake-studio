import React from "react";
import { DividerBlock } from "@/types/editor";

interface DividerBlockCardProps {
  block: DividerBlock;
}

const styleMap: Record<string, string> = {
  solid: "border-solid",
  dashed: "border-dashed",
  dotted: "border-dotted",
};

export function DividerBlockCard({ block }: DividerBlockCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
          Divider
        </span>
      </div>
      <hr className={`border-t-2 border-zinc-300 dark:border-zinc-600 ${styleMap[block.style] || "border-solid"}`} />
    </div>
  );
}
