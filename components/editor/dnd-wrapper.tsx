"use client";

import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  DragOverEvent,
  closestCenter,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  getFirstCollision,
  useDndMonitor,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useState, useCallback } from "react";
import { SidebarItemOverlay } from "./draggable-sidebar-item";
import { IntakeSection, IntakeBlock, BlockType, InputType } from "@/types/editor";
import { useEditor } from "@/hooks/use-editor";
import { generateId } from "@/lib/constants";
import { BlockRenderer } from "./block-renderer";

function DragOverlayContent({ label, isSection }: { label: string, isSection: boolean }) {
    const [deltaX, setDeltaX] = useState(0);

    useDndMonitor({
        onDragMove(event) {
            setDeltaX(event.delta.x);
        },
        onDragEnd() {
            setDeltaX(0);
        }
    });

    const isDeleteIntent = deltaX > 200;
    const showDeleteHint = deltaX > 50 && isSection;

    return (
        <div className={`
            relative p-4 rounded shadow-xl border w-[300px] overflow-hidden transition-colors duration-200
            ${isDeleteIntent && isSection ? 'bg-red-500 border-red-600' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}
        `}>
             {/* Delete Overlay */}
             {showDeleteHint && (
                <div 
                    className={`absolute inset-0 z-50 flex items-center justify-start pl-8 transition-opacity duration-200 ${isDeleteIntent ? 'bg-red-500/90' : 'bg-red-500/10'}`}
                >
                    <div className={`flex items-center gap-3 text-white font-bold text-xl transition-all duration-200 ${isDeleteIntent ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        Release to Delete
                    </div>
                </div>
            )}
             <span className={`font-medium ${isDeleteIntent && isSection ? 'text-white' : ''}`}>{label}</span>
        </div>
    );
}

export function DndWrapper({ children }: { children: React.ReactNode }) {
  const { 
    sections, 
    setSections, 
    addSection, 
    addBlock,
    removeSection
  } = useEditor();
  
  const [activeDragItem, setActiveDragItem] = useState<{ 
    type: "section" | BlockType; 
    inputType?: InputType; 
    label: string;
    isSidebar?: boolean;
    data?: any; // Full object if sorting
  } | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const findSectionContainer = (id: string): string | undefined => {
    if (sections.find(s => s.id === id)) return id;
    return sections.find(s => s.blocks.find(b => b.id === id))?.id;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.isSidebar) {
      setActiveDragItem({
        type: activeData.type,
        inputType: activeData.inputType,
        label: activeData.label,
        isSidebar: true,
      });
    } else if (activeData?.type === "section") {
        setActiveDragItem({
            type: "section",
            label: activeData.section.title,
            data: activeData.section
        });
    } else if (activeData?.type === "block" || activeData?.type === "question" || activeData?.type === "image_choice" || activeData?.type === "image_moodboard" || activeData?.type === "this_not_this" || activeData?.type === "context" || activeData?.type === "link_preview" || activeData?.type === "book_call") {
        setActiveDragItem({
            type: activeData.block.type,
            label: activeData.block.label || activeData.block.title || "Block",
            data: activeData.block
        });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    // If dragging a section, we only care about sorting sections, handled in dragEnd
    if (active.data.current?.type === "section" || (active.data.current?.isSidebar && active.data.current?.type === "section")) {
        return;
    }

    // Dragging a Block (Sidebar or Existing)
    const activeId = active.id;
    const overId = over.id;

    // If sidebar item, we don't need real-time sorting visualization yet, dragEnd handles it.
    if (active.data.current?.isSidebar) return;

    // Logic for moving existing blocks between sections during drag (optional but good for UX)
    // For now, let's keep it simple and handle everything in DragEnd to avoid flicker/complex state updates
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    const activeData = active.data.current;
    
    // --- SCENARIO 1: Sidebar Drop ---
    if (activeData?.isSidebar) {
        // 1A: Dropping a New Section
        if (activeData.type === "section") {
             // If over canvas root or another section, add it
             // Simple append for now if dropped anywhere valid
             addSection(); 
             // Ideally find index if dropped over another section, but append is safeMVP
        } 
        // 1B: Dropping a New Block
        else {
             // Must determine target section
             let targetSectionId = findSectionContainer(over.id as string);
             
             // If dropped on "section-droppable-{id}", extract ID
             if (!targetSectionId && (over.id as string).startsWith("section-droppable-")) {
                 targetSectionId = (over.id as string).replace("section-droppable-", "");
             }

             if (targetSectionId) {
                 console.log("Dropping block:", activeData); // Debug log
                 let newBlock: IntakeBlock;
                 
                 if (activeData.type === "context") {
                    newBlock = { id: generateId(), type: "context", text: "Context block..." };
                 } else if (activeData.type === "image_choice") {
                    newBlock = {
                        id: generateId(),
                        type: "image_choice",
                        label: activeData.label,
                        options: [],
                        multi: false
                    };
                 } else if (activeData.type === "image_moodboard") {
                    newBlock = {
                        id: generateId(),
                        type: "image_moodboard",
                        label: activeData.label,
                        items: [],
                    };
                 } else if (activeData.type === "this_not_this") {
                    newBlock = {
                        id: generateId(),
                        type: "this_not_this",
                        label: activeData.label,
                        items: [],
                    };
                 } else if (activeData.type === "link_preview") {
                    newBlock = {
                        id: generateId(),
                        type: "link_preview",
                        label: activeData.label || "Link Preview",
                        maxItems: 3,
                    };
                 } else if (activeData.type === "book_call") {
                    newBlock = {
                        id: generateId(),
                        type: "book_call",
                        bookingUrl: "",
                        buttonLabel: "Book a Call",
                        openInNewTab: true,
                    };
                 } else if (activeData.type === "heading") {
                    newBlock = {
                        id: generateId(),
                        type: "heading",
                        text: "Heading",
                        level: "h2",
                    };
                 } else if (activeData.type === "divider") {
                    newBlock = {
                        id: generateId(),
                        type: "divider",
                        style: "solid",
                    };
                 } else if (activeData.type === "image_display") {
                    newBlock = {
                        id: generateId(),
                        type: "image_display",
                        imageUrl: "",
                        alt: "",
                    };
                 } else if (activeData.type === "video_embed") {
                    newBlock = {
                        id: generateId(),
                        type: "video_embed",
                        videoUrl: "",
                    };
                 } else if (activeData.type === "quote") {
                    newBlock = {
                        id: generateId(),
                        type: "quote",
                        text: "",
                        attribution: "",
                    };
                 } else {
                    newBlock = { 
                        id: generateId(), 
                        type: "question", 
                        label: activeData.label, 
                        inputType: activeData.inputType || "short", 
                        required: false 
                      };
                 }
                 
                 // Find index if dropped over a block
                 const section = sections.find(s => s.id === targetSectionId);
                 let index = undefined;
                 if (section) {
                    const overBlockIndex = section.blocks.findIndex(b => b.id === over.id);
                    if (overBlockIndex !== -1) index = overBlockIndex;
                 }

                 addBlock(targetSectionId, newBlock, index);
             }
        }
        return;
    }

    // --- SCENARIO 2: Reordering Existing Items ---
    
    // 2A: Reordering Sections
    if (activeData?.type === "section") {
        // Check for drag-to-delete (swipe right)
        if (event.delta.x > 200) {
             removeSection(active.id as string);
             return;
        }

        if (active.id !== over.id) {
             setSections((items) => {
                 const oldIndex = items.findIndex((item) => item.id === active.id);
                 const newIndex = items.findIndex((item) => item.id === over.id);
                 return arrayMove(items, oldIndex, newIndex);
             });
        }
        return;
    }

    if (activeData?.type === "block" || activeData?.type === "question" || activeData?.type === "image_choice" || activeData?.type === "image_moodboard" || activeData?.type === "this_not_this" || activeData?.type === "context" || activeData?.type === "link_preview" || activeData?.type === "book_call") {
        const activeSectionId = findSectionContainer(active.id as string);
        let overSectionId = findSectionContainer(over.id as string);
        
        // Check if dropped on section droppable directly
        if (!overSectionId && (over.id as string).startsWith("section-droppable-")) {
            overSectionId = (over.id as string).replace("section-droppable-", "");
        }

        if (!activeSectionId || !overSectionId) return;

        const activeSection = sections.find(s => s.id === activeSectionId);
        const overSection = sections.find(s => s.id === overSectionId);

        if (!activeSection || !overSection) return;

        const activeIndex = activeSection.blocks.findIndex(b => b.id === active.id);
        let overIndex = overSection.blocks.findIndex(b => b.id === over.id);

        if (activeSectionId === overSectionId) {
            // Same section reorder
            if (activeIndex !== overIndex && overIndex !== -1) {
                 setSections(prev => prev.map(sec => {
                     if (sec.id === activeSectionId) {
                         return { ...sec, blocks: arrayMove(sec.blocks, activeIndex, overIndex) };
                     }
                     return sec;
                 }));
            }
        } else {
            // Move to different section
            setSections(prev => {
                const newSections = [...prev];
                const activeSecIdx = newSections.findIndex(s => s.id === activeSectionId);
                const overSecIdx = newSections.findIndex(s => s.id === overSectionId);
                
                // Remove from source
                const [movedBlock] = newSections[activeSecIdx].blocks.splice(activeIndex, 1);
                
                // Insert into target
                if (overIndex === -1) {
                    // Dropped on section container, append
                    newSections[overSecIdx].blocks.push(movedBlock);
                } else {
                    newSections[overSecIdx].blocks.splice(overIndex, 0, movedBlock);
                }
                
                return newSections;
            });
        }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      id="intake-editor-dnd-context"
    >
      {children}
      <DragOverlay>
        {activeDragItem ? (
            activeDragItem.isSidebar ? (
                <SidebarItemOverlay label={activeDragItem.label} />
            ) : (
                <DragOverlayContent 
                    label={activeDragItem.label} 
                    isSection={activeDragItem.type === "section"} 
                />
            )
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
