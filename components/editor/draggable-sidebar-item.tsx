"use client";

import { useDraggable } from "@dnd-kit/core";
import { BlockType, InputType } from "@/types/editor";
import { Card } from "@/src/components/ui/Card";

interface SidebarItemData {
  type: "section" | BlockType;
  inputType?: InputType; // Only for questions
  label: string;
}

export function DraggableSidebarItem({ data }: { data: SidebarItemData }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${data.type}-${data.inputType || 'generic'}`,
    data: {
      ...data,
      isSidebar: true,
    },
  });

  // Icon mapping could be added here for better visuals

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="outline-none"
    >
      <Card 
        className={`
            p-3 cursor-grab hover:-translate-y-0.5
            flex items-center gap-3
            ${isDragging ? "opacity-50 ring-2 ring-blue-500 border-blue-500" : ""}
        `}
        noPadding
      >
        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
             {/* Simple icon placeholder */}
             <div className="w-4 h-4 rounded-sm border-2 border-current opacity-50" />
        </div>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{data.label}</span>
      </Card>
    </div>
  );
}

export function SidebarItemOverlay({ label }: { label: string }) {
    return (
        <Card className="p-3 w-56 shadow-xl opacity-90 cursor-grabbing flex items-center gap-3" noPadding>
             <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                <div className="w-4 h-4 rounded-sm border-2 border-current opacity-50" />
             </div>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
        </Card>
    )
}
