import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IntakeSection, IntakeBlock, InputType, IntakeTheme } from "@/types/editor";
import { personalizeText, PersonalizationParams } from "@/src/lib/experience/personalize";
import { WelcomeScreen } from "./WelcomeScreen";
import { CompletionScreen } from "./CompletionScreen";
import { SectionIntro } from "./SectionIntro";
import { Moodboard } from "@/src/components/shared/Moodboard";
import { ThisNotThisBoard } from "@/src/components/shared/ThisNotThisBoard";

interface GuidedExperienceProps {
  sections: IntakeSection[];
  personalization?: PersonalizationParams;
  title?: string;
  intro?: string;
  estimatedTime?: string;
  closingMessage?: string;
  completionNextSteps?: string;
  completionButtonLabel?: string;
  completionButtonUrl?: string;
  theme?: IntakeTheme;
}

export function GuidedExperience({
  sections,
  personalization,
  title,
  intro,
  estimatedTime,
  closingMessage,
  completionNextSteps,
  completionButtonLabel,
  completionButtonUrl,
  theme,
}: GuidedExperienceProps) {
  // Steps: -1 (Welcome) -> 0..N-1 (Sections) -> N (Completion)
  const [currentStep, setCurrentStep] = useState(-1);
  const [showSectionIntro, setShowSectionIntro] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  // Track history of Section IDs for "Back" button
  const [history, setHistory] = useState<string[]>([]);

  const totalSections = sections.length;

  const currentSection =
    currentStep >= 0 && currentStep < totalSections ? sections[currentStep] : undefined;

  const bgStyle: React.CSSProperties = {};
  
  // Use section override if available, otherwise global theme
  const activeBackground =
    currentSection?.style?.background?.type &&
    currentSection.style.background.type !== "none"
      ? currentSection.style.background
      : theme?.background;

  if (activeBackground?.type === "color") {
    bgStyle.backgroundColor = activeBackground.color;
  } else if (activeBackground?.type === "image" && activeBackground.imageUrl) {
    bgStyle.backgroundImage = `url(${activeBackground.imageUrl})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
    bgStyle.backgroundAttachment = "fixed";
  }

  const containerStyle: React.CSSProperties = {};
  if (theme?.accentColor) {
    // @ts-ignore
    containerStyle["--accent-color"] = theme.accentColor;
  }

  const handleStart = () => {
    setCurrentStep(0);
    setHistory([]);
    // Show intro for first section if it has a description
    if (sections[0]?.description) {
        setShowSectionIntro(true);
    }
  };

  const handleAnswerChange = (blockId: string, value: any) => {
      setAnswers(prev => ({ ...prev, [blockId]: value }));
  };

  const handleNext = () => {
    if (!currentSection) return;

    // 1. Check Routing
    if (currentSection.routing && currentSection.routing.length > 0) {
        for (const rule of currentSection.routing) {
            const answer = answers[rule.fromBlockId];
            if (rule.operator === "equals" && answer === rule.value) {
                const nextIndex = sections.findIndex(s => s.id === rule.nextSectionId);
                const nextSectionId = rule.nextSectionId;
                
                // Prevent loops: fallback if next section is already in history
                if (nextIndex !== -1 && !history.includes(nextSectionId) && currentSection.id !== nextSectionId) {
                    setHistory(prev => [...prev, currentSection.id]);
                    setCurrentStep(nextIndex);
                    
                    if (sections[nextIndex]?.description) {
                        setShowSectionIntro(true);
                    } else {
                        setShowSectionIntro(false);
                    }
                    return;
                }
            }
        }
    }

    // 2. Default Linear Progression
    const nextStep = currentStep + 1;
    if (nextStep < totalSections) {
        // Moving to next section
        if (currentSection) {
            setHistory(prev => [...prev, currentSection.id]);
        }
        setCurrentStep(nextStep);
        if (sections[nextStep]?.description) {
            setShowSectionIntro(true);
        } else {
            setShowSectionIntro(false);
        }
    } else {
        // Moving to completion
        if (currentSection) {
            setHistory(prev => [...prev, currentSection.id]);
        }
        setCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    if (showSectionIntro) {
        // If on intro screen, go back to previous section questions (or welcome)
        // If history is empty, we are at start
        if (currentStep === 0 || history.length === 0) {
             setCurrentStep(-1);
             return;
        }
        
        // Pop last history ID
        const prevSectionId = history[history.length - 1];
        const prevIndex = sections.findIndex(s => s.id === prevSectionId);
        
        if (prevIndex !== -1) {
            setHistory(prev => prev.slice(0, -1)); // Pop
            setCurrentStep(prevIndex);
            setShowSectionIntro(false); // Don't show intro when going back
        } else {
            // Fallback to linear prev if ID not found (unlikely)
            setCurrentStep(Math.max(-1, currentStep - 1));
        }
    } else {
        if (sections[currentStep]?.description) {
            setShowSectionIntro(true);
        } else {
            // Go to previous section from history
            if (currentStep === 0 || history.length === 0) {
                setCurrentStep(-1);
                return;
            }

            const prevSectionId = history[history.length - 1];
            const prevIndex = sections.findIndex(s => s.id === prevSectionId);

            if (prevIndex !== -1) {
                setHistory(prev => prev.slice(0, -1)); // Pop
                setCurrentStep(prevIndex);
                setShowSectionIntro(false);
            } else {
                setCurrentStep(Math.max(-1, currentStep - 1));
            }
        }
    }
  };

  const commonProps = {
      theme,
      // If we are in a theme mode, wrap content in a card style visually
      cardStyle: activeBackground?.type !== "none" ? "bg-white/90 dark:bg-black/80 backdrop-blur-md shadow-lg rounded-2xl p-8 max-w-2xl mx-auto" : ""
  };

  return (
    <div 
        className="min-h-screen transition-colors duration-300 relative flex flex-col items-center justify-center py-12 overflow-y-auto" 
        style={{ ...bgStyle, ...containerStyle }}
    >
        {activeBackground?.type === "video" && activeBackground.videoUrl && activeBackground.videoUrl.endsWith(".mp4") && (
            <video
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-cover z-0"
            >
                <source src={activeBackground.videoUrl} type="video/mp4" />
            </video>
        )}

        {activeBackground?.type === "image" && (
            <div 
                className="absolute inset-0 pointer-events-none transition-opacity duration-300" 
                style={{ 
                    backgroundImage: `url(${activeBackground.imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backdropFilter: activeBackground.blurPx ? `blur(${activeBackground.blurPx}px)` : undefined 
                }} 
            />
        )}
        
        {(activeBackground?.type === "image" || activeBackground?.type === "video") && (
            <div 
                className="absolute inset-0 pointer-events-none transition-opacity duration-300" 
                style={{ 
                    backgroundColor: activeBackground.overlayColor || "#000000",
                    opacity: activeBackground.overlayOpacity ?? 0.55, 
                }} 
            />
        )}

        <div className="relative z-10 w-full px-6">
            {/* Render Phases */}
            {currentStep === -1 && (
                <div className={commonProps.cardStyle}>
                    <WelcomeScreen
                        title={title}
                        intro={intro}
                        estimatedTime={estimatedTime}
                        personalization={personalization}
                        onStart={handleStart}
                    />
                </div>
            )}

            {currentStep === totalSections && (
                <div className={commonProps.cardStyle}>
                    <CompletionScreen
                        closingMessage={closingMessage}
                        nextSteps={completionNextSteps}
                        buttonLabel={completionButtonLabel}
                        buttonUrl={completionButtonUrl}
                        personalization={personalization}
                    />
                </div>
            )}

            {currentStep >= 0 && currentStep < totalSections && currentSection && (
                <>
                    {showSectionIntro ? (
                        <div className={commonProps.cardStyle}>
                            <AnimatePresence mode="wait">
                                <SectionIntro 
                                    key={`intro-${currentSection.id}`}
                                    title={currentSection.title}
                                    description={currentSection.description}
                                    personalization={personalization}
                                    onContinue={() => setShowSectionIntro(false)}
                                />
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className={`w-full max-w-2xl mx-auto ${commonProps.cardStyle ? commonProps.cardStyle : ""}`}>
                            {/* Progress Indicator */}
                            <div className="w-full mb-8 flex items-center justify-between text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                <span>Step {currentStep + 1} of {totalSections}</span>
                                <span>{Math.round(((currentStep + 1) / totalSections) * 100)}% Complete</span>
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                key={currentSection.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="w-full space-y-8"
                                >
                                {/* Section Header */}
                                <div className="space-y-2 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
                                    <h2 
                                        className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
                                        style={{ color: currentSection.style?.color || theme?.accentColor }}
                                    >
                                    {personalizeText(currentSection.title, personalization)}
                                    </h2>
                                </div>

                                {/* Blocks */}
                                <div className="space-y-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                                    {currentSection.blocks.map((block) => (
                                    <BlockRenderer
                                        key={block.id}
                                        block={block}
                                        personalization={personalization}
                                        accentColor={currentSection.style?.color || theme?.accentColor}
                                        value={answers[block.id]}
                                        onChange={(val) => handleAnswerChange(block.id, val)}
                                    />
                                    ))}
                                </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation */}
                            <div className="flex items-center justify-between w-full mt-12 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                                <button
                                onClick={handleBack}
                                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-all duration-200 ease-in-out transform-gpu will-change-transform hover:scale-105 active:scale-95"
                                >
                                Back
                                </button>
                                <button
                                onClick={handleNext}
                                className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-lg font-medium transition-all duration-200 ease-in-out transform-gpu will-change-transform shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                                style={theme?.accentColor ? { backgroundColor: theme.accentColor, color: "#fff" } : undefined}
                                >
                                {currentStep === totalSections - 1 ? "Complete" : "Continue"}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
  );
}

// Reusing Block Renderer logic (could be extracted to shared component if needed)
function BlockRenderer({
  block,
  personalization,
  accentColor,
  value,
  onChange,
}: {
  block: IntakeBlock;
  personalization?: PersonalizationParams;
  accentColor?: string;
  value?: any;
  onChange?: (value: any) => void;
}) {
  if (block.type === "context") {
    return (
      <div className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed break-words">
        {personalizeText(block.text, personalization)}
      </div>
    );
  }

  if (block.type === "image_choice") {
      const label = personalizeText(block.label, personalization);
      const helperText = personalizeText(block.helperText, personalization);
      
      const handleChange = (optionId: string) => {
          if (!onChange) return;
          if (block.multi) {
              const current = Array.isArray(value) ? value : [];
              if (current.includes(optionId)) {
                  onChange(current.filter((id: string) => id !== optionId));
              } else {
                  onChange([...current, optionId]);
              }
          } else {
              onChange(optionId);
          }
      };

      return (
        <div className="space-y-4">
            <div className="space-y-1">
                <label className="block text-xl font-medium text-zinc-900 dark:text-zinc-200">
                    {label}
                    {block.required && <span className="text-indigo-500 ml-1">*</span>}
                </label>
                {helperText && <p className="text-base text-zinc-500 dark:text-zinc-400">{helperText}</p>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                 {block.options.map(opt => {
                     const isChecked = block.multi ? (Array.isArray(value) && value.includes(opt.id)) : value === opt.id;
                     
                     return (
                     <label key={opt.id} className="cursor-pointer relative group block">
                        <input 
                            type={block.multi ? "checkbox" : "radio"} 
                            name={block.id}
                            value={opt.id} 
                            checked={isChecked}
                            onChange={() => handleChange(opt.id)}
                            className="peer sr-only" 
                        />
                        <div className="rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden transition-all duration-200 transform-gpu will-change-transform peer-checked:border-zinc-900 dark:peer-checked:border-zinc-100 peer-checked:ring-1 peer-checked:ring-zinc-900 dark:peer-checked:ring-zinc-100 group-hover:border-zinc-300 dark:group-hover:border-zinc-600 group-hover:shadow-lg group-hover:-translate-y-1 bg-white dark:bg-zinc-800 shadow-sm peer-checked:shadow-md peer-checked:-translate-y-1">
                             <div className="aspect-square relative bg-zinc-100 dark:bg-zinc-900">
                                {opt.imageUrl ? (
                                    <img src={opt.imageUrl} className="w-full h-full object-cover transition-transform duration-500 transform-gpu will-change-transform group-hover:scale-105" alt={opt.label} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">No Image</div>
                                )}
                                <div className="absolute inset-0 bg-black/0 peer-checked:bg-black/10 dark:peer-checked:bg-white/10 transition-colors" />
                             </div>
                             {opt.label && (
                                <div className="p-4 text-center font-medium border-t border-zinc-100 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 transition-colors peer-checked:bg-zinc-50 dark:peer-checked:bg-zinc-800/80">
                                    {opt.label}
                                </div>
                             )}
                        </div>
                        <div className="absolute top-3 right-3 opacity-0 peer-checked:opacity-100 transition-all duration-200 scale-90 peer-checked:scale-100">
                            <div className="w-6 h-6 bg-zinc-900 dark:bg-zinc-100 rounded-full flex items-center justify-center text-white dark:text-zinc-900 shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                        </div>
                     </label>
                 )})}
            </div>
        </div>
      );
  }

  if (block.type === "image_moodboard") {
    const label = personalizeText(block.label, personalization);
    const helperText = personalizeText(block.helperText, personalization);
    // Use controlled state if possible, otherwise local (Moodboard component needs update to support controlled prop fully if needed, but onReorder works)
    // For now we map local state to onChange
    
    return (
        <div className="space-y-4">
             <div className="space-y-1">
                <label className="block text-xl font-medium text-zinc-900 dark:text-zinc-200">
                    {label}
                </label>
                {helperText && <p className="text-base text-zinc-500 dark:text-zinc-400">{helperText}</p>}
            </div>
            
            <Moodboard 
                items={value || block.items} 
                onReorder={(newItems) => onChange?.(newItems)}
                onRemove={(id) => {
                    const currentItems = value || block.items;
                    onChange?.(currentItems.filter((i: any) => i.id !== id));
                }}
            />
        </div>
    );
  }

  if (block.type === "this_not_this") {
    const label = personalizeText(block.label, personalization);
    const helperText = personalizeText(block.helperText, personalization);
    
    // Controlled state: value = { yes: [], no: [] }
    const yesItems = value?.yes || [];
    const noItems = value?.no || [];

    return (
        <div className="space-y-4">
             <div className="space-y-1">
                <label className="block text-xl font-medium text-zinc-900 dark:text-zinc-200">
                    {label}
                </label>
                {helperText && <p className="text-base text-zinc-500 dark:text-zinc-400">{helperText}</p>}
            </div>
            
            <ThisNotThisBoard 
                items={block.items} 
                yesItems={yesItems}
                noItems={noItems}
                onUpdate={(yes, no) => onChange?.({ yes, no })}
            />
        </div>
    );
  }

  const label = personalizeText(block.label, personalization);
  const helperText = personalizeText(block.helperText, personalization);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-200">
        {label}
        {block.required && (
          <span 
            className="ml-2 text-[10px] uppercase tracking-wider text-indigo-500 font-semibold bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded"
            style={accentColor ? { color: accentColor, backgroundColor: `${accentColor}20` } : undefined}
          >
            Required
          </span>
        )}
      </label>
      
      {helperText && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">{helperText}</p>
      )}

      <InputRenderer 
        type={block.inputType} 
        options={block.options} 
        accentColor={accentColor} 
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

function InputRenderer({ 
    type, 
    options, 
    accentColor, 
    value, 
    onChange 
}: { 
    type: InputType; 
    options?: string[]; 
    accentColor?: string;
    value?: any;
    onChange?: (val: any) => void;
}) {
  const baseClasses =
    "w-full rounded-md border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 outline-none transition-all py-2 px-3 text-zinc-900 dark:text-zinc-100";
  
  const focusStyle = accentColor ? { borderColor: accentColor, "--tw-ring-color": `${accentColor}20` } as React.CSSProperties : {};

  switch (type) {
    case "long":
      return (
        <textarea 
            className={`${baseClasses} min-h-[100px]`} 
            rows={4} 
            style={focusStyle} 
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
        />
      );
    case "select":
      return (
        <select 
            className={baseClasses} 
            style={focusStyle}
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
        >
          <option value="">Select an option...</option>
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case "multi":
      return (
        <div className="space-y-2">
          {(options || ["Option 1", "Option 2"]).map((opt, i) => (
            <label key={i} className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                style={{ accentColor }}
                checked={Array.isArray(value) && value.includes(opt)}
                onChange={(e) => {
                    const current = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                        onChange?.([...current, opt]);
                    } else {
                        onChange?.(current.filter((v: string) => v !== opt));
                    }
                }}
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{opt}</span>
            </label>
          ))}
        </div>
      );
    case "slider":
      return (
        <div className="space-y-2">
            <input
                type="range"
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                style={{ accentColor }}
                value={value || 50}
                onChange={(e) => onChange?.(e.target.value)}
            />
            {options && options.length >= 2 && (
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{options[0]}</span>
                    <span>{options[options.length - 1]}</span>
                </div>
            )}
        </div>
      );
    case "date":
      return (
        <input 
            type="date" 
            className={baseClasses} 
            style={focusStyle} 
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
        />
      );
    case "file":
      return (
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-200 border-dashed rounded-lg cursor-pointer bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" style={accentColor ? { borderColor: accentColor } : {}}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
            </div>
            <input type="file" className="hidden" onChange={() => onChange?.("file-uploaded-mock")} />
          </label>
        </div>
      );
    case "short":
    default:
      return (
        <input 
            type="text" 
            className={baseClasses} 
            style={focusStyle} 
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
        />
      );
  }
}
