"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEditor } from "@/hooks/use-editor";
import { SortableSection } from "./sortable-section";
import { AnimatePresence } from "framer-motion";

export function Canvas() {
  const { sections, selectItem } = useEditor();
  const { setNodeRef } = useDroppable({
    id: "canvas-root",
    data: { type: "root" }
  });

  return (
    <div 
      className="w-full max-w-3xl min-h-[calc(100vh-4rem)] pb-32"
      onClick={(e) => {
        // Only deselect if clicking directly on the canvas background
        if (e.target === e.currentTarget) {
           selectItem(null);
        }
      }}
    >
        <div ref={setNodeRef} className="min-h-[200px]" onClick={() => selectItem(null)}>
            <SortableContext
                items={sections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
            >
                {sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-zinc-400 gap-2 min-h-[300px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/20">
                    <p className="font-medium">Drag a section here to start</p>
                </div>
                ) : (
                 <div className="space-y-6">
                     <AnimatePresence mode="popLayout">
                        {sections.map((section) => (
                            <SortableSection key={section.id} section={section} />
                        ))}
                    </AnimatePresence>
                 </div>
                )}
            </SortableContext>
        </div>
    </div>
  );
}
