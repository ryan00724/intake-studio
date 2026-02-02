"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IntakeBlock } from "@/types/editor";
import { BlockRenderer } from "./block-renderer";
import { useEditor } from "@/hooks/use-editor";
import { motion } from "framer-motion";
import { Card } from "@/src/components/ui/Card";

export function SortableBlock({ block }: { block: IntakeBlock }) {
  const { selectedId, selectItem } = useEditor();
  const isSelected = selectedId === block.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, data: { type: "block", block } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectItem(block.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`
        relative group outline-none
        ${isDragging ? "opacity-50 z-50 scale-[1.02] cursor-grabbing" : "cursor-grab"}
      `}
    >
      <motion.div
         layoutId={block.id}
         initial={{ opacity: 0, scale: 0.98 }}
         animate={{ opacity: 1, scale: 1 }}
         className="h-full"
      >
         <Card 
            active={isSelected} 
            className="p-4 group/card h-full"
         >
            <div className="flex gap-3">
                <div className="pt-1 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                    <BlockRenderer block={block} />
                </div>
            </div>
         </Card>
      </motion.div>
    </div>
  );
}
