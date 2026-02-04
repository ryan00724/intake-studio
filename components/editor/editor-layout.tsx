"use client";

import { Sidebar } from "./sidebar";
import { PropertiesPanel } from "./properties-panel";
import { DndWrapper } from "./dnd-wrapper";
import { Canvas } from "./canvas";
import { useEditor } from "@/hooks/use-editor";
import { CanvasViewport } from "./canvas-viewport";

export function EditorLayout() {
  const { selectItem, setToolboxOpen } = useEditor();

  return (
    <DndWrapper>
        <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden p-3 gap-3">
            <Sidebar />
            
            <div 
                className="flex-1 flex flex-col h-full relative overflow-hidden rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner"
            >
                <CanvasViewport onBackgroundClick={() => {
                    selectItem(null);
                    setToolboxOpen(false);
                }}>
                    <Canvas />
                </CanvasViewport>
            </div>
            
            <PropertiesPanel />
        </div>
    </DndWrapper>
  );
}
