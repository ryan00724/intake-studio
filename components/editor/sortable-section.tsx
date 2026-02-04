"use client";

import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IntakeSection } from "@/types/editor";
import { useEditor } from "@/hooks/use-editor";
import { SortableBlock } from "./sortable-block";
import { useDroppable } from "@dnd-kit/core";
import { Card } from "@/src/components/ui/Card";
import { motion } from "framer-motion";

export function SortableSection({ section }: { section: IntakeSection }) {
  const { selectedId, selectItem } = useEditor();
  const isSelected = selectedId === section.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, data: { type: "section", section } });

  const xOffset = transform?.x || 0;
  const isDeleteIntent = xOffset > 200;
  const showDeleteHint = isDragging && xOffset > 50;
  
  const { setNodeRef: setDroppableRef } = useDroppable({
      id: `section-droppable-${section.id}`,
      data: { type: "section-droppable", sectionId: section.id }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectItem(section.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-section-id={section.id} // Added identifier for connecting lines
      className={`
        relative mb-6 transition-all duration-200 ease-out outline-none flex-shrink-0
        ${isDragging ? "opacity-50 z-40 scale-[1.01]" : ""}
      `}
    >
      <motion.div
        layoutId={section.id}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card 
            noPadding
            active={isSelected}
            className="overflow-hidden"
            onClick={handleClick}
        >
            {/* Delete Overlay */}
            {showDeleteHint && (
                <div 
                    className={`absolute inset-0 z-50 pointer-events-none flex items-center justify-start pl-8 transition-opacity duration-200 ${isDeleteIntent ? 'bg-red-500/90' : 'bg-red-500/10'}`}
                >
                    <div className={`flex items-center gap-3 text-white font-bold text-xl transition-all duration-200 ${isDeleteIntent ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        Release to Delete
                    </div>
                </div>
            )}

            {/* Section Header */}
            <div 
                {...attributes} 
                {...listeners}
                className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 cursor-grab active:cursor-grabbing hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-zinc-200/50 dark:bg-zinc-700/50 text-zinc-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 leading-tight">
                            {section.title || "Untitled Section"}
                        </h3>
                        {section.description && (
                            <p className="text-sm text-zinc-500 mt-0.5 line-clamp-1">{section.description}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Blocks Container */}
            <div ref={setDroppableRef} className="p-4 min-h-[100px] bg-white dark:bg-zinc-900">
                <SortableContext items={section.blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                    {section.blocks.length === 0 ? (
                        <div className="h-full w-full flex flex-col items-center justify-center py-8 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl text-zinc-400 text-sm bg-zinc-50/30 dark:bg-zinc-800/20">
                            <p>This section is empty</p>
                            <p className="text-xs opacity-60 mt-1">Drag blocks from the toolbox</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {section.blocks.map(block => (
                                <SortableBlock key={block.id} block={block} />
                            ))}
                        </div>
                    )}
                </SortableContext>
            </div>
        </Card>
      </motion.div>
    </div>
  );
}
