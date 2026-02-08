import React from "react";
import { HeadingBlock } from "@/types/editor";

interface HeadingBlockCardProps {
  block: HeadingBlock;
}

const sizeMap = {
  h1: "text-2xl font-bold",
  h2: "text-xl font-semibold",
  h3: "text-lg font-medium",
};

const labelMap = {
  h1: "H1",
  h2: "H2",
  h3: "H3",
};

export function HeadingBlockCard({ block }: HeadingBlockCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
          Heading {labelMap[block.level]}
        </span>
      </div>
      <div className={`${sizeMap[block.level]} text-zinc-900 dark:text-zinc-100 break-words`}>
        {block.text || "Empty heading"}
      </div>
    </div>
  );
}
