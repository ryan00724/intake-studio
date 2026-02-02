"use client";

import { DraggableSidebarItem } from "./draggable-sidebar-item";
import { BlockType, InputType } from "@/types/editor";
import { Panel } from "@/src/components/ui/Panel";

const TOOLS = [
  { type: "section", label: "New Section" },
  { type: "context", label: "Context Block" },
  { type: "question", inputType: "short", label: "Short Text" },
  { type: "question", inputType: "long", label: "Long Text" },
  { type: "question", inputType: "select", label: "Select Dropdown" },
  { type: "question", inputType: "multi", label: "Multi Select" },
  { type: "question", inputType: "slider", label: "Range Slider" },
  { type: "question", inputType: "date", label: "Date Picker" },
  { type: "question", inputType: "file", label: "File Upload" },
  { type: "image_choice", label: "Image Choice" },
] as const;

export function Sidebar() {
  return (
    <Panel className="w-64 flex flex-col h-full shadow-sm">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/50">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Toolbox</h2>
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="space-y-2">
            {TOOLS.map((tool, i) => (
                <DraggableSidebarItem 
                    key={i} 
                    data={tool as any}
                />
            ))}
        </div>
      </div>
    </Panel>
  );
}
