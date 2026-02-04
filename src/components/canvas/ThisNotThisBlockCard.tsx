"use client";

import { ThisNotThisBlock } from "@/types/editor";
import { useEditor } from "@/hooks/use-editor";
import { ThisNotThisBoard } from "@/src/components/shared/ThisNotThisBoard";

interface ThisNotThisBlockCardProps {
  block: ThisNotThisBlock;
}

export function ThisNotThisBlockCard({ block }: ThisNotThisBlockCardProps) {
  return (
    <div className="space-y-4">
       <div className="space-y-1">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {block.label || "This / Not This"}
            </h3>
            {block.helperText && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {block.helperText}
                </p>
            )}
       </div>

       {/* In Editor, we just show the board in a neutral state or preview mode */}
       <div className="pointer-events-none opacity-80 scale-95 origin-top-left">
            <ThisNotThisBoard 
                items={block.items || []} 
                // Default all to pool for preview
                yesItems={[]}
                noItems={[]}
                readOnly
            />
       </div>
       
       <div className="text-xs text-zinc-400 italic text-center border-t border-zinc-100 dark:border-zinc-800 pt-2">
            Configure items in Properties Panel. Interactive preview available in Preview Mode.
       </div>
    </div>
  );
}
