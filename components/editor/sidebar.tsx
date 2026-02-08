"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Panel } from "@/src/components/ui/Panel";
import { 
  LayoutTemplate, 
  Type, 
  Grid,
  Layers,
  MousePointer2,
  Image as ImageIcon,
  Palette,
  Split,
  TextCursor,
  AlignLeft,
  Calendar,
  SlidersHorizontal,
  CheckSquare,
  Upload,
  Link,
  Phone,
  Briefcase,
  ListChecks,
  Monitor,
  Heading,
  Minus,
  Video,
  Quote,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BlockType, InputType } from "@/types/editor";
import { useEditor } from "@/hooks/use-editor";

// --- Configuration ---

const CATEGORIES = [
  { id: "structure", label: "Structure", icon: Layers },
  { id: "presentation", label: "Presentation", icon: Monitor },
  { id: "text", label: "Text", icon: Type },
  { id: "choices", label: "Choices", icon: ListChecks },
  { id: "visual", label: "Visual", icon: Grid },
  { id: "consultant", label: "Consult", icon: Briefcase },
] as const;

type CategoryId = typeof CATEGORIES[number]["id"];

interface ToolConfig {
  type: "section" | BlockType;
  inputType?: InputType;
  label: string;
  helperText?: string;
  icon?: React.ElementType;
}

const TOOLS: Record<CategoryId, ToolConfig[]> = {
  structure: [
    { type: "section", label: "New Section", helperText: "Start a new page", icon: LayoutTemplate },
    { type: "context", label: "Context Block", helperText: "Instructions or info", icon: AlignLeft },
  ],
  presentation: [
    { type: "heading", label: "Heading", helperText: "Title or subtitle", icon: Heading },
    { type: "divider", label: "Divider", helperText: "Visual separator", icon: Minus },
    { type: "image_display", label: "Image", helperText: "Display an image", icon: ImageIcon },
    { type: "video_embed", label: "Video", helperText: "Embed a video", icon: Video },
    { type: "quote", label: "Quote", helperText: "Blockquote text", icon: Quote },
  ],
  text: [
    { type: "question", inputType: "short", label: "Short Text", helperText: "Single line input", icon: TextCursor },
    { type: "question", inputType: "long", label: "Long Text", helperText: "Paragraph input", icon: AlignLeft },
  ],
  choices: [
    { type: "question", inputType: "select", label: "Select Dropdown", helperText: "Single option menu", icon: MousePointer2 },
    { type: "question", inputType: "multi", label: "Multi Select", helperText: "Choose multiple", icon: CheckSquare },
    { type: "question", inputType: "slider", label: "Range Slider", helperText: "Numeric range", icon: SlidersHorizontal },
    { type: "question", inputType: "date", label: "Date Picker", helperText: "Select a date", icon: Calendar },
    { type: "question", inputType: "file", label: "File Upload", helperText: "Request documents", icon: Upload },
  ],
  visual: [
    { type: "image_choice", label: "Image Choice", helperText: "Visual selection", icon: ImageIcon },
    { type: "image_moodboard", label: "Moodboard", helperText: "Image curation", icon: Palette },
    { type: "this_not_this", label: "This / Not This", helperText: "Visual sorting", icon: Split },
  ],
  consultant: [
    { type: "link_preview", label: "Link Preview", helperText: "Client pastes URLs", icon: Link },
    { type: "book_call", label: "Book a Call", helperText: "Booking CTA button", icon: Phone },
  ],
};

// --- Components ---

function ToolboxCard({ data }: { data: ToolConfig }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${data.type}-${data.inputType || 'generic'}`,
    data: {
      ...data,
      isSidebar: true,
    },
  });

  const Icon = data.icon || Grid;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="outline-none touch-none"
    >
      <div 
        className={`
            group relative flex flex-col gap-2 p-3 rounded-xl border transition-all duration-200
            bg-white dark:bg-zinc-800/40 
            hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-md hover:-translate-y-0.5
            cursor-grab active:cursor-grabbing
            ${isDragging ? 'opacity-50 ring-2 ring-zinc-500/20 border-zinc-500/30' : 'border-zinc-200 dark:border-zinc-800'}
        `}
      >
        <div className="flex items-start justify-between">
            <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 group-hover:text-zinc-900 group-hover:bg-zinc-100 dark:group-hover:text-zinc-100 dark:group-hover:bg-zinc-700 transition-colors">
                <Icon className="w-5 h-5" />
            </div>
            {/* Drag Handle Indicator */}
            <div className="opacity-0 group-hover:opacity-100 text-zinc-300 dark:text-zinc-600 transition-opacity">
                <Grid className="w-3 h-3" />
            </div>
        </div>
        
        <div>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{data.label}</h3>
            {data.helperText && (
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5 line-clamp-1">{data.helperText}</p>
            )}
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { isToolboxOpen, activeCategory } = useEditor();
  const catId = activeCategory as CategoryId;
  const catLabel = CATEGORIES.find(c => c.id === catId)?.label || activeCategory;

  if (!isToolboxOpen) return null;

  return (
    <Panel className="w-52 flex flex-col h-full shadow-sm bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span className="text-zinc-400 dark:text-zinc-500 font-normal">Toolbox /</span> 
              {catLabel}
          </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
          <div className="grid grid-cols-1 gap-2">
              <AnimatePresence mode="popLayout">
                  {TOOLS[catId]?.map((tool, i) => (
                      <motion.div
                          key={`${catId}-${tool.type}-${tool.inputType || 'def'}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: i * 0.05 }}
                      >
                          <ToolboxCard data={tool} />
                      </motion.div>
                  ))}
              </AnimatePresence>
          </div>
      </div>
    </Panel>
  );
}
