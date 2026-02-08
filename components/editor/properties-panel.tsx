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
import { useState, useCallback } from "react";
import { uploadFile } from "@/src/lib/upload";
import { GRADIENT_PRESETS, PATTERN_TYPES, getPatternCss } from "@/lib/background-presets";

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
    updateMetadata,
    selectItem,
    updateRouting,
    removeRouting
  } = useEditor();
  
  const [copied, setCopied] = useState(false);
  const [newMoodboardImageUrl, setNewMoodboardImageUrl] = useState("");
  const [newThisNotThisImageUrl, setNewThisNotThisImageUrl] = useState("");
  const [uploading, setUploading] = useState<string | null>(null); // tracks which upload is in progress

  // Find selection
  let selectedSection: IntakeSection | undefined;
  let selectedBlock: IntakeBlock | undefined;
  let selectedEdge: import("@/types/editor").IntakeEdge | undefined;
  let parentSectionId: string | undefined;

  // Check selection type
  if (selectedId?.startsWith("edge:")) {
      // Format: edge:sourceId:targetId or edge:edgeId (virtual ID from canvas)
      // Since we don't have edges in state yet, we construct a virtual edge object from the ID parts
      // This assumes the ID format is consistent with what Canvas generates: edge:sourceId:targetId or edge:sectionId:ruleId
      const parts = selectedId.split(':');
      if (parts.length >= 3) {
          // It's a rule-based edge: edge:sectionId:ruleId
          // Or a sequential edge: edge:sourceId:targetId (if we add selection to sequential lines)
          
          // Let's assume for now we only edit routing rules via edge selection
          const sourceId = parts[1];
          const ruleId = parts[2]; // This might be targetId for sequential, or ruleId for routing
          
          const sourceSection = sections.find(s => s.id === sourceId);
          if (sourceSection) {
              const rule = sourceSection.routing?.find(r => r.id === ruleId);
              if (rule) {
                  selectedEdge = {
                      id: rule.id,
                      source: sourceId,
                      target: rule.nextSectionId,
                      condition: {
                          fromBlockId: rule.fromBlockId,
                          operator: rule.operator,
                          value: rule.value
                      }
                  };
                  parentSectionId = sourceId;
              }
          }
      }
  }

  // Check if section
  selectedSection = sections.find(s => s.id === selectedId);
  
  // If not, check if block
  if (!selectedSection && !selectedId?.startsWith("edge:")) {
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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading("background");
            try {
                const result = await uploadFile(e.target.files[0], "backgrounds");
                updateMetadata({
                    theme: {
                        ...metadata.theme,
                        background: {
                            ...metadata.theme?.background,
                            type: "image",
                            imageUrl: result.url,
                        }
                    }
                });
            } catch (err) {
                console.error("Background upload failed:", err);
            } finally {
                setUploading(null);
            }
        }
    };

    const handleSectionFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedSection && e.target.files && e.target.files[0]) {
            setUploading("section-bg");
            try {
                const result = await uploadFile(e.target.files[0], "backgrounds");
                updateSection(selectedSection.id, {
                    style: {
                        ...selectedSection.style,
                        background: {
                            ...selectedSection.style?.background,
                            type: "image",
                            imageUrl: result.url,
                        }
                    }
                });
            } catch (err) {
                console.error("Section background upload failed:", err);
            } finally {
                setUploading(null);
            }
        }
    };

    const handleOptionImage = async (e: React.ChangeEvent<HTMLInputElement>, optionId: string) => {
        if (selectedBlock?.type === "image_choice" && parentSectionId && e.target.files && e.target.files[0]) {
            setUploading(`option-${optionId}`);
            try {
                const result = await uploadFile(e.target.files[0], "blocks");
                const currentOptions = [...selectedBlock.options];
                const newOptions = currentOptions.map(opt => 
                    opt.id === optionId ? { ...opt, imageUrl: result.url } : opt
                );
                updateBlock(parentSectionId, selectedBlock.id, { options: newOptions });
            } catch (err) {
                console.error("Option image upload failed:", err);
            } finally {
                setUploading(null);
            }
        }
    };

    const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading("video-bg");
            try {
                const result = await uploadFile(e.target.files[0], "backgrounds");
                updateMetadata({
                    theme: {
                        ...metadata.theme,
                        background: {
                            ...metadata.theme?.background,
                            type: "video",
                            videoUrl: result.url,
                            // Ensure image properties don't conflict visually if switching types rapidly
                            imageUrl: undefined,
                        }
                    }
                });
            } catch (err) {
                console.error("Video upload failed:", err);
            } finally {
                setUploading(null);
            }
        }
    };

    const handleSectionVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedSection && e.target.files && e.target.files[0]) {
            setUploading("section-video");
            try {
                const result = await uploadFile(e.target.files[0], "backgrounds");
                updateSection(selectedSection.id, {
                    style: {
                        ...selectedSection.style,
                        background: {
                            ...selectedSection.style?.background,
                            type: "video",
                            videoUrl: result.url,
                        }
                    }
                });
            } catch (err) {
                console.error("Section video upload failed:", err);
            } finally {
                setUploading(null);
            }
        }
    };
    // GLOBAL METADATA EDITING (No Selection)
  if (!selectedId || (!selectedSection && !selectedBlock && !selectedEdge)) {
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

                <Field label="Card Style">
                    <div className="flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60">
                        {([
                            { key: "light" as const, label: "Light" },
                            { key: "dark" as const, label: "Dark" },
                        ]).map((opt) => (
                            <button
                                key={opt.key}
                                onClick={() => updateMetadata({
                                    theme: {
                                        ...metadata.theme,
                                        cardStyle: opt.key,
                                        // Clear deprecated fields
                                        cardBackgroundColor: undefined,
                                        fontColor: undefined,
                                    }
                                })}
                                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                    (metadata.theme?.cardStyle || "light") === opt.key
                                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">Controls card background and text colour.</p>
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
                            { label: "Gradient", value: "gradient" },
                            { label: "Pattern", value: "pattern" },
                            { label: "Animated Gradient", value: "animated_gradient" },
                            { label: "Image", value: "image" },
                            { label: "Video", value: "video" },
                        ]}
                    />
                </Field>

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
                            <Input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading === "background"} />
                            {uploading === "background" && <p className="text-xs text-zinc-400 animate-pulse">Uploading...</p>}
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

                {metadata.theme?.background?.type === "video" && (
                    <div className="space-y-4">
                        <Field label="Upload Video">
                            <Input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoChange} disabled={uploading === "video-bg"} />
                            {uploading === "video-bg" && <p className="text-xs text-zinc-400 animate-pulse">Uploading video...</p>}
                            <p className="text-[11px] text-zinc-400 mt-1">MP4, WebM, or MOV. Max 50MB.</p>
                        </Field>

                        <Field label="Or paste a URL">
                            <Input
                                value={metadata.theme?.background?.videoUrl || ""}
                                onChange={(e) => updateMetadata({
                                    theme: {
                                        ...metadata.theme,
                                        background: { ...metadata.theme?.background, type: "video", videoUrl: e.target.value }
                                    }
                                })}
                                placeholder="https://example.com/video.mp4"
                            />
                        </Field>

                        {metadata.theme.background.videoUrl && (
                            <div className="relative w-full h-32 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                <video
                                    src={metadata.theme.background.videoUrl}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                <div 
                                    className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300"
                                    style={{
                                        backgroundColor: metadata.theme.background.overlayColor || "#000000",
                                        opacity: metadata.theme.background.overlayOpacity ?? 0.55
                                    }}
                                />
                                <button
                                    onClick={() => updateMetadata({
                                        theme: {
                                            ...metadata.theme,
                                            background: { ...metadata.theme?.background, type: "video", videoUrl: undefined }
                                        }
                                    })}
                                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white hover:bg-red-500 flex items-center justify-center text-xs backdrop-blur-sm transition-colors"
                                    title="Remove video"
                                >
                                    ✕
                                </button>
                            </div>
                        )}

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

                        <Field label="Enable Audio">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={metadata.theme?.background?.audioEnabled ?? false}
                                    onClick={() => updateMetadata({
                                        theme: {
                                            ...metadata.theme,
                                            background: {
                                                ...metadata.theme?.background,
                                                type: "video",
                                                audioEnabled: !(metadata.theme?.background?.audioEnabled ?? false),
                                            },
                                        },
                                    })}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        metadata.theme?.background?.audioEnabled
                                            ? "bg-blue-600"
                                            : "bg-zinc-300 dark:bg-zinc-600"
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                            metadata.theme?.background?.audioEnabled ? "translate-x-4" : "translate-x-0"
                                        }`}
                                    />
                                </button>
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                    {metadata.theme?.background?.audioEnabled ? "On" : "Off"}
                                </span>
                            </label>
                            <p className="text-[11px] text-zinc-400 mt-1">Users will see an unmute button to enable sound.</p>
                        </Field>
                    </div>
                )}

                {metadata.theme?.background?.type === "gradient" && (
                    <div className="space-y-3">
                        <Field label="Gradient Preset">
                            <div className="grid grid-cols-5 gap-1.5">
                                {Object.entries(GRADIENT_PRESETS).map(([key, preset]) => (
                                    <button
                                        key={key}
                                        onClick={() => updateMetadata({
                                            theme: {
                                                ...metadata.theme,
                                                background: { ...metadata.theme?.background, type: "gradient", gradientPreset: key }
                                            }
                                        })}
                                        className={`h-10 rounded-lg transition-all ${
                                            metadata.theme?.background?.gradientPreset === key
                                                ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-zinc-900 scale-105"
                                                : "hover:scale-105"
                                        }`}
                                        style={{ background: preset.css }}
                                        title={preset.label}
                                    />
                                ))}
                            </div>
                        </Field>
                        {metadata.theme?.background?.gradientPreset && (
                            <div
                                className="w-full h-20 rounded-lg border border-zinc-200 dark:border-zinc-700"
                                style={{ background: GRADIENT_PRESETS[metadata.theme.background.gradientPreset]?.css }}
                            />
                        )}
                    </div>
                )}

                {metadata.theme?.background?.type === "pattern" && (
                    <div className="space-y-3">
                        <Field label="Pattern Style">
                            <div className="grid grid-cols-5 gap-1.5">
                                {PATTERN_TYPES.map((pt) => {
                                    const preview = getPatternCss(pt.id, "#00000025", "#ffffff");
                                    return (
                                        <button
                                            key={pt.id}
                                            onClick={() => updateMetadata({
                                                theme: {
                                                    ...metadata.theme,
                                                    background: { ...metadata.theme?.background, type: "pattern", patternType: pt.id }
                                                }
                                            })}
                                            className={`h-10 rounded-lg border transition-all ${
                                                metadata.theme?.background?.patternType === pt.id
                                                    ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-zinc-900 border-blue-300"
                                                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                                            }`}
                                            style={{ backgroundColor: preview.backgroundColor, backgroundImage: preview.backgroundImage, backgroundSize: preview.backgroundSize }}
                                            title={pt.label}
                                        />
                                    );
                                })}
                            </div>
                        </Field>
                        <Field label="Pattern Color">
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={metadata.theme?.background?.patternColor || "#00000015"}
                                    onChange={(e) => updateMetadata({
                                        theme: {
                                            ...metadata.theme,
                                            background: { ...metadata.theme?.background, type: "pattern", patternColor: e.target.value }
                                        }
                                    })}
                                    className="h-9 w-9 p-0.5 rounded-lg border border-zinc-200 cursor-pointer bg-white"
                                />
                                <Input
                                    value={metadata.theme?.background?.patternColor || ""}
                                    onChange={(e) => updateMetadata({
                                        theme: {
                                            ...metadata.theme,
                                            background: { ...metadata.theme?.background, type: "pattern", patternColor: e.target.value }
                                        }
                                    })}
                                    placeholder="#00000015"
                                    className="flex-1"
                                />
                            </div>
                        </Field>
                        <Field label="Background Color">
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={metadata.theme?.background?.patternBgColor || "#ffffff"}
                                    onChange={(e) => updateMetadata({
                                        theme: {
                                            ...metadata.theme,
                                            background: { ...metadata.theme?.background, type: "pattern", patternBgColor: e.target.value }
                                        }
                                    })}
                                    className="h-9 w-9 p-0.5 rounded-lg border border-zinc-200 cursor-pointer bg-white"
                                />
                                <Input
                                    value={metadata.theme?.background?.patternBgColor || ""}
                                    onChange={(e) => updateMetadata({
                                        theme: {
                                            ...metadata.theme,
                                            background: { ...metadata.theme?.background, type: "pattern", patternBgColor: e.target.value }
                                        }
                                    })}
                                    placeholder="#ffffff"
                                    className="flex-1"
                                />
                            </div>
                        </Field>
                        {metadata.theme?.background?.patternType && (
                            <div
                                className="w-full h-20 rounded-lg border border-zinc-200 dark:border-zinc-700"
                                style={getPatternCss(
                                    metadata.theme.background.patternType,
                                    metadata.theme.background.patternColor || "#00000015",
                                    metadata.theme.background.patternBgColor || "#ffffff"
                                )}
                            />
                        )}
                    </div>
                )}

                {metadata.theme?.background?.type === "animated_gradient" && (
                    <div className="space-y-3">
                        <Field label="Gradient Colors (2-4)">
                            <div className="flex gap-2 flex-wrap">
                                {(metadata.theme?.background?.animatedGradientColors || ["#667eea", "#764ba2"]).map((c, i) => (
                                    <input
                                        key={i}
                                        type="color"
                                        value={c}
                                        onChange={(e) => {
                                            const colors = [...(metadata.theme?.background?.animatedGradientColors || ["#667eea", "#764ba2"])];
                                            colors[i] = e.target.value;
                                            updateMetadata({
                                                theme: {
                                                    ...metadata.theme,
                                                    background: { ...metadata.theme?.background, type: "animated_gradient", animatedGradientColors: colors }
                                                }
                                            });
                                        }}
                                        className="h-9 w-9 p-0.5 rounded-lg border border-zinc-200 cursor-pointer bg-white"
                                    />
                                ))}
                                {(metadata.theme?.background?.animatedGradientColors || ["#667eea", "#764ba2"]).length < 4 && (
                                    <button
                                        onClick={() => {
                                            const colors = [...(metadata.theme?.background?.animatedGradientColors || ["#667eea", "#764ba2"]), "#43e97b"];
                                            updateMetadata({
                                                theme: {
                                                    ...metadata.theme,
                                                    background: { ...metadata.theme?.background, type: "animated_gradient", animatedGradientColors: colors }
                                                }
                                            });
                                        }}
                                        className="h-9 w-9 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:text-zinc-600 transition-colors flex items-center justify-center text-lg"
                                        title="Add color"
                                    >+</button>
                                )}
                                {(metadata.theme?.background?.animatedGradientColors || ["#667eea", "#764ba2"]).length > 2 && (
                                    <button
                                        onClick={() => {
                                            const colors = [...(metadata.theme?.background?.animatedGradientColors || ["#667eea", "#764ba2"])];
                                            colors.pop();
                                            updateMetadata({
                                                theme: {
                                                    ...metadata.theme,
                                                    background: { ...metadata.theme?.background, type: "animated_gradient", animatedGradientColors: colors }
                                                }
                                            });
                                        }}
                                        className="h-9 w-9 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 hover:border-red-400 hover:text-red-500 transition-colors flex items-center justify-center text-lg"
                                        title="Remove last color"
                                    >-</button>
                                )}
                            </div>
                        </Field>
                        <Field label={`Speed (${metadata.theme?.background?.animatedGradientSpeed || 8}s per cycle)`}>
                            <input
                                type="range"
                                min="4" max="20" step="1"
                                value={metadata.theme?.background?.animatedGradientSpeed ?? 8}
                                onChange={(e) => updateMetadata({
                                    theme: {
                                        ...metadata.theme,
                                        background: { ...metadata.theme?.background, type: "animated_gradient", animatedGradientSpeed: parseInt(e.target.value) }
                                    }
                                })}
                                className="w-full accent-blue-600"
                            />
                        </Field>
                        <div
                            className="w-full h-20 rounded-lg border border-zinc-200 dark:border-zinc-700 animate-gradient-shift"
                            style={{
                                backgroundImage: `linear-gradient(135deg, ${(metadata.theme?.background?.animatedGradientColors || ["#667eea", "#764ba2"]).join(", ")})`,
                                backgroundSize: "200% 200%",
                                animationDuration: `${metadata.theme?.background?.animatedGradientSpeed || 8}s`,
                            }}
                        />
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
            {selectedSection ? "Section Properties" : selectedBlock ? "Block Properties" : "Connection"}
        </h2>
        <span className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
            {selectedSection ? "Section" : selectedBlock ? selectedBlock.type : "Edge"}
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
                        // Find eligible trigger questions (Select type or Image Choice)
                        const eligibleQuestions = selectedSection.blocks.filter(
                            b => (b.type === "question" && b.inputType === "select") || b.type === "image_choice"
                        ) as (QuestionBlock | import("@/types/editor").ImageChoiceBlock)[];

                        const rules = selectedSection.routing || [];
                        const otherSections = sections.filter(s => s.id !== selectedSection!.id);

                        return (
                            <div className="space-y-3">
                                {rules.map((rule, idx) => {
                                    const isFallback = rule.operator === "any";
                                    const triggerBlock = eligibleQuestions.find(b => b.id === rule.fromBlockId);
                                    
                                    // Normalize options based on block type
                                    let options: { label: string; value: string }[] = [];
                                    if (triggerBlock?.type === "image_choice") {
                                        options = (triggerBlock as any).options.map((o: any) => ({ 
                                            label: o.label || "Untitled Option", 
                                            value: o.id 
                                        }));
                                    } else if (triggerBlock?.type === "question") {
                                        options = ((triggerBlock as any).options || []).map((o: string) => ({ 
                                            label: o, 
                                            value: o 
                                        }));
                                    }

                                    return (
                                        <div key={rule.id} className={`p-3 border rounded-lg space-y-3 relative group ${isFallback ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700'}`}>
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
                                                <label className="text-[10px] font-medium text-zinc-500 uppercase">Rule Type:</label>
                                                <Select
                                                    value={isFallback ? "any" : "equals"}
                                                    onChange={(val) => {
                                                        const newRules = [...rules];
                                                        if (val === "any") {
                                                            // Check uniqueness for fallback
                                                            if (rules.some(r => r.operator === "any" && r.id !== rule.id)) {
                                                                alert("Only one fallback route is allowed.");
                                                                return;
                                                            }
                                                            newRules[idx] = { ...rule, operator: "any", fromBlockId: undefined, value: undefined };
                                                        } else {
                                                            // Switching to equals
                                                            if (eligibleQuestions.length === 0) return;
                                                            newRules[idx] = { 
                                                                ...rule, 
                                                                operator: "equals", 
                                                                fromBlockId: eligibleQuestions[0].id, 
                                                                value: "" 
                                                            };
                                                        }
                                                        updateSection(selectedSection!.id, { routing: newRules });
                                                    }}
                                                    options={[
                                                        ...(eligibleQuestions.length > 0 ? [{ label: "Match Answer", value: "equals" }] : []),
                                                        { label: "Fallback / Any", value: "any" }
                                                    ]}
                                                />
                                            </div>

                                            {isFallback ? (
                                                <div className="text-xs text-blue-600 dark:text-blue-400 py-1">
                                                    Routes here if no other conditions match.
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-medium text-zinc-500 uppercase">If Answer To:</label>
                                                        <Select
                                                            value={rule.fromBlockId || ""}
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
                                                                value={rule.value || ""}
                                                                onChange={(val) => {
                                                                    const newRules = [...rules];
                                                                    newRules[idx] = { ...rule, value: val };
                                                                    updateSection(selectedSection!.id, { routing: newRules });
                                                                }}
                                                                options={options}
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            )}

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
                                        let newRule: import("@/types/editor").SectionRouteRule;
                                        const fallbackExists = rules.some(r => r.operator === "any");

                                        // Default to equals if questions exist, otherwise any
                                        // But if questions exist, we can also add any. 
                                        // Let's default to equals if possible, as it's more common for "Logic".
                                        // Unless user wants fallback.
                                        
                                        if (eligibleQuestions.length > 0) {
                                            newRule = {
                                                id: generateId(),
                                                fromBlockId: eligibleQuestions[0].id,
                                                operator: "equals",
                                                value: "",
                                                nextSectionId: otherSections[0]?.id || ""
                                            };
                                        } else {
                                            if (fallbackExists) {
                                                alert("This section already has a fallback route. No other rules can be added without questions.");
                                                return;
                                            }
                                            newRule = {
                                                id: generateId(),
                                                operator: "any",
                                                nextSectionId: otherSections[0]?.id || ""
                                            };
                                        }
                                        
                                        updateSection(selectedSection!.id, { routing: [...rules, newRule] });
                                    }}
                                    disabled={otherSections.length === 0}
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
                                { label: "Gradient", value: "gradient" },
                                { label: "Pattern", value: "pattern" },
                                { label: "Animated Gradient", value: "animated_gradient" },
                                { label: "Image", value: "image" },
                                { label: "Video", value: "video" },
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
                                <Input type="file" accept="image/*" onChange={handleSectionFileChange} disabled={uploading === "section-bg"} />
                                {uploading === "section-bg" && <p className="text-xs text-zinc-400 animate-pulse">Uploading...</p>}
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

                    {selectedSection.style?.background?.type === "video" && (
                        <div className="space-y-4">
                            <Field label="Video Upload">
                                <Input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleSectionVideoChange} disabled={uploading === "section-video"} />
                                {uploading === "section-video" && <p className="text-xs text-zinc-400 animate-pulse">Uploading video...</p>}
                                <p className="text-[11px] text-zinc-400 mt-1">MP4, WebM, or MOV. Max 50MB.</p>
                            </Field>
                            {selectedSection.style.background.videoUrl && (
                                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                    <video
                                        src={selectedSection.style.background.videoUrl}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    <div 
                                        className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300"
                                        style={{
                                            opacity: selectedSection.style.background.overlayOpacity ?? 0.55
                                        }}
                                    />
                                    <button
                                        onClick={() => updateSection(selectedSection!.id, {
                                            style: {
                                                ...selectedSection!.style,
                                                background: { ...selectedSection!.style?.background, type: "video", videoUrl: undefined }
                                            }
                                        })}
                                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white hover:bg-red-500 flex items-center justify-center text-xs backdrop-blur-sm transition-colors"
                                        title="Remove video"
                                    >
                                        ✕
                                    </button>
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
                                            background: { ...selectedSection!.style?.background, type: "video", overlayOpacity: parseFloat(e.target.value) } 
                                        } 
                                    })}
                                    className="w-full accent-blue-600"
                                />
                            </Field>
                        </div>
                    )}

                    {selectedSection.style?.background?.type === "gradient" && (
                        <div className="space-y-3">
                            <Field label="Gradient Preset">
                                <div className="grid grid-cols-5 gap-1.5">
                                    {Object.entries(GRADIENT_PRESETS).map(([key, preset]) => (
                                        <button
                                            key={key}
                                            onClick={() => updateSection(selectedSection!.id, {
                                                style: {
                                                    ...selectedSection!.style,
                                                    background: { ...selectedSection!.style?.background, type: "gradient", gradientPreset: key }
                                                }
                                            })}
                                            className={`h-10 rounded-lg transition-all ${
                                                selectedSection.style?.background?.gradientPreset === key
                                                    ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-zinc-900 scale-105"
                                                    : "hover:scale-105"
                                            }`}
                                            style={{ background: preset.css }}
                                            title={preset.label}
                                        />
                                    ))}
                                </div>
                            </Field>
                        </div>
                    )}

                    {selectedSection.style?.background?.type === "pattern" && (
                        <div className="space-y-3">
                            <Field label="Pattern Style">
                                <div className="grid grid-cols-5 gap-1.5">
                                    {PATTERN_TYPES.map((pt) => {
                                        const preview = getPatternCss(pt.id, "#00000025", "#ffffff");
                                        return (
                                            <button
                                                key={pt.id}
                                                onClick={() => updateSection(selectedSection!.id, {
                                                    style: {
                                                        ...selectedSection!.style,
                                                        background: { ...selectedSection!.style?.background, type: "pattern", patternType: pt.id }
                                                    }
                                                })}
                                                className={`h-10 rounded-lg border transition-all ${
                                                    selectedSection.style?.background?.patternType === pt.id
                                                        ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-zinc-900 border-blue-300"
                                                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                                                }`}
                                                style={{ backgroundColor: preview.backgroundColor, backgroundImage: preview.backgroundImage, backgroundSize: preview.backgroundSize }}
                                                title={pt.label}
                                            />
                                        );
                                    })}
                                </div>
                            </Field>
                            <Field label="Pattern Color">
                                <input
                                    type="color"
                                    value={selectedSection.style?.background?.patternColor || "#00000015"}
                                    onChange={(e) => updateSection(selectedSection!.id, {
                                        style: {
                                            ...selectedSection!.style,
                                            background: { ...selectedSection!.style?.background, type: "pattern", patternColor: e.target.value }
                                        }
                                    })}
                                    className="h-9 w-9 p-0.5 rounded-lg border border-zinc-200 cursor-pointer bg-white"
                                />
                            </Field>
                            <Field label="Background Color">
                                <input
                                    type="color"
                                    value={selectedSection.style?.background?.patternBgColor || "#ffffff"}
                                    onChange={(e) => updateSection(selectedSection!.id, {
                                        style: {
                                            ...selectedSection!.style,
                                            background: { ...selectedSection!.style?.background, type: "pattern", patternBgColor: e.target.value }
                                        }
                                    })}
                                    className="h-9 w-9 p-0.5 rounded-lg border border-zinc-200 cursor-pointer bg-white"
                                />
                            </Field>
                        </div>
                    )}

                    {selectedSection.style?.background?.type === "animated_gradient" && (
                        <div className="space-y-3">
                            <Field label="Gradient Colors (2-4)">
                                <div className="flex gap-2 flex-wrap">
                                    {(selectedSection.style?.background?.animatedGradientColors || ["#667eea", "#764ba2"]).map((c, i) => (
                                        <input
                                            key={i}
                                            type="color"
                                            value={c}
                                            onChange={(e) => {
                                                const colors = [...(selectedSection.style?.background?.animatedGradientColors || ["#667eea", "#764ba2"])];
                                                colors[i] = e.target.value;
                                                updateSection(selectedSection!.id, {
                                                    style: {
                                                        ...selectedSection!.style,
                                                        background: { ...selectedSection!.style?.background, type: "animated_gradient", animatedGradientColors: colors }
                                                    }
                                                });
                                            }}
                                            className="h-9 w-9 p-0.5 rounded-lg border border-zinc-200 cursor-pointer bg-white"
                                        />
                                    ))}
                                    {(selectedSection.style?.background?.animatedGradientColors || ["#667eea", "#764ba2"]).length < 4 && (
                                        <button
                                            onClick={() => {
                                                const colors = [...(selectedSection.style?.background?.animatedGradientColors || ["#667eea", "#764ba2"]), "#43e97b"];
                                                updateSection(selectedSection!.id, {
                                                    style: {
                                                        ...selectedSection!.style,
                                                        background: { ...selectedSection!.style?.background, type: "animated_gradient", animatedGradientColors: colors }
                                                    }
                                                });
                                            }}
                                            className="h-9 w-9 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:text-zinc-600 transition-colors flex items-center justify-center text-lg"
                                            title="Add color"
                                        >+</button>
                                    )}
                                </div>
                            </Field>
                            <Field label={`Speed (${selectedSection.style?.background?.animatedGradientSpeed || 8}s)`}>
                                <input
                                    type="range"
                                    min="4" max="20" step="1"
                                    value={selectedSection.style?.background?.animatedGradientSpeed ?? 8}
                                    onChange={(e) => updateSection(selectedSection!.id, {
                                        style: {
                                            ...selectedSection!.style,
                                            background: { ...selectedSection!.style?.background, type: "animated_gradient", animatedGradientSpeed: parseInt(e.target.value) }
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

        {/* --- EDGE EDITING --- */}
        {selectedEdge && parentSectionId && (
            <>
                <div className="space-y-4">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <div className="flex flex-col gap-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-zinc-500">From:</span>
                                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
                                    {sections.find(s => s.id === selectedEdge!.source)?.title || "Unknown"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">To:</span>
                                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
                                    {sections.find(s => s.id === selectedEdge!.target)?.title || "Unknown"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider pt-2">Condition</h3>
                    
                    {(() => {
                        const sourceSection = sections.find(s => s.id === parentSectionId);
                        // Find eligible trigger questions (Select type or Image Choice)
                        const eligibleQuestions = sourceSection?.blocks.filter(
                            b => (b.type === "question" && b.inputType === "select") || b.type === "image_choice"
                        ) as (QuestionBlock | import("@/types/editor").ImageChoiceBlock)[];

                        // For fallback, we don't strictly need questions, but we check if we want to allow switching types
                        // Currently logic assumes we need questions for "equals"
                        
                        const selectedQuestionId = selectedEdge.condition?.fromBlockId;
                        const triggerBlock = eligibleQuestions.find(b => b.id === selectedQuestionId);
                        
                        // Normalize options
                        let options: { label: string; value: string }[] = [];
                        if (triggerBlock?.type === "image_choice") {
                            options = (triggerBlock as any).options.map((o: any) => ({ 
                                label: o.label || "Untitled Option", 
                                value: o.id 
                            }));
                        } else if (triggerBlock?.type === "question") {
                            options = ((triggerBlock as any).options || []).map((o: string) => ({ 
                                label: o, 
                                value: o 
                            }));
                        }

                        const isFallback = selectedEdge.condition?.operator === "any";

                        return (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-zinc-500 uppercase">Condition Type:</label>
                                    <Select
                                        value={isFallback ? "any" : "equals"}
                                        onChange={(val) => {
                                            if (!updateRouting) return;
                                            
                                            if (val === "any") {
                                                // Check if another fallback already exists
                                                const existingFallback = sourceSection?.routing?.find(r => r.operator === "any" && r.id !== selectedEdge!.id);
                                                if (existingFallback) {
                                                    alert("This section already has a fallback route. Only one is allowed.");
                                                    return;
                                                }

                                                updateRouting(parentSectionId!, selectedEdge!.id, { 
                                                    operator: "any",
                                                    fromBlockId: undefined, // Clear block reference
                                                    value: undefined        // Clear value reference
                                                });
                                            } else {
                                                // Switching to equals - try to auto-select first eligible question
                                                updateRouting(parentSectionId!, selectedEdge!.id, { 
                                                    operator: "equals",
                                                    fromBlockId: eligibleQuestions[0]?.id || "",
                                                    value: ""
                                                });
                                            }
                                        }}
                                        options={[
                                            { label: "Match Answer", value: "equals" },
                                            { label: "Any (Fallback)", value: "any" }
                                        ]}
                                    />
                                </div>

                                {isFallback ? (
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-lg border border-blue-100 dark:border-blue-800">
                                        This path will be taken if no other conditions match.
                                    </div>
                                ) : (
                                    <>
                                        {!eligibleQuestions || eligibleQuestions.length === 0 ? (
                                            <p className="text-xs text-zinc-400 italic">
                                                No compatible questions found in source section to create a condition.
                                            </p>
                                        ) : (
                                            <>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-medium text-zinc-500 uppercase">If Answer To:</label>
                                                    <Select
                                                        value={selectedQuestionId || ""}
                                                        onChange={(val) => {
                                                            if (updateRouting) {
                                                                updateRouting(parentSectionId!, selectedEdge!.id, { 
                                                                    fromBlockId: val,
                                                                    // Reset value when changing question
                                                                    value: "" 
                                                                });
                                                            }
                                                        }}
                                                        options={[
                                                            { label: "Select a question...", value: "" },
                                                            ...eligibleQuestions.map(q => ({ label: q.label || "Untitled Question", value: q.id }))
                                                        ]}
                                                    />
                                                </div>

                                                {selectedQuestionId && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-zinc-400">Is</span>
                                                        <div className="flex-1">
                                                            <Select
                                                                value={selectedEdge.condition?.value || ""}
                                                                onChange={(val) => {
                                                                    if (updateRouting) {
                                                                        updateRouting(parentSectionId!, selectedEdge!.id, { value: val });
                                                                    }
                                                                }}
                                                                options={[
                                                                    { label: "Select an option...", value: "" },
                                                                    ...options
                                                                ]}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}

                                <div className="pt-2">
                                    <Button
                                        variant="ghost"
                                        size="sm" 
                                        className="w-full text-zinc-400 hover:text-red-500"
                                        onClick={() => {
                                            if (removeRouting) {
                                                removeRouting(parentSectionId!, selectedEdge!.id);
                                                selectItem(null);
                                            }
                                        }}
                                    >
                                        Delete Connection
                                    </Button>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </>
        )}
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

                {/* Heading Block */}
                {selectedBlock.type === "heading" && (
                    <>
                        <Field label="Heading Text">
                            <Input
                                value={selectedBlock.text}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { text: e.target.value })}
                                placeholder="Enter heading text"
                            />
                        </Field>
                        <Field label="Level">
                            <div className="flex gap-1">
                                {(["h1", "h2", "h3"] as const).map((lvl) => (
                                    <button
                                        key={lvl}
                                        onClick={() => updateBlock(parentSectionId!, selectedBlock!.id, { level: lvl })}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                            selectedBlock.level === lvl
                                                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                                        }`}
                                    >
                                        {lvl.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </Field>
                    </>
                )}

                {/* Divider Block */}
                {selectedBlock.type === "divider" && (
                    <Field label="Style">
                        <div className="flex gap-1">
                            {(["solid", "dashed", "dotted"] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => updateBlock(parentSectionId!, selectedBlock!.id, { style: s })}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                                        selectedBlock.style === s
                                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </Field>
                )}

                {/* Image Display Block */}
                {selectedBlock.type === "image_display" && (
                    <>
                        <Field label="Upload Image">
                            <Input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (!file) return;
                                    try {
                                        const result = await uploadFile(file, "images");
                                        updateBlock(parentSectionId!, selectedBlock!.id, { imageUrl: result.url });
                                    } catch (err) {
                                        console.error("Image upload failed:", err);
                                    }
                                }}
                            />
                        </Field>
                        <Field label="Or paste URL">
                            <Input
                                value={selectedBlock.imageUrl || ""}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { imageUrl: e.target.value })}
                                placeholder="https://example.com/image.jpg"
                            />
                        </Field>
                        <Field label="Alt Text">
                            <Input
                                value={selectedBlock.alt || ""}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { alt: e.target.value })}
                                placeholder="Describe the image"
                            />
                        </Field>
                        <Field label="Caption">
                            <Input
                                value={selectedBlock.caption || ""}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { caption: e.target.value })}
                                placeholder="Optional caption"
                            />
                        </Field>
                    </>
                )}

                {/* Video Embed Block */}
                {selectedBlock.type === "video_embed" && (
                    <>
                        <Field label="Upload Video">
                            <Input
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime"
                                onChange={async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (!file) return;
                                    try {
                                        const result = await uploadFile(file, "videos");
                                        updateBlock(parentSectionId!, selectedBlock!.id, { videoUrl: result.url });
                                    } catch (err) {
                                        console.error("Video upload failed:", err);
                                    }
                                }}
                            />
                            <p className="text-[11px] text-zinc-400 mt-1">MP4, WebM, or MOV. Max 50MB.</p>
                        </Field>
                        <Field label="Or paste URL">
                            <Input
                                value={selectedBlock.videoUrl || ""}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { videoUrl: e.target.value })}
                                placeholder="https://example.com/video.mp4"
                            />
                        </Field>
                        <Field label="Caption">
                            <Input
                                value={selectedBlock.caption || ""}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { caption: e.target.value })}
                                placeholder="Optional caption"
                            />
                        </Field>
                    </>
                )}

                {/* Quote Block */}
                {selectedBlock.type === "quote" && (
                    <>
                        <Field label="Quote Text">
                            <Textarea
                                value={selectedBlock.text}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { text: e.target.value })}
                                rows={4}
                                placeholder="Enter the quote..."
                            />
                        </Field>
                        <Field label="Attribution">
                            <Input
                                value={selectedBlock.attribution || ""}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { attribution: e.target.value })}
                                placeholder="e.g. John Doe, CEO"
                            />
                        </Field>
                    </>
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
                                            <label className={`relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:opacity-80 transition-opacity shrink-0 ${uploading === "option-" + opt.id ? "opacity-50 pointer-events-none" : ""}`}>
                                                {uploading === `option-${opt.id}` ? (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <svg className="animate-spin w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle className="opacity-25" cx="12" cy="12" r="10"/><path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                                    </div>
                                                ) : opt.imageUrl ? (
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

                {/* Link Preview Block */}
                {selectedBlock.type === "link_preview" && (
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
                        <Field label="Max Links (Optional)">
                            <Input
                                type="number"
                                value={selectedBlock.maxItems?.toString() || ""}
                                onChange={(e) => {
                                    const val = e.target.value ? parseInt(e.target.value) : undefined;
                                    updateBlock(parentSectionId!, selectedBlock!.id, { maxItems: val });
                                }}
                                placeholder="Default: 3"
                            />
                        </Field>
                        <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <Checkbox
                                checked={selectedBlock.required || false}
                                onCheckedChange={(checked) => updateBlock(parentSectionId!, selectedBlock!.id, { required: checked })}
                                label="Required field"
                            />
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 text-xs rounded-lg border border-blue-100 dark:border-blue-800">
                            Clients will paste links in the published experience. Preview cards are generated automatically.
                        </div>
                    </>
                )}

                {/* Book Call Block */}
                {selectedBlock.type === "book_call" && (
                    <>
                        <Field label="Title (Optional)">
                            <Input
                                value={selectedBlock.title || ""}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { title: e.target.value })}
                                placeholder="Ready to chat?"
                            />
                        </Field>
                        <Field label="Description (Optional)">
                            <Textarea
                                value={selectedBlock.text || ""}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { text: e.target.value })}
                                rows={2}
                                placeholder="Book a quick call to discuss your project..."
                            />
                        </Field>
                        <Field label="Booking URL" hint="Required. Must be a valid https:// link.">
                            <Input
                                value={selectedBlock.bookingUrl || ""}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { bookingUrl: e.target.value })}
                                placeholder="https://calendly.com/..."
                            />
                        </Field>
                        <Field label="Button Label">
                            <Input
                                value={selectedBlock.buttonLabel || ""}
                                onChange={(e) => updateBlock(parentSectionId!, selectedBlock!.id, { buttonLabel: e.target.value })}
                                placeholder="Book a Call"
                            />
                        </Field>
                        <div className="space-y-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <Checkbox
                                checked={selectedBlock.openInNewTab ?? true}
                                onCheckedChange={(checked) => updateBlock(parentSectionId!, selectedBlock!.id, { openInNewTab: checked })}
                                label="Open in new tab"
                            />
                            <Checkbox
                                checked={selectedBlock.requiredToContinue || false}
                                onCheckedChange={(checked) => updateBlock(parentSectionId!, selectedBlock!.id, { requiredToContinue: checked })}
                                label="Must click to continue"
                            />
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
