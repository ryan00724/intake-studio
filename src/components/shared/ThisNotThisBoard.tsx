"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ThisNotThisItem } from "@/types/editor";
import { motion, AnimatePresence } from "framer-motion";

interface ThisNotThisBoardProps {
  items: ThisNotThisItem[];
  yesItems?: string[]; // IDs
  noItems?: string[]; // IDs
  onUpdate?: (yesIds: string[], noItems: string[]) => void;
  readOnly?: boolean;
}

export function ThisNotThisBoard({ items, yesItems = [], noItems = [], onUpdate, readOnly = false }: ThisNotThisBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Local state for optimistic updates if not controlled
  const [localYes, setLocalYes] = useState<string[]>(yesItems);
  const [localNo, setLocalNo] = useState<string[]>(noItems);

  // Derived pool of unsorted items
  const unsortedItems = items.filter(item => !localYes.includes(item.id) && !localNo.includes(item.id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeItemId = active.id as string;
    const overContainer = over.id as string; // 'yes-col', 'no-col', 'pool-col'

    // Determine current container
    let sourceContainer = 'pool-col';
    if (localYes.includes(activeItemId)) sourceContainer = 'yes-col';
    if (localNo.includes(activeItemId)) sourceContainer = 'no-col';

    // Same container sorting? (If supported later, for now just append)
    if (sourceContainer === overContainer) return;

    // Move logic
    let nextYes = [...localYes];
    let nextNo = [...localNo];

    // Remove from source
    if (sourceContainer === 'yes-col') nextYes = nextYes.filter(id => id !== activeItemId);
    else if (sourceContainer === 'no-col') nextNo = nextNo.filter(id => id !== activeItemId);

    // Add to target
    if (overContainer === 'yes-col') nextYes.push(activeItemId);
    else if (overContainer === 'no-col') nextNo.push(activeItemId);
    
    // Update state
    setLocalYes(nextYes);
    setLocalNo(nextNo);
    onUpdate?.(nextYes, nextNo);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-8">
        {/* Sorting Columns */}
        <div className="grid grid-cols-2 gap-4 md:gap-8">
            <Column 
                id="yes-col" 
                title="YES / LIKE" 
                items={localYes.map(id => items.find(i => i.id === id)!)}
                variant="yes"
            />
            <Column 
                id="no-col" 
                title="NO / AVOID" 
                items={localNo.map(id => items.find(i => i.id === id)!)}
                variant="no"
            />
        </div>

        {/* Unsorted Pool */}
        {unsortedItems.length > 0 && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
                <p className="text-sm font-medium text-zinc-500 mb-4 text-center uppercase tracking-wider">Unsorted Items</p>
                <div className="flex flex-wrap justify-center gap-2 min-h-[100px] p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-700">
                    <Column 
                        id="pool-col" 
                        title="" 
                        items={unsortedItems} 
                        variant="neutral" 
                        isRow
                    />
                </div>
            </div>
        )}
      </div>

      <DragOverlay>
        {activeId ? (
            <div className="w-full aspect-[4/3] max-w-[150px] rounded-lg overflow-hidden shadow-2xl ring-2 ring-indigo-500 bg-white dark:bg-zinc-800 cursor-grabbing">
                <img 
                    src={items.find(i => i.id === activeId)?.imageUrl} 
                    className="w-full h-full object-cover opacity-90" 
                />
            </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({ id, title, items, variant, isRow = false }: { id: string, title: string, items: ThisNotThisItem[], variant: 'yes' | 'no' | 'neutral', isRow?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const bgColors = {
      yes: isOver ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800',
      no: isOver ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800',
      neutral: 'bg-transparent border-none'
  };

  return (
    <div className={`flex flex-col h-full ${!isRow ? 'min-h-[300px]' : ''}`}>
        {title && (
            <div className={`text-center mb-3 pb-2 border-b-2 font-bold tracking-widest text-xs
                ${variant === 'yes' ? 'border-green-500 text-green-600 dark:text-green-400' : ''}
                ${variant === 'no' ? 'border-red-500 text-red-600 dark:text-red-400' : ''}
            `}>
                {title}
            </div>
        )}
        
        <div 
            ref={setNodeRef}
            className={`
                flex-1 rounded-xl p-4 transition-colors duration-200 border-2 border-dashed
                ${!isRow ? bgColors[variant] : ''}
                ${isRow ? 'flex flex-wrap justify-center gap-2' : 'flex flex-wrap justify-center content-start gap-2'}
            `}
        >
            {items.map(item => (
                <DraggableCard key={item.id} item={item} />
            ))}
            
            {items.length === 0 && !isRow && (
                <div className="h-full w-full flex items-center justify-center text-zinc-400 text-sm italic opacity-50">
                    Drop items here
                </div>
            )}
        </div>
    </div>
  );
}

function DraggableCard({ item }: { item: ThisNotThisItem }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggableItem(item.id);
    
    const style = transform ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`
                relative group rounded-lg overflow-hidden bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 
                cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition-all
                ${isDragging ? 'opacity-0' : 'opacity-100'}
                w-full aspect-[4/3] max-w-[150px]
            `}
        >
            <img src={item.imageUrl} className="w-full h-full object-cover pointer-events-none" />
            {item.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                    <p className="text-[10px] text-white/90 font-medium truncate text-center">{item.caption}</p>
                </div>
            )}
        </div>
    );
}

// Wrapper to isolate useSortable context if we switch to Sortable later
function useDraggableItem(id: string) {
    // Using simple draggable since we're just moving between containers without precise index sorting yet
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id });
    return { attributes, listeners, setNodeRef, transform, isDragging };
}
