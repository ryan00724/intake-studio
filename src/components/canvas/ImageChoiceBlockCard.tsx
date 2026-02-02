import React from "react";
import { ImageChoiceBlock } from "@/types/editor";

interface ImageChoiceBlockCardProps {
  block: ImageChoiceBlock;
}

export function ImageChoiceBlockCard({ block }: ImageChoiceBlockCardProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                {block.label || "Image Choice"}
            </span>
            {block.required && <span className="text-red-500 text-xs font-bold" title="Required">*</span>}
         </div>
         <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
            Image Choice
         </span>
      </div>

      {block.helperText && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 -mt-1">{block.helperText}</p>
      )}

      {/* Grid Preview */}
      <div className="grid grid-cols-4 gap-3 mt-1 pointer-events-none">
        {(!block.options || block.options.length === 0) ? (
            <div className="col-span-4 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30">
                <span className="text-sm">Add images in properties</span>
            </div>
        ) : (
            block.options.map((opt) => (
                <div key={opt.id} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                    {opt.imageUrl ? (
                        <img src={opt.imageUrl} alt={opt.label || ""} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
                            No Image
                        </div>
                    )}
                    {opt.label && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate backdrop-blur-sm">
                            {opt.label}
                        </div>
                    )}
                </div>
            ))
        )}
      </div>
    </div>
  );
}
