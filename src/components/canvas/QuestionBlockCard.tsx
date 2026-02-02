"use client";

import React, { useState } from "react";
import { QuestionBlock, InputType } from "@/types/editor";
import { useEditor } from "@/hooks/use-editor";
import { Input } from "@/src/components/ui/Input";
import { Textarea } from "@/src/components/ui/Textarea";
import { Select } from "@/src/components/ui/Select";
import { Button } from "@/src/components/ui/Button";

interface QuestionBlockCardProps {
  block: QuestionBlock;
}

export function QuestionBlockCard({ block }: QuestionBlockCardProps) {
  const { sections, updateBlock } = useEditor();
  const [newOption, setNewOption] = useState("");

  // Find parent section id
  const parentSection = sections.find((s) => s.blocks.some((b) => b.id === block.id));
  
  const handleAddOption = () => {
    if (!newOption.trim() || !parentSection) return;
    
    const currentOptions = block.options || [];
    if (currentOptions.includes(newOption.trim())) return;

    updateBlock(parentSection.id, block.id, {
      options: [...currentOptions, newOption.trim()]
    });
    setNewOption("");
  };

  const handleRemoveOption = (optionToRemove: string) => {
    if (!parentSection) return;
    const currentOptions = block.options || [];
    updateBlock(parentSection.id, block.id, {
      options: currentOptions.filter(opt => opt !== optionToRemove)
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
        e.stopPropagation();
        handleAddOption();
    }
  };

  // Prevent interactions from triggering drag/select where unwanted
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const renderInputPreview = () => {
    switch (block.inputType) {
      case "short":
        return <Input placeholder="Type your answer..." disabled className="bg-zinc-50 dark:bg-zinc-800/50" />;
      
      case "long":
        return <Textarea placeholder="Type your answer..." disabled className="bg-zinc-50 dark:bg-zinc-800/50 min-h-[100px]" />;
      
      case "date":
         return (
             <div className="relative">
                 <Input placeholder="Select date..." disabled className="bg-zinc-50 dark:bg-zinc-800/50 pl-10" />
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                 </div>
             </div>
         );

      case "file":
        return (
            <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span className="text-sm">Click to upload or drag and drop</span>
            </div>
        );

      case "slider":
        return (
            <div className="py-4 px-2">
                <input type="range" className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-not-allowed dark:bg-zinc-700" disabled />
                <div className="flex justify-between text-xs text-zinc-400 mt-2">
                    <span>{block.options?.[0] || "Min"}</span>
                    <span>{block.options?.[block.options.length - 1] || "Max"}</span>
                </div>
            </div>
        );

      case "select":
      case "multi":
        return (
            <div className="space-y-3">
                {/* Visual Preview */}
                <div className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 dark:bg-zinc-800/30 dark:border-zinc-700 text-zinc-400 text-sm flex items-center justify-between">
                    <span>{block.inputType === "multi" ? "Select options..." : "Select option..."}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>

                {/* Inline Option Management */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800" onClick={stopPropagation} onMouseDown={stopPropagation}>
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Options</label>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                        {(!block.options || block.options.length === 0) && (
                            <span className="text-xs text-zinc-400 italic">No options added yet</span>
                        )}
                        {block.options?.map((option, idx) => (
                            <div key={idx} className="flex items-center gap-1 pl-2.5 pr-1 py-1 bg-white border border-zinc-200 rounded-full text-xs font-medium text-zinc-700 shadow-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
                                {option}
                                <button 
                                    onClick={() => handleRemoveOption(option)}
                                    className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-red-500 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Input 
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Add new option..."
                            className="h-8 text-xs"
                        />
                        <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={handleAddOption}
                            disabled={!newOption.trim()}
                        >
                            Add
                        </Button>
                    </div>
                </div>
            </div>
        );

      default:
        return <div className="text-red-500 text-xs">Unknown input type</div>;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                {block.label}
            </span>
            {block.required && <span className="text-red-500 text-xs font-bold" title="Required">*</span>}
         </div>
         <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
            {block.inputType}
         </span>
      </div>
      
      {/* Helper Text */}
      {block.helperText && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 -mt-1">{block.helperText}</p>
      )}

      {/* Input Preview */}
      <div className="mt-1">
        {renderInputPreview()}
      </div>
    </div>
  );
}
