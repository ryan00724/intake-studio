"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ImageMoodboardItem } from "@/types/editor";
import { motion, AnimatePresence } from "framer-motion";

interface MoodboardProps {
  items: ImageMoodboardItem[];
  onReorder: (newItems: ImageMoodboardItem[]) => void;
  onRemove?: (id: string) => void;
  readOnly?: boolean;
}

export function Moodboard({ items, onReorder, onRemove, readOnly = false }: MoodboardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  if (items.length === 0) {
      return (
          <div className="w-full h-48 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-50"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              <span className="text-sm font-medium">Add images to build a moodboard</span>
          </div>
      );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence initial={false}>
                {items.map((item, index) => (
                    <SortableImageCard 
                        key={item.id} 
                        item={item} 
                        index={index}
                        onRemove={onRemove} 
                        readOnly={readOnly}
                    />
                ))}
            </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface SortableImageCardProps {
  item: ImageMoodboardItem;
  index: number;
  onRemove?: (id: string) => void;
  readOnly?: boolean;
}

function SortableImageCard({ item, index, onRemove, readOnly }: SortableImageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`relative group aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 ${readOnly ? '' : 'cursor-grab active:cursor-grabbing'} ${isDragging ? 'z-50 shadow-xl scale-105 opacity-90' : ''}`}
    >
        {/* Ranking Indicator */}
        <div className="absolute top-2 left-2 z-10 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
            #{index + 1}
        </div>

        {/* Image */}
        <img 
            src={item.imageUrl} 
            alt={item.caption || "Moodboard image"} 
            className="w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Remove Button */}
        {!readOnly && onRemove && (
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent drag start
                    onRemove(item.id);
                }}
                className="absolute top-2 right-2 z-10 p-1 bg-white/90 dark:bg-black/90 text-zinc-600 dark:text-zinc-300 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 hover:bg-white shadow-sm"
                onPointerDown={(e) => e.stopPropagation()} // Prevent drag
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
            </button>
        )}

        {/* Caption Overlay */}
        {item.caption && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                <p className="text-xs text-white/90 font-medium truncate">{item.caption}</p>
            </div>
        )}
    </div>
  );
}
