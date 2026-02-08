import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IntakeSection, IntakeBlock, InputType, IntakeTheme, IntakeEdge, LinkPreviewItem } from "@/types/editor";
import { personalizeText, PersonalizationParams } from "@/src/lib/experience/personalize";
import { WelcomeScreen } from "./WelcomeScreen";
import { CompletionScreen } from "./CompletionScreen";
import { SectionIntro } from "./SectionIntro";
import { Moodboard } from "@/src/components/shared/Moodboard";
import { ThisNotThisBoard } from "@/src/components/shared/ThisNotThisBoard";
import { getOutgoingRoutes } from "@/src/lib/flow";
import { GRADIENT_PRESETS, getPatternCss } from "@/lib/background-presets";

interface GuidedExperienceProps {
  sections: IntakeSection[];
  edges?: IntakeEdge[]; // Added edges prop for node-based routing
  slug?: string; // For submission to API
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
  edges,
  slug,
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
  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  // Video backgrounds use signed URLs resolved below.
  let animatedGradientClass = "";
  if (activeBackground?.type === "color") {
    bgStyle.backgroundColor = activeBackground.color;
  } else if (activeBackground?.type === "image" && activeBackground.imageUrl) {
    bgStyle.backgroundImage = `url(${activeBackground.imageUrl})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
    bgStyle.backgroundAttachment = "fixed";
  } else if (activeBackground?.type === "gradient" && activeBackground.gradientPreset) {
    const preset = GRADIENT_PRESETS[activeBackground.gradientPreset];
    if (preset) bgStyle.backgroundImage = preset.css;
  } else if (activeBackground?.type === "pattern" && activeBackground.patternType) {
    const patCss = getPatternCss(
      activeBackground.patternType,
      activeBackground.patternColor || "#00000015",
      activeBackground.patternBgColor || "#ffffff"
    );
    bgStyle.backgroundColor = patCss.backgroundColor;
    bgStyle.backgroundImage = patCss.backgroundImage;
    if (patCss.backgroundSize) bgStyle.backgroundSize = patCss.backgroundSize;
  } else if (activeBackground?.type === "animated_gradient") {
    const colors = activeBackground.animatedGradientColors || ["#667eea", "#764ba2"];
    bgStyle.backgroundImage = `linear-gradient(135deg, ${colors.join(", ")})`;
    bgStyle.backgroundSize = "200% 200%";
    // @ts-ignore
    bgStyle.animationDuration = `${activeBackground.animatedGradientSpeed || 8}s`;
    animatedGradientClass = "animate-gradient-shift";
  }

  const containerStyle: React.CSSProperties = {};
  if (theme?.accentColor) {
    // @ts-ignore
    containerStyle["--accent-color"] = theme.accentColor;
  }
  // cardStyle: "light" or "dark" controls card appearance
  const resolvedCardStyle = theme?.cardStyle || "light";

  // Submit answers when reaching the completion screen
  React.useEffect(() => {
    if (currentStep !== totalSections) return;
    if (submitted || submitting) return;
    if (!slug) return; // No slug = preview mode, don't submit
    if (Object.keys(answers).length === 0) return;

    setSubmitting(true);
    fetch(`/api/public/intakes/${slug}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers,
        metadata: {
          completedAt: new Date().toISOString(),
          sectionPath: history,
        },
      }),
    })
      .then((res) => {
        if (res.ok) setSubmitted(true);
      })
      .catch((err) => console.error("Submission failed:", err))
      .finally(() => setSubmitting(false));
  }, [currentStep, totalSections, slug, submitted, submitting, answers, history]);

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

    // Gate: Check book_call blocks with requiredToContinue
    for (const block of currentSection.blocks) {
      if (block.type === "book_call" && block.requiredToContinue) {
        if (!answers[block.id]?.clicked) return; // silently prevent — UI shows hint
      }
    }

    // 1. Check Routing (Using edge-based helper with legacy fallback)
    const outgoingRoutes = getOutgoingRoutes(sections, currentSection.id, edges);
    
    // Helper to perform the transition
    const tryNavigate = (targetSectionId: string) => {
        const nextIndex = sections.findIndex(s => s.id === targetSectionId);
        
        // Prevent loops: check if next section is already in history (basic cycle detection)
        if (nextIndex !== -1 && !history.includes(targetSectionId) && currentSection.id !== targetSectionId) {
            setHistory(prev => [...prev, currentSection.id]);
            setCurrentStep(nextIndex);
            
            if (sections[nextIndex]?.description) {
                setShowSectionIntro(true);
            } else {
                setShowSectionIntro(false);
            }
            return true;
        }
        return false;
    };

    // Priority 1: Conditional Routes
    // Evaluate conditions to find the first matching route
    for (const route of outgoingRoutes) {
        if (route.condition) {
            const { fromBlockId, operator, value } = route.condition;
            const answer = fromBlockId ? answers[fromBlockId] : undefined;
            
            if (operator === "equals" && answer === value) {
                if (tryNavigate(route.targetSectionId)) return;
            }
        }
    }

    // Priority 2: Fallback "Any" Route
    const anyRoute = outgoingRoutes.find(r => r.condition?.operator === "any");
    if (anyRoute) {
        if (tryNavigate(anyRoute.targetSectionId)) return;
    }

    // Priority 3: Unconditional Route (Default)
    // If no conditions matched, check for a route without conditions
    // Note: With "any" route, unconditional routes (operator missing) might be redundant or treated same as "any"
    // But keeping existing logic for backward compatibility
    const defaultRoute = outgoingRoutes.find(r => !r.condition);
    if (defaultRoute) {
        if (tryNavigate(defaultRoute.targetSectionId)) return;
    }

    // 3. Default Linear Progression (Fallback if no routing matched or valid)
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

  const hasVideoBackground = activeBackground?.type === "video" && Boolean(activeBackground.videoUrl);
  const audioEnabled = (activeBackground as any)?.audioEnabled ?? false;
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = React.useState(true);
  const [videoReady, setVideoReady] = React.useState(!hasVideoBackground);

  // Preload the video URL so the browser starts fetching immediately
  React.useEffect(() => {
    if (!hasVideoBackground) { setVideoReady(true); return; }
    setVideoReady(false);
    const url = activeBackground?.videoUrl;
    if (url && typeof document !== "undefined") {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "video";
      link.href = url.startsWith("http") || url.startsWith("/") ? url : `/${url}`;
      document.head.appendChild(link);
      return () => { document.head.removeChild(link); };
    }
  }, [hasVideoBackground, activeBackground?.videoUrl]);

  const hasVisualBackground = activeBackground?.type && activeBackground.type !== "none";
  const isDarkCard = resolvedCardStyle === "dark";
  const cardBg = isDarkCard ? "bg-zinc-900/90 text-zinc-100" : "bg-white/90 text-zinc-900";
  // Border and inner-block colors that match the card style
  const borderColor = isDarkCard ? "border-zinc-700" : "border-zinc-200";
  const innerBlockBg = isDarkCard ? "bg-zinc-800/60" : "bg-white";
  const commonProps = {
      theme,
      cardClassName: `${hasVisualBackground
        ? `intake-card backdrop-blur-md shadow-lg rounded-2xl p-8 max-w-2xl mx-auto ${cardBg}`
        : ""}`.trim(),
      cardStyle: undefined as React.CSSProperties | undefined,
  };
  return (
    <div 
        className={`min-h-screen relative flex flex-col items-center justify-center py-12 overflow-y-auto ${animatedGradientClass}`}
        style={{ ...bgStyle, ...containerStyle }}
    >
        {activeBackground?.type === "video" && activeBackground.videoUrl && (
            <>
            <video
                ref={videoRef}
                key={activeBackground.videoUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                preload="auto"
                crossOrigin="anonymous"
                // @ts-expect-error -- fetchPriority is valid HTML but not yet in React types
                fetchPriority="high"
                className={`absolute inset-0 w-full h-full object-cover z-0 bg-black transition-opacity duration-500 ${videoReady ? "opacity-100" : "opacity-0"}`}
                src={(() => { const u = activeBackground.videoUrl; return u.startsWith("http") || u.startsWith("/") ? u : `/${u}`; })()}
                onLoadedData={() => setVideoReady(true)}
            />
            {audioEnabled && videoReady && (
                <button
                    onClick={() => {
                        setIsMuted((m) => {
                            const next = !m;
                            if (videoRef.current) videoRef.current.muted = next;
                            return next;
                        });
                    }}
                    className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium hover:bg-black/80 transition-colors shadow-lg"
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                    )}
                    {isMuted ? "Unmute" : "Mute"}
                </button>
            )}
            </>
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
                <div className={commonProps.cardClassName} style={commonProps.cardStyle}>
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
                <div className={commonProps.cardClassName} style={commonProps.cardStyle}>
                    <CompletionScreen
                        closingMessage={closingMessage}
                        nextSteps={completionNextSteps}
                        buttonLabel={completionButtonLabel}
                        buttonUrl={completionButtonUrl}
                        personalization={personalization}
                    />
                    {submitting && (
                        <div className="text-center mt-4">
                            <p className="text-xs text-zinc-400 animate-pulse">Saving your responses...</p>
                        </div>
                    )}
                </div>
            )}

            {currentStep >= 0 && currentStep < totalSections && currentSection && (
                <>
                    {showSectionIntro ? (
                        <div className={commonProps.cardClassName} style={commonProps.cardStyle}>
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
                        <div className={`w-full max-w-2xl mx-auto ${commonProps.cardClassName ? commonProps.cardClassName : ""}`} style={commonProps.cardStyle}>
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
                                <div className={`space-y-2 border-b ${borderColor} pb-4 mb-6`}>
                                    <h2 
                                        className="text-xl font-semibold"
                                        style={{ color: currentSection.style?.color || theme?.accentColor }}
                                    >
                                    {personalizeText(currentSection.title, personalization)}
                                    </h2>
                                </div>

                                {/* Blocks */}
                                <div className={`space-y-6 ${innerBlockBg} rounded-xl border ${borderColor} p-6 shadow-sm`}>
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
                            <div className={`flex items-center justify-between w-full mt-12 pt-6 border-t ${borderColor}`}>
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

  if (block.type === "heading") {
    const Tag = block.level || "h2";
    const sizeClass = Tag === "h1" ? "text-4xl font-bold" : Tag === "h2" ? "text-2xl font-semibold" : "text-xl font-medium";
    return (
      <Tag className={`${sizeClass} text-zinc-900 dark:text-zinc-100 break-words`}>
        {personalizeText(block.text, personalization)}
      </Tag>
    );
  }

  if (block.type === "divider") {
    const borderStyle = block.style === "dashed" ? "border-dashed" : block.style === "dotted" ? "border-dotted" : "border-solid";
    return <hr className={`border-t-2 border-zinc-300 dark:border-zinc-600 my-2 ${borderStyle}`} />;
  }

  if (block.type === "image_display") {
    if (!block.imageUrl) return null;
    return (
      <figure className="space-y-2">
        <img
          src={block.imageUrl}
          alt={block.alt || ""}
          className="w-full rounded-xl object-cover"
        />
        {block.caption && (
          <figcaption className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
            {personalizeText(block.caption, personalization)}
          </figcaption>
        )}
      </figure>
    );
  }

  if (block.type === "video_embed") {
    if (!block.videoUrl) return null;
    return (
      <div className="space-y-2">
        <video
          src={block.videoUrl}
          controls
          playsInline
          preload="metadata"
          className="w-full rounded-xl bg-black"
        />
        {block.caption && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
            {personalizeText(block.caption, personalization)}
          </p>
        )}
      </div>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote className="border-l-4 border-zinc-400 dark:border-zinc-500 pl-5 py-2 my-2">
        <p className="text-lg italic text-zinc-700 dark:text-zinc-300 leading-relaxed break-words">
          {personalizeText(block.text, personalization)}
        </p>
        {block.attribution && (
          <footer className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            — {personalizeText(block.attribution, personalization)}
          </footer>
        )}
      </blockquote>
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
                    {block.required && <span className="preserve-color text-red-500 ml-1">*</span>}
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

  if (block.type === "question") {
      const label = personalizeText(block.label, personalization);
      const helperText = personalizeText(block.helperText, personalization);

      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            {label}
            {block.required && (
              <span 
                className="preserve-color ml-2 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded text-red-600 bg-red-500/10"
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

  if (block.type === "link_preview") {
    return (
      <LinkPreviewRuntime
        block={block}
        personalization={personalization}
        accentColor={accentColor}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (block.type === "book_call") {
    return (
      <BookCallRuntime
        block={block}
        personalization={personalization}
        accentColor={accentColor}
        value={value}
        onChange={onChange}
      />
    );
  }

  return null;
}

// --- Link Preview Runtime ---
function LinkPreviewRuntime({
  block,
  personalization,
  accentColor,
  value,
  onChange,
}: {
  block: import("@/types/editor").LinkPreviewBlock;
  personalization?: PersonalizationParams;
  accentColor?: string;
  value?: LinkPreviewItem[];
  onChange?: (val: LinkPreviewItem[]) => void;
}) {
  const label = personalizeText(block.label, personalization);
  const helperText = personalizeText(block.helperText, personalization);
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items: LinkPreviewItem[] = Array.isArray(value) ? value : [];
  const maxLinks = block.maxItems ?? 3;
  const atMax = items.length >= maxLinks;

  // Track in-flight URLs to prevent duplicate rapid adds
  const pendingRef = React.useRef<Set<string>>(new Set());

  const handleAdd = useCallback(async () => {
    const url = inputUrl.trim();
    if (!url) return;

    try {
      const u = new URL(url);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
    } catch {
      setError("Please enter a valid http/https URL");
      return;
    }

    if (items.some(i => i.url === url) || pendingRef.current.has(url)) {
      setError("Link already added");
      return;
    }

    pendingRef.current.add(url);
    setLoading(true);
    setError(null);
    setInputUrl("");

    try {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      const data = res.ok ? await res.json() : {};

      const newItem: LinkPreviewItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        url,
        title: data.title,
        description: data.description,
        image: data.image,
        screenshot: data.screenshot || undefined,
        domain: data.domain,
      };

      // Re-read items from latest value to avoid stale closure
      onChange?.([...items, newItem]);
    } catch {
      setError("Failed to fetch preview");
    } finally {
      pendingRef.current.delete(url);
      setLoading(false);
    }
  }, [inputUrl, items, onChange]);

  const handleRemove = (id: string) => {
    onChange?.(items.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-200">
          {label}
          {block.required && (
            <span className="preserve-color ml-2 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded text-red-600 bg-red-500/10"
            >Required</span>
          )}
        </label>
        {helperText && <p className="text-sm text-zinc-500 dark:text-zinc-400">{helperText}</p>}
      </div>

      {/* Input */}
      {!atMax && (
        <div className="flex gap-2">
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => { setInputUrl(e.target.value); setError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
            placeholder="Paste a URL and press Enter..."
            className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 transition-all"
            disabled={loading}
          />
          <button
            onClick={handleAdd}
            disabled={loading || !inputUrl.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            style={accentColor ? { backgroundColor: accentColor } : undefined}
          >
            {loading ? "..." : "Add"}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {atMax && <p className="text-xs text-zinc-400">Maximum of {maxLinks} links reached.</p>}

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm animate-pulse overflow-hidden">
          <div className="w-full h-[180px] bg-zinc-200 dark:bg-zinc-700" />
          <div className="p-3 space-y-2">
            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
            <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded w-1/3" />
          </div>
        </div>
      )}

      {/* Preview Cards */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const thumbnail = item.screenshot || item.image;
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm group relative hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-md transition-all cursor-pointer no-underline overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Screenshot / OG image — full-width top banner */}
                <div className="w-full h-[180px] bg-zinc-100 dark:bg-zinc-900 relative overflow-hidden">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt=""
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (item.screenshot && img.src !== item.image && item.image) {
                          img.src = item.image;
                        } else {
                          img.style.display = "none";
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    </div>
                  )}
                  {item.screenshot && (
                    <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-medium leading-tight backdrop-blur-sm">
                      LIVE
                    </div>
                  )}
                </div>

                {/* Text content below the image */}
                <div className="p-3 space-y-1">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{item.title || item.url}</div>
                  {item.description && <div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{item.description}</div>}
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1 pt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    {item.domain || item.url}
                  </div>
                </div>

                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(item.id); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs backdrop-blur-sm"
                >
                  ✕
                </button>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Book a Call Runtime ---
function BookCallRuntime({
  block,
  personalization,
  accentColor,
  value,
  onChange,
}: {
  block: import("@/types/editor").BookCallBlock;
  personalization?: PersonalizationParams;
  accentColor?: string;
  value?: { clicked: boolean };
  onChange?: (val: { clicked: boolean }) => void;
}) {
  const title = block.title ? personalizeText(block.title, personalization) : undefined;
  const text = block.text ? personalizeText(block.text, personalization) : undefined;
  const clicked = value?.clicked || false;

  const handleClick = () => {
    if (block.bookingUrl) {
      if (block.openInNewTab !== false) {
        window.open(block.bookingUrl, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = block.bookingUrl;
      }
      onChange?.({ clicked: true });
    }
  };

  return (
    <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-800/50 dark:to-zinc-900 text-center space-y-3">
      {title && <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>}
      {text && <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">{text}</p>}
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
        style={{ backgroundColor: accentColor || "#16a34a" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        {block.buttonLabel || "Book a Call"}
      </button>
      {clicked && (
        <p className="text-xs text-green-600 dark:text-green-400 font-medium">Booking link opened</p>
      )}
      {block.requiredToContinue && !clicked && (
        <p className="text-xs text-amber-500">Please click the button above to continue.</p>
      )}
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
    case "file": {
      const fileValue = value as { url?: string; name?: string; uploading?: boolean } | string | undefined;
      const isUploading = typeof fileValue === "object" && fileValue?.uploading;
      const hasFile = typeof fileValue === "object" ? fileValue?.url : (typeof fileValue === "string" && fileValue !== "file-uploaded-mock" ? fileValue : null);
      const fileName = typeof fileValue === "object" ? fileValue?.name : (hasFile ? "Uploaded file" : null);

      const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Show uploading state immediately
        onChange?.({ name: file.name, uploading: true });
        try {
          const { uploadFile } = await import("@/src/lib/upload");
          const result = await uploadFile(file, "submissions");
          onChange?.({ url: result.url, name: file.name, type: result.type, size: result.size });
        } catch (err) {
          console.error("File upload failed:", err);
          onChange?.(undefined); // Clear on error
        }
      };

      if (isUploading) {
        return (
          <div className="flex items-center justify-center w-full h-32 border-2 border-zinc-200 border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-700" style={accentColor ? { borderColor: accentColor } : {}}>
            <div className="flex flex-col items-center gap-2">
              <svg className="animate-spin w-6 h-6 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle className="opacity-25" cx="12" cy="12" r="10"/><path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <p className="text-xs text-zinc-400">Uploading {fileName}...</p>
            </div>
          </div>
        );
      }

      if (hasFile) {
        return (
          <div className="flex items-center gap-3 w-full p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
            <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{fileName}</p>
              <a href={hasFile} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">View file</a>
            </div>
            <button
              onClick={() => onChange?.(undefined)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
              title="Remove"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-200 border-dashed rounded-lg cursor-pointer bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" style={accentColor ? { borderColor: accentColor } : {}}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              <p className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold">Click to upload</span>
              </p>
              <p className="text-xs text-zinc-400">Max 10MB</p>
            </div>
            <input type="file" className="hidden" onChange={handleFileSelect} />
          </label>
        </div>
      );
    }
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
