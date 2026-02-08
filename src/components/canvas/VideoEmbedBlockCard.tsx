import React from "react";
import { VideoEmbedBlock } from "@/types/editor";

interface VideoEmbedBlockCardProps {
  block: VideoEmbedBlock;
}

export function VideoEmbedBlockCard({ block }: VideoEmbedBlockCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-500 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400 px-2 py-0.5 rounded-full">
          Video
        </span>
      </div>
      {block.videoUrl ? (
        <div className="space-y-1">
          <video
            src={block.videoUrl}
            controls
            muted
            playsInline
            preload="metadata"
            className="w-full max-h-48 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-black"
          />
          {block.caption && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
              {block.caption}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-28 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-400 text-sm">
          No video set
        </div>
      )}
    </div>
  );
}
