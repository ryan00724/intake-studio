import React from "react";
import { ImageDisplayBlock } from "@/types/editor";

interface ImageDisplayBlockCardProps {
  block: ImageDisplayBlock;
}

export function ImageDisplayBlockCard({ block }: ImageDisplayBlockCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
          Image
        </span>
      </div>
      {block.imageUrl ? (
        <figure className="space-y-1">
          <img
            src={block.imageUrl}
            alt={block.alt || ""}
            className="w-full max-h-48 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
          />
          {block.caption && (
            <figcaption className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
              {block.caption}
            </figcaption>
          )}
        </figure>
      ) : (
        <div className="flex items-center justify-center h-28 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-400 text-sm">
          No image set
        </div>
      )}
    </div>
  );
}
