"use client";

import { ImageMoodboardBlock, ImageMoodboardItem } from "@/types/editor";
import { useEditor } from "@/hooks/use-editor";
import { Moodboard } from "@/src/components/shared/Moodboard";
import { personalizeText } from "@/src/lib/experience/personalize";

interface MoodboardBlockCardProps {
  block: ImageMoodboardBlock;
}

export function MoodboardBlockCard({ block }: MoodboardBlockCardProps) {
  const { updateBlock, sections } = useEditor();

  // Find parent section id
  const parentSection = sections.find(s => s.blocks.some(b => b.id === block.id));
  
  const handleReorder = (newItems: ImageMoodboardItem[]) => {
      if (parentSection) {
          updateBlock(parentSection.id, block.id, { items: newItems });
      }
  };

  const handleRemove = (itemId: string) => {
      if (parentSection) {
          const newItems = block.items.filter(i => i.id !== itemId);
          updateBlock(parentSection.id, block.id, { items: newItems });
      }
  };

  return (
    <div className="space-y-4">
       <div className="space-y-1">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {block.label || "Moodboard"}
            </h3>
            {block.helperText && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {block.helperText}
                </p>
            )}
       </div>

       <Moodboard 
            items={block.items || []} 
            onReorder={handleReorder} 
            onRemove={handleRemove}
       />
    </div>
  );
}
