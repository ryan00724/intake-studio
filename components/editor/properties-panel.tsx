"use client";

import { useEditor } from "@/hooks/use-editor";
import { IntakeSection, IntakeBlock, InputType, QuestionBlock } from "@/types/editor";
import { Panel } from "@/src/components/ui/Panel";
import { Field } from "@/src/components/ui/Field";
import { Input } from "@/src/components/ui/Input";
import { Textarea } from "@/src/components/ui/Textarea";
import { Select } from "@/src/components/ui/Select";
import { Button } from "@/src/components/ui/Button";
import { Checkbox } from "@/src/components/ui/Checkbox";
import { useState } from "react";

const INPUT_TYPE_OPTIONS = [
  { label: "Short Text", value: "short" },
  { label: "Long Text", value: "long" },
  { label: "Select Dropdown", value: "select" },
  { label: "Multi Select", value: "multi" },
  { label: "Slider", value: "slider" },
  { label: "Date Picker", value: "date" },
  { label: "File Upload", value: "file" },
];

const VIEW_MODE_OPTIONS = [
  { label: "Guided Experience", value: "guided" },
  { label: "Document View", value: "document" },
];

import { generateId } from "@/lib/constants";

export function PropertiesPanel() {
  const { 
    selectedId, 
    sections, 
    updateSection, 
    removeSection, 
    updateBlock, 
    removeBlock,
    metadata,
    updateMetadata
  } = useEditor();
  
  const [copied, setCopied] = useState(false);
  const [newMoodboardImageUrl, setNewMoodboardImageUrl] = useState("");
  const [newThisNotThisImageUrl, setNewThisNotThisImageUrl] = useState("");

  // Find selection
  let selectedSection: IntakeSection | undefined;
  let selectedBlock: IntakeBlock | undefined;
  let parentSectionId: string | undefined;

  // Check if section
  selectedSection = sections.find(s => s.id === selectedId);
  
  // If not, check if block
  if (!selectedSection) {
      for (const sec of sections) {
          const found = sec.blocks.find(b => b.id === selectedId);
          if (found) {
              selectedBlock = found;
              parentSectionId = sec.id;
              break;
          }
      }
  }

  
  const handleCopySlug = () => {
    if (metadata.slug) {
        navigator.clipboard.writeText(`${window.location.origin}/i/${metadata.slug}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    updateMetadata({
                        theme: {
                            ...metadata.theme,
                            background: {
                                ...metadata.theme?.background,
                                type: "image",
                                imageUrl: ev.target.result as string,
                            }
                        }
                    });
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSectionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedSection && e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    updateSection(selectedSection.id, {
                        style: {
                            ...selectedSection.style,
                            background: {
                                ...selectedSection.style?.background,
                                type: "image",
                                imageUrl: ev.target.result as string,
                            }
                        }
                    });
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleOptionImage = (e: React.ChangeEvent<HTMLInputElement>, optionId: string) => {
        if (selectedBlock?.type === "image_choice" && parentSectionId && e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result && selectedBlock) {
                    // Force React to see this as a fresh update by creating a new array reference first
                    const currentOptions = [...selectedBlock.options];
                    // @ts-ignore
                    const newOptions = currentOptions.map(opt => 
                        opt.id === optionId ? { ...opt, imageUrl: ev.target!.result as string } : opt
                    );
                    updateBlock(parentSectionId, selectedBlock.id, { options: newOptions });
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // GLOBAL METADATA EDITING (No Selection)
  if (!selectedId || (!selectedSection && !selectedBlock)) {
    return (
      <Panel className="w-80 flex flex-col h-full shadow-sm">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/50">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Intake Settings</h2>
        </div>
        <div className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            
            <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800/50 space-y-6">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Theme & Branding</h3>
                
                <Field label="Accent Color">
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input 
                                type="color" 
                                value={metadata.theme?.accentColor || "#3b82f6"}
                                onChange={(e) => updateMetadata({ theme: { ...metadata.theme, accentColor: e.target.value } })}
                                className="h-9 w-9 p-0.5 rounded-lg border border-zinc-200 cursor-pointer bg-white"
                            />
                            <Input
                                value={metadata.theme?.accentColor || ""}
                                onChange={(e) => updateMetadata({ theme: { ...metadata.theme, accentColor: e.target.value } })}
                                placeholder="#3b82f6"
                                className="flex-1"
                            />
                        </div>
                        
                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-3">
                            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Component Preview</p>
                            <div className="flex items-center gap-3">
                                <div 
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm"
                                    style={{ backgroundColor: metadata.theme?.accentColor || "#3b82f6" }}
                                >
                                    Button
                                </div>
                                <div 
                                    className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                    style={{ 
                                        backgroundColor: `${metadata.theme?.accentColor || "#3b82f6"}15`,
                                        color: metadata.theme?.accentColor || "#3b82f6",
                                        border: `1px solid ${metadata.theme?.accentColor || "#3b82f6"}30`
                                    }}
                                >
                                    Badge
                                </div>
                                <div 
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                                    style={{ backgroundColor: metadata.theme?.accentColor || "#3b82f6" }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </Field>

                <Field label="Background Type">
                    <Select
                        value={metadata.theme?.background?.type || "none"}
                        onChange={(val: any) => updateMetadata({ 
                            theme: { 
                                ...metadata.theme, 
                                background: { ...metadata.theme?.background, type: val } 
                            } 
                        })}
                        options={[
                            { label: "None (Default)", value: "none" },
                            { label: "Solid Color", value: "color" },
                            { label: "Image", value: "image" },
                            { label: "Video", value: "video" },
                        ]}
                    />
                </Field>

                {metadata.theme?.background?.type === "video" && (
                    <div className="space-y-4">
                        <Field label="Video URL (MP4)" hint="Paste a direct .mp4 link. YouTube/Vimeo not supported.">
                            <Input
                                value={metadata.theme.background.videoUrl || ""}
                                onChange={(e) => updateMetadata({
                                    theme: {
                                        ...metadata.theme,
                                        background: { ...metadata.theme?.background, type: "video", videoUrl: e.target.value }
                                    }
                                })}
                                placeholder="https://example.com/video.mp4"
                            />
                            {metadata.theme.background.videoUrl && !metadata.theme.background.videoUrl.endsWith(".mp4") && (
                                <p className="text-xs text-red-500 mt-1">URL must end with .mp4</p>
                            )}
                        </Field>

                        <Field label="Overlay Color">
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={metadata.theme?.background?.overlayColor || "#000000"}
                                    onChange={(e) => updateMetadata({
                                        theme: {
                                            ...metadata.theme,
                                            background: { ...metadata.theme?.background, type: "video", overlayColor: e.target.value }
                                        }
                                    })}
                                    className="h-9 w-9 p-0.5 rounded-lg border border-zinc-200 cursor-pointer bg-white"
                                />
                                <Input
                                    value={metadata.theme?.background?.overlayColor || ""}
                                    onChange={(e) => updateMetadata({
                                        theme: {
                                            ...metadata.theme,
                                            background: { ...metadata.theme?.background, type: "video", overlayColor: e.target.value }
                                        }
                                    })}
                                    placeholder="#000000"
                                    className="flex-1"
                                />
                            </div>
                        </Field>

                        <Field label="Overlay Opacity">
                            <input
                                type="range"
                                min="0" max="1" step="0.05"
                                value={metadata.theme?.background?.overlayOpacity ?? 0.55}
                                onChange={(e) => updateMetadata({
                                    theme: {
                                        ...metadata.theme,
                                        background: { ...metadata.theme?.background, type: "video", overlayOpacity: parseFloat(e.target.value) }
                                    }
                                })}
                                className="w-full accent-blue-600"
                            />
                        </Field>
                    </div>
                )}

                {metadata.theme?.background?.type === "color" && (
                    <Field label="Background Color">
                        <div className="flex gap-2">
                            <input 
                                type="color" 
                                value={metadata.theme?.background?.color || "#f3f4f6"}
                                onChange={(e) => updateMetadata({ 
                                    theme: { 
                                        ...metadata.theme, 
                                        background: { ...metadata.theme?.background, type: "color", color: e.target.value } 
                                    } 
                                })}
                                className="h-9 w-9 p-0.5 rounded-lg border border-zinc-200 cursor-pointer bg-white"
                            />
                            <Input
                                value={metadata.theme?.background?.color || ""}
                                onChange={(e) => updateMetadata({ 
                                    theme: { 
                                        ...metadata.theme, 
                                        background: { ...metadata.theme?.background, type: "color", color: e.target.value } 
                                    } 
                                })}
                                placeholder="#f3f4f6"
                                className="flex-1"
                            />
                        </div>
                    </Field>
                )}

                {metadata.theme?.background?.type === "image" && (
                    <div className="space-y-4">
                        <Field label="Image Upload">
                            <Input type="file" accept="image/*" onChange={handleFileChange} />
                        </Field>
                        {metadata.theme.background.imageUrl && (
                            <div className="relative w-full h-32 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                <img 
                                    src={metadata.theme.background.imageUrl} 
                                    alt="Background Preview" 
                                    className="w-full h-full object-cover" 
                                    style={{
                                        filter: `blur(${metadata.theme.background.blurPx || 0}px)`
                                    }}
                                />
                                <div 
                                    className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300"
                                    style={{
                                        opacity: metadata.theme.background.overlayOpacity ?? 0.55
                                    }}
                                />
                            </div>
                        )}
                        
                        <Field label="Overlay Opacity">
                            <input 
                                type="range" 
                                min="0" max="1" step="0.05"
                                value={metadata.theme?.background?.overlayOpacity ?? 0.55}
                                onChange={(e) => updateMetadata({ 
                                    theme: { 
                                        ...metadata.theme, 
                                        background: { ...metadata.theme?.background, type: "image", overlayOpacity: parseFloat(e.target.value) } 
                                    } 
                                })}
                                className="w-full accent-blue-600"
                            />
                        </Field>

                        <Field label="Blur Amount (px)">
                            <input 
                                type="range" 
                                min="0" max="20" step="1"
                                value={metadata.theme?.background?.blurPx ?? 0}
                                onChange={(e) => updateMetadata({ 
                                    theme: { 
                                        ...metadata.theme, 
                                        background: { ...metadata.theme?.background, type: "image", blurPx: parseInt(e.target.value) } 
                                    } 
                                })}
                                className="w-full accent-blue-600"
                            />
                        </Field>
                    </div>
                )}
            </div>

            <Field label="Intake Title">
                <Input
                    value={metadata.title}
                    onChange={(e) => updateMetadata({ title: e.target.value })}
                />
            </Field>

            <Field label="URL Slug" hint="Unique identifier for this intake.">
                <Input
                    prefixLabel="/i/"
                    value={metadata.slug || ""}
                    onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                        updateMetadata({ slug: val });
                    }}
                    placeholder="my-intake-form"
                    rightSlot={
                        <button 
                            onClick={handleCopySlug}
                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            title="Copy link"
                        >
                            {copied ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            )}
                        </button>
                    }
                />
            </Field>
            
             <Field label="Welcome Message" hint="Supports {client_name}, {company_name} placeholders.">
                <Textarea
                    value={metadata.description || ""}
                    onChange={(e) => updateMetadata({ description: e.target.value })}
                    rows={4}
                    placeholder="Enter a welcome message..."
                />
            </Field>

             <Field label="Estimated Time">
                <Input
                    value={metadata.estimatedTime || ""}
                    onChange={(e) => updateMetadata({ estimatedTime: e.target.value })}
                    placeholder="e.g. 3-5 minutes"
                />
            </Field>

             <Field label="Completion Message">
                <Textarea
                    value={metadata.completionText || ""}
                    onChange={(e) => updateMetadata({ completionText: e.target.value })}
                    rows={4}
                    placeholder="Thank you for completing the intake..."
                />
            </Field>

             <Field label="Next Steps">
                <Textarea
                    value={metadata.completionNextSteps || ""}
                    onChange={(e) => updateMetadata({ completionNextSteps: e.target.value })}
                    rows={3}
                    placeholder="We will review your submission..."
                />
            </Field>

            <div className="grid grid-cols-2 gap-3">
                <Field label="CTA Label">
                    <Input
                        value={metadata.completionButtonLabel || ""}
                        onChange={(e) => updateMetadata({ completionButtonLabel: e.target.value })}
                        placeholder="Visit Website"
                    />
                </Field>
                <Field label="CTA URL">
                    <Input
                        value={metadata.completionButtonUrl || ""}
                        onChange={(e) => updateMetadata({ completionButtonUrl: e.target.value })}
                        placeholder="https://..."
                    />
                </Field>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                 <Field label="Default View Mode">
                    <Select
                        value={metadata.mode || "guided"}
                        onChange={(val) => updateMetadata({ mode: val as "guided" | "document" })}
                        options={VIEW_MODE_OPTIONS}
                    />
                 </Field>
            </div>
        </div>
      </Panel>
    );
  }

  // SELECTION EDITING (Existing code)
  return (
    <Panel className="w-80 flex flex-col h-full shadow-sm">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/50 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {selectedSection ? "Section Properties" : "Block Properties"}
        </h2>
        <span className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
            {selectedSection ? "Section" : selectedBlock?.type}
        </span>
      </div>
      
      <div className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        
        {/* --- SECTION EDITING --- */}
        {selectedSection && (
            <>
                <Field label="Title">
                    <Input
                        value={selectedSection.title}
                        onChange={(e) => updateSection(selectedSection!.id, { title: e.target.value })}
                    />
                </Field>
                <Field label="Description">
                    <Textarea
                        value={selectedSection.description || ""}
                        onChange={(e) => updateSection(selectedSection!.id, { description: e.target.value })}
                        rows={3}
                    />
                </Field>

                {/* --- ROUTING --- */}
                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50 space-y-4">
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        Logic & Routing
                        <span className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 text-[10px] px-1.5 py-0.5 rounded font-bold">BETA</span>
                    </h3>
                    
                    {(() => {
                        // Find eligible trigger questions (Select type only for MVP)
                        const eligibleQuestions = selectedSection.blocks.filter(
                            b => b.type === "question" && b.inputType === "select"
                        ) as QuestionBlock[];

                        if (eligibleQuestions.length === 0) {
                            return (
                                <p className="text-xs text-zinc-400 italic">
                                    Add a "Select Dropdown" question to this section to configure conditional routing.
                                </p>
                            );
                        }

                        const rules = selectedSection.routing || [];
                        const otherSections = sections.filter(s => s.id !== selectedSection!.id);

                        return (
                            <div className="space-y-3">
                                {rules.map((rule, idx) => {
                                    // With type predicate above, eligibleQuestions are strictly select questions
                                    const triggerBlock = eligibleQuestions.find(b => b.id === rule.fromBlockId);
                                    
                                    // If for some reason block is missing (deleted), safe access
                                    const options = triggerBlock?.options || [];

                                    return (
                                        <div key={rule.id} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-3 relative group">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                className="absolute top-2 right-2 h-6 w-6 p-0 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => {
                                                    const newRules = rules.filter(r => r.id !== rule.id);
                                                    updateSection(selectedSection!.id, { routing: newRules });
                                                }}
                                            >
                                                ✕
                                            </Button>

                                            <div className="space-y-1">
                                                <label className="text-[10px] font-medium text-zinc-500 uppercase">If Answer To:</label>
                                                <Select
                                                    value={rule.fromBlockId}
                                                    onChange={(val) => {
                                                        const newRules = [...rules];
                                                        newRules[idx] = { ...rule, fromBlockId: val, value: "" }; // Reset value on change
                                                        updateSection(selectedSection!.id, { routing: newRules });
                                                    }}
                                                    options={eligibleQuestions.map(q => ({ label: q.label || "Untitled Question", value: q.id }))}
                                                />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-zinc-400">Is</span>
                                                <div className="flex-1">
                                                    <Select
                                                        value={rule.value}
                                                        onChange={(val) => {
                                                            const newRules = [...rules];
                                                            newRules[idx] = { ...rule, value: val };
                                                            updateSection(selectedSection!.id, { routing: newRules });
                                                        }}
                                                        options={options.map((opt: string) => ({ label: opt, value: opt }))}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[10px] font-medium text-zinc-500 uppercase">Go To Section:</label>
                                                <Select
                                                    value={rule.nextSectionId}
                                                    onChange={(val) => {
                                                        const newRules = [...rules];
                                                        newRules[idx] = { ...rule, nextSectionId: val };
                                                        updateSection(selectedSection!.id, { routing: newRules });
                                                    }}
                                                    options={otherSections.map(s => ({ label: s.title || "Untitled Section", value: s.id }))}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}

                                <Button
                                    variant="secondary"
                                    className="w-full text-xs"
                                    onClick={() => {
                                        const newRule = {
                                            id: generateId(),
                                            fromBlockId: eligibleQuestions[0]?.id || "", // Safe access
                                            operator: "equals" as const,
                                            value: "",
                                            nextSectionId: otherSections[0]?.id || ""
                                        };
                                        if (newRule.fromBlockId) {
                                            updateSection(selectedSection!.id, { routing: [...rules, newRule] });
                                        }
                                    }}
                                    disabled={otherSections.length === 0 || eligibleQuestions.length === 0}
                                >
                                    + Add Routing Rule
                                </Button>
                            </div>
                        );
                    })()}
                </div>
                
                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50 space-y-6">
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Section Theme Override</h3>
                    
                    <Field label="Accent Color">
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input 
                                    type="color" 
                                    value={selectedSection.style?.color || "#3b82f6"}
                                    onChange={(e) => updateSection(selectedSection!.id, { style: { ...selectedSection!.style, color: e.target.value } })}
                                    className="h-9 w-9 p-0.5 rounded-lg border border-zinc-200 cursor-pointer bg-white"
                                />
                                <Input
                                    value={selectedSection.style?.color || ""}
                                    onChange={(e) => updateSection(selectedSection!.id, { style: { ...selectedSection!.style, color: e.target.value } })}
                                    placeholder="Global accent"
                                    className="flex-1"
                                />
                                <Button 
                                    variant="ghost" 
                                    onClick={() => updateSection(selectedSection!.id, { style: { ...selectedSection!.style, color: undefined } })}
                                    title="Clear override"
                                >
                                    ✕
                                </Button>
                            </div>
                            
                            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-3">
                                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Component Preview</p>
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm"
                                        style={{ backgroundColor: selectedSection.style?.color || "#3b82f6" }}
                                    >
                                        Button
                                    </div>
                                    <div 
                                        className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                        style={{ 
                                            backgroundColor: `${selectedSection.style?.color || "#3b82f6"}15`,
                                            color: selectedSection.style?.color || "#3b82f6",
                                            border: `1px solid ${selectedSection.style?.color || "#3b82f6"}30`
                                        }}
                                    >
                                        Badge
                                    </div>
                                    <div 
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                                        style={{ backgroundColor: selectedSection.style?.color || "#3b82f6" }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Field>

                    <Field label="Background Type">
                        <Select
                            value={selectedSection.style?.background?.type || "none"}
                            onChange={(val: any) => updateSection(selectedSection!.id, { 
                                style: { 
                                    ...selectedSection!.style, 
                                    background: { ...selectedSection!.style?.background, type: val } 
                                } 
                            })}
                            options={[
                                { label: "None (Global)", value: "none" },
                                { label: "Solid Color", value: "color" },
                                { label: "Image", value: "image" },
                            ]}
                        />
                    </Field>

                    {selectedSection.style?.background?.type === "color" && (
                        <Field label="Background Color">
                            <div className="flex gap-2">
                                <input 
                                    type="color" 
                                    value={selectedSection.style?.background?.color || "#f3f4f6"}
                                    onChange={(e) => updateSection(selectedSection!.id, { 
                                        style: { 
                                            ...selectedSection!.style, 
                                            background: { ...selectedSection!.style?.background, type: "color", color: e.target.value } 
                                        } 
                                    })}
                                    className="h-9 w-9 p-0.5 rounded-lg border border-zinc-200 cursor-pointer bg-white"
                                />
                                <Input
                                    value={selectedSection.style?.background?.color || ""}
                                    onChange={(e) => updateSection(selectedSection!.id, { 
                                        style: { 
                                            ...selectedSection!.style, 
                                            background: { ...selectedSection!.style?.background, type: "color", color: e.target.value } 
                                        } 
                                    })}
                                    placeholder="#f3f4f6"
                                    className="flex-1"
                                />
                            </div>
                        </Field>
                    )}

                    {selectedSection.style?.background?.type === "image" && (
                        <div className="space-y-4">
                            <Field label="Image Upload">
                                <Input type="file" accept="image/*" onChange={handleSectionFileChange} />
                            </Field>
                            {selectedSection.style.background.imageUrl && (
                                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                    <img 
                                        src={selectedSection.style.background.imageUrl} 
                                        alt="Section Background Preview" 
                                        className="w-full h-full object-cover"
                                        style={{
                                            filter: `blur(${selectedSection.style.background.blurPx || 0}px)`
                                        }}
                                    />
                                    <div 
                                        className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300"
                                        style={{
                                            opacity: selectedSection.style.background.overlayOpacity ?? 0.55
                                        }}
                                    />
                                </div>
                            )}
                            
                            <Field label="Overlay Opacity">
                                <input 
                                    type="range" 
                                    min="0" max="1" step="0.05"
                                    value={selectedSection.style?.background?.overlayOpacity ?? 0.55}
                                    onChange={(e) => updateSection(selectedSection!.id, { 
                                        style: { 
                                            ...selectedSection!.style, 
                                            background: { ...selectedSection!.style?.background, type: "image", overlayOpacity: parseFloat(e.target.value) } 
                                        } 
                                    })}
                                    className="w-full accent-blue-600"
                                />
                            </Field>

                            <Field label="Blur Amount (px)">
                                <input 
                                    type="range" 
                                    min="0" max="20" step="1"
                                    value={selectedSection.style?.background?.blurPx ?? 0}
                                    onChange={(e) => updateSection(selectedSection!.id, { 
                                        style: { 
                                            ...selectedSection!.style, 
                                            background: { ...selectedSection!.style?.background, type: "image", blurPx: parseInt(e.target.value) } 
                                        } 
                                    })}
                                    className="w-full accent-blue-600"
                                />
                            </Field>
                        </div>
                    )}
                </div>

                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                    <Button
                        variant="danger"
                        className="w-full"
                        onClick={() => removeSection(selectedSection!.id)}
                    >
                        Delete Section
                    </Button>
                </div>
            </>
        )}

        {/* --- BLOCK EDITING --- */}
        {selectedBlock && parentSectionId && (
            <>
                {/* Context Block */}
                {selectedBlock.type === "context" && (
                    <Field label="Content">
                        <Textarea
                            value={selectedBlock.text}
                            onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { text: e.target.value })}
                            rows={6}
                        />
                    </Field>
                )}

                {/* Question Block */}
                {selectedBlock.type === "question" && (
                    <>
                         <Field label="Label">
                            <Input
                                value={selectedBlock.label}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { label: e.target.value })}
                            />
                        </Field>
                        
                        <Field label="Input Type">
                            <Select
                                value={selectedBlock.inputType}
                                onChange={(val) => updateBlock(parentSectionId!, selectedBlock!.id, { inputType: val as InputType })}
                                options={INPUT_TYPE_OPTIONS}
                            />
                        </Field>

                        <Field label="Helper Text">
                            <Input
                                value={selectedBlock.helperText || ""}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { helperText: e.target.value })}
                            />
                        </Field>

                        {selectedBlock.inputType === "slider" && (
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <Field label="Min Label">
                                    <Input
                                        placeholder="e.g. Low"
                                        value={selectedBlock.options?.[0] || ""}
                                        onChange={(e) => {
                                            const currentOpts = selectedBlock!.options || [];
                                            // Ensure we have at least 2 slots
                                            const newOpts = [...currentOpts];
                                            if (newOpts.length === 0) newOpts.push("");
                                            if (newOpts.length === 1) newOpts.push("");
                                            
                                            newOpts[0] = e.target.value;
                                            updateBlock(parentSectionId!, selectedBlock!.id, { options: newOpts });
                                        }}
                                    />
                                </Field>
                                <Field label="Max Label">
                                    <Input
                                        placeholder="e.g. High"
                                        value={selectedBlock.options?.[1] || ""}
                                        onChange={(e) => {
                                            const currentOpts = selectedBlock!.options || [];
                                            const newOpts = [...currentOpts];
                                            if (newOpts.length === 0) newOpts.push("");
                                            if (newOpts.length === 1) newOpts.push("");
                                            
                                            // If more than 2 (unlikely for slider), preserve them
                                            // Usually slider options are [minLabel, maxLabel]
                                            newOpts[newOpts.length - 1] = e.target.value;
                                            updateBlock(parentSectionId!, selectedBlock!.id, { options: newOpts });
                                        }}
                                    />
                                </Field>
                            </div>
                        )}

                         <div className="flex items-center gap-3 mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <Checkbox
                                checked={selectedBlock.required || false}
                                onCheckedChange={(checked) => updateBlock(parentSectionId!, selectedBlock!.id, { required: checked })}
                                label="Required field"
                            />
                        </div>
                    </>
                )}

                {/* Image Choice Block */}
                {selectedBlock.type === "image_choice" && (
                    <>
                         <Field label="Label">
                            <Input
                                value={selectedBlock.label}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { label: e.target.value })}
                            />
                        </Field>

                        <Field label="Helper Text">
                            <Input
                                value={selectedBlock.helperText || ""}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { helperText: e.target.value })}
                            />
                        </Field>

                         <div className="space-y-3 mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <Checkbox
                                checked={selectedBlock.required || false}
                                onCheckedChange={(checked) => updateBlock(parentSectionId!, selectedBlock!.id, { required: checked })}
                                label="Required field"
                            />
                            <Checkbox
                                checked={selectedBlock.multi || false}
                                onCheckedChange={(checked) => updateBlock(parentSectionId!, selectedBlock!.id, { multi: checked })}
                                label="Allow multiple selection"
                            />
                        </div>

                        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Image Options</h3>
                            </div>
                            
                            <div className="space-y-4">
                                {selectedBlock.options.map((opt, idx) => (
                                    <div key={opt.id} className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-3 bg-white dark:bg-zinc-800">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-zinc-400">Option {idx + 1}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500"
                                                onClick={() => {
                                                    const newOptions = selectedBlock!.options.filter(o => o.id !== opt.id);
                                                    updateBlock(parentSectionId!, selectedBlock!.id, { options: newOptions });
                                                }}
                                            >
                                                ✕
                                            </Button>
                                        </div>
                                        
                                        <div className="flex gap-3">
                                            <label className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:opacity-80 transition-opacity shrink-0">
                                                {opt.imageUrl ? (
                                                    <img src={opt.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleOptionImage(e, opt.id)} />
                                            </label>
                                            
                                            <Input 
                                                placeholder="Label (optional)" 
                                                value={opt.label || ""} 
                                                onChange={(e) => {
                                                    const newOptions = selectedBlock!.options.map(o => 
                                                        o.id === opt.id ? { ...o, label: e.target.value } : o
                                                    );
                                                    updateBlock(parentSectionId!, selectedBlock!.id, { options: newOptions });
                                                }}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button 
                                variant="secondary" 
                                className="w-full"
                                onClick={() => {
                                    const newOption = { id: generateId(), imageUrl: "", label: "" };
                                    updateBlock(parentSectionId!, selectedBlock!.id, { options: [...selectedBlock!.options, newOption] });
                                }}
                            >
                                Add Option
                            </Button>
                        </div>
                    </>
                )}

                {/* Moodboard Block */}
                {selectedBlock.type === "image_moodboard" && (
                    <>
                        <Field label="Label">
                            <Input
                                value={selectedBlock.label}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { label: e.target.value })}
                            />
                        </Field>
                        <Field label="Helper Text">
                            <Input
                                value={selectedBlock.helperText || ""}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { helperText: e.target.value })}
                            />
                        </Field>

                        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50 space-y-4">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Moodboard Images</h3>
                            
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Image URL" 
                                    value={newMoodboardImageUrl}
                                    onChange={(e) => setNewMoodboardImageUrl(e.target.value)}
                                />
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        if (newMoodboardImageUrl) {
                                            const newItem = { id: generateId(), imageUrl: newMoodboardImageUrl, caption: "" };
                                            updateBlock(parentSectionId!, selectedBlock!.id, { items: [...selectedBlock!.items, newItem] });
                                            setNewMoodboardImageUrl("");
                                        }
                                    }}
                                    disabled={!newMoodboardImageUrl}
                                >
                                    Add
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {selectedBlock.items.map((item, idx) => (
                                    <div key={item.id} className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-2 bg-white dark:bg-zinc-800">
                                        <div className="flex gap-3 items-start">
                                            <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-900 overflow-hidden shrink-0">
                                                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex justify-between items-center">
                                                     <span className="text-xs font-medium text-zinc-400">Image {idx + 1}</span>
                                                     <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500"
                                                        onClick={() => {
                                                            const newItems = selectedBlock!.items.filter(i => i.id !== item.id);
                                                            updateBlock(parentSectionId!, selectedBlock!.id, { items: newItems });
                                                        }}
                                                    >
                                                        ✕
                                                    </Button>
                                                </div>
                                                <Input 
                                                    placeholder="Caption (optional)"
                                                    value={item.caption || ""}
                                                    onChange={(e) => {
                                                        const newItems = selectedBlock!.items.map(i => 
                                                            i.id === item.id ? { ...i, caption: e.target.value } : i
                                                        );
                                                        updateBlock(parentSectionId!, selectedBlock!.id, { items: newItems });
                                                    }}
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* This Not This Block */}
                {selectedBlock.type === "this_not_this" && (
                    <>
                        <Field label="Label">
                            <Input
                                value={selectedBlock.label}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { label: e.target.value })}
                            />
                        </Field>
                        <Field label="Helper Text">
                            <Input
                                value={selectedBlock.helperText || ""}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { helperText: e.target.value })}
                            />
                        </Field>

                        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50 space-y-4">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sorting Items</h3>
                            
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Image URL" 
                                    value={newThisNotThisImageUrl}
                                    onChange={(e) => setNewThisNotThisImageUrl(e.target.value)}
                                />
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        if (newThisNotThisImageUrl) {
                                            const newItem = { id: generateId(), imageUrl: newThisNotThisImageUrl, caption: "" };
                                            updateBlock(parentSectionId!, selectedBlock!.id, { items: [...selectedBlock!.items, newItem] });
                                            setNewThisNotThisImageUrl("");
                                        }
                                    }}
                                    disabled={!newThisNotThisImageUrl}
                                >
                                    Add
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {selectedBlock.items.map((item, idx) => (
                                    <div key={item.id} className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-2 bg-white dark:bg-zinc-800">
                                        <div className="flex gap-3 items-start">
                                            <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-900 overflow-hidden shrink-0">
                                                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex justify-between items-center">
                                                     <span className="text-xs font-medium text-zinc-400">Item {idx + 1}</span>
                                                     <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500"
                                                        onClick={() => {
                                                            const newItems = selectedBlock!.items.filter(i => i.id !== item.id);
                                                            updateBlock(parentSectionId!, selectedBlock!.id, { items: newItems });
                                                        }}
                                                    >
                                                        ✕
                                                    </Button>
                                                </div>
                                                <Input 
                                                    placeholder="Caption (optional)"
                                                    value={item.caption || ""}
                                                    onChange={(e) => {
                                                        const newItems = selectedBlock!.items.map(i => 
                                                            i.id === item.id ? { ...i, caption: e.target.value } : i
                                                        );
                                                        updateBlock(parentSectionId!, selectedBlock!.id, { items: newItems });
                                                    }}
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50 mt-6">
                    <Button
                        variant="danger"
                        className="w-full"
                        onClick={() => removeBlock(parentSectionId!, selectedBlock!.id)}
                    >
                        Delete Block
                    </Button>
                </div>
            </>
        )}

      </div>
    </Panel>
  );
}
