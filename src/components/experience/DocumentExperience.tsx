import React, { useState } from "react";

import { IntakeSection, IntakeBlock, InputType, IntakeTheme } from "@/types/editor";
import { personalizeText, PersonalizationParams } from "@/src/lib/experience/personalize";
import { Moodboard } from "@/src/components/shared/Moodboard";
import { ThisNotThisBoard } from "@/src/components/shared/ThisNotThisBoard";
import { GRADIENT_PRESETS, getPatternCss } from "@/lib/background-presets";

interface DocumentExperienceProps {
  sections: IntakeSection[];
  personalization?: PersonalizationParams;
  title?: string;
  intro?: string;
  theme?: IntakeTheme;
}

export function DocumentExperience({
  sections,
  personalization,
  title,
  intro,
  theme,
}: DocumentExperienceProps) {
  const hasVideoBackground = theme?.background?.type === "video" && Boolean(theme.background.videoUrl);
  const audioEnabled = theme?.background?.audioEnabled ?? false;
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = React.useState(true);
  const [videoReady, setVideoReady] = React.useState(!hasVideoBackground);

  // Preload the video URL so the browser starts fetching immediately
  React.useEffect(() => {
    if (!hasVideoBackground) { setVideoReady(true); return; }
    setVideoReady(false);
    const url = theme?.background?.videoUrl;
    if (url && typeof document !== "undefined") {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "video";
      link.href = url.startsWith("http") || url.startsWith("/") ? url : `/${url}`;
      document.head.appendChild(link);
      return () => { document.head.removeChild(link); };
    }
  }, [hasVideoBackground, theme?.background?.videoUrl]);

  const cardBackgroundColor = theme?.cardBackgroundColor;
  const hasCardBackground = Boolean(cardBackgroundColor);
  const hasVisualBackground = theme?.background?.type && theme.background.type !== "none";
  const cardClassName = `${hasCardBackground ? "" : "bg-white/90 dark:bg-black/80"} backdrop-blur-md shadow-lg rounded-2xl p-8`;
  const cardStyle: React.CSSProperties | undefined = (() => {
    const s: React.CSSProperties = {};
    if (hasCardBackground) s.backgroundColor = cardBackgroundColor;
    if (theme?.fontColor) s.color = theme.fontColor;
    return Object.keys(s).length > 0 ? s : undefined;
  })();
  const bgStyle: React.CSSProperties = {};
  let animatedGradientClass = "";
  if (theme?.background?.type === "color") {
    bgStyle.backgroundColor = theme.background.color;
  } else if (theme?.background?.type === "image" && theme.background.imageUrl) {
    bgStyle.backgroundImage = `url(${theme.background.imageUrl})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
    bgStyle.backgroundAttachment = "fixed";
  } else if (theme?.background?.type === "video") {
    // Video handled via element
  } else if (theme?.background?.type === "gradient" && theme.background.gradientPreset) {
    const preset = GRADIENT_PRESETS[theme.background.gradientPreset];
    if (preset) bgStyle.backgroundImage = preset.css;
  } else if (theme?.background?.type === "pattern" && theme.background.patternType) {
    const patCss = getPatternCss(
      theme.background.patternType,
      theme.background.patternColor || "#00000015",
      theme.background.patternBgColor || "#ffffff"
    );
    bgStyle.backgroundColor = patCss.backgroundColor;
    bgStyle.backgroundImage = patCss.backgroundImage;
    if (patCss.backgroundSize) bgStyle.backgroundSize = patCss.backgroundSize;
  } else if (theme?.background?.type === "animated_gradient") {
    const colors = theme.background.animatedGradientColors || ["#667eea", "#764ba2"];
    bgStyle.backgroundImage = `linear-gradient(135deg, ${colors.join(", ")})`;
    bgStyle.backgroundSize = "200% 200%";
    // @ts-ignore
    bgStyle.animationDuration = `${theme.background.animatedGradientSpeed || 8}s`;
    animatedGradientClass = "animate-gradient-shift";
  }

  const containerStyle: React.CSSProperties = {};
  if (theme?.accentColor) {
    // @ts-ignore
    containerStyle["--accent-color"] = theme.accentColor;
  }
  if (theme?.fontColor) {
    containerStyle.color = theme.fontColor;
  }

  return (
    <div 
        className={`min-h-screen relative overflow-y-auto ${animatedGradientClass}`}
        style={{ ...bgStyle, ...containerStyle }}
    >
        {theme?.background?.type === "video" && theme.background.videoUrl && (
            <>
            <video
                ref={videoRef}
                key={theme.background.videoUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                preload="auto"
                crossOrigin="anonymous"
                // @ts-expect-error -- fetchPriority is valid HTML but not yet in React types
                fetchPriority="high"
                className={`absolute inset-0 w-full h-full object-cover z-0 bg-black transition-opacity duration-500 ${videoReady ? "opacity-100" : "opacity-0"}`}
                src={(() => { const u = theme.background.videoUrl; return u.startsWith("http") || u.startsWith("/") ? u : `/${u}`; })()}
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
        
        {theme?.background?.type === "image" && theme.background.imageUrl && (
            <div 
                className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-0" 
                style={{ 
                    backgroundImage: `url(${theme.background.imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: theme.background.blurPx ? `blur(${theme.background.blurPx}px)` : undefined,
                    transform: "scale(1.1)" // Prevent white edges when blurring
                }} 
            />
        )}
        {(theme?.background?.type === "image" || theme?.background?.type === "video") && (
            <div 
                className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-0" 
                style={{ 
                    backgroundColor: theme.background.overlayColor || "#000000",
                    opacity: theme.background.overlayOpacity ?? 0.55
                }} 
            />
        )}

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-12 space-y-16 pb-32">
            {/* Header */}
            <div className={`${hasVisualBackground ? cardClassName : ""} ${theme?.fontColor ? "font-color-override" : ""}`} style={hasVisualBackground ? cardStyle : (theme?.fontColor ? { color: theme.fontColor } : undefined)}>
                <header className="space-y-4 text-center mb-8">
                    {title && (
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                        {personalizeText(title, personalization)}
                    </h1>
                    )}
                    {intro && (
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                        {personalizeText(intro, personalization)}
                    </p>
                    )}
                </header>

                {/* Sections */}
                <div className="space-y-12">
                    {sections.map((section) => (
                    <section key={section.id} className="space-y-6">
                        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50" style={{ color: section.style?.color || theme?.accentColor }}>
                            {personalizeText(section.title, personalization)}
                        </h2>
                        {section.description && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            {personalizeText(section.description, personalization)}
                            </p>
                        )}
                        </div>

                        <div className="space-y-6">
                        {section.blocks.map((block) => (
                            <div 
                                key={block.id}
                                className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm ${theme?.fontColor ? "font-color-override" : ""}`}
                                style={cardStyle}
                            >
                                <BlockRenderer
                                    block={block}
                                    personalization={personalization}
                                    accentColor={section.style?.color || theme?.accentColor}
                                />
                            </div>
                        ))}
                        </div>
                    </section>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}

function BlockRenderer({
  block,
  personalization,
  accentColor,
}: {
  block: IntakeBlock;
  personalization?: PersonalizationParams;
  accentColor?: string;
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
                 {block.options.map(opt => (
                     <label key={opt.id} className="cursor-pointer relative group block">
                        <input 
                            type={block.multi ? "checkbox" : "radio"} 
                            name={block.id}
                            value={opt.id} 
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
                 ))}
            </div>
        </div>
      );
  }

  if (block.type === "image_moodboard") {
    const label = personalizeText(block.label, personalization);
    const helperText = personalizeText(block.helperText, personalization);
    const [items, setItems] = useState(block.items);

    return (
        <div className="space-y-4">
             <div className="space-y-1">
                <label className="block text-xl font-medium text-zinc-900 dark:text-zinc-200">
                    {label}
                </label>
                {helperText && <p className="text-base text-zinc-500 dark:text-zinc-400">{helperText}</p>}
            </div>
            
            <Moodboard 
                items={items} 
                onReorder={setItems} 
                // No onRemove in preview mode usually, unless client can remove items? 
                // User said: "Allow removing images (small × button on hover)" in Editor.
                // "Published / Preview: Same UI as canvas, but interactive for the client".
                // "Client can reorder images freely". Doesn't explicitly say remove.
                // I'll leave remove out for preview/published for now to be safe, or maybe include it if "workshop-like" implies selection by elimination.
                // "Allow removing images" was listed under "Editor (Canvas)". 
                // For Preview, it says "Same UI as canvas", which implies removing might be possible?
                // But usually moodboards are about ranking. I'll enable removing for now as it's "Same UI".
                onRemove={(id) => setItems(items.filter(i => i.id !== id))}
            />
        </div>
    );
  }

  if (block.type === "this_not_this") {
    const label = personalizeText(block.label, personalization);
    const helperText = personalizeText(block.helperText, personalization);
    
    // In a real app, this state would need to be lifted up to capture responses
    // For now, it's local state per block instance in the view
    const [yesItems, setYesItems] = useState<string[]>([]);
    const [noItems, setNoItems] = useState<string[]>([]);

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
                onUpdate={(yes, no) => {
                    setYesItems(yes);
                    setNoItems(no);
                }}
            />
        </div>
    );
  }

  if (block.type === "question") {
      const label = personalizeText(block.label, personalization);
      const helperText = personalizeText(block.helperText, personalization);

      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-200">
            {label}
            {block.required && (
              <span className="ml-2 text-[10px] uppercase tracking-wider text-indigo-500 font-semibold bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                Required
              </span>
            )}
          </label>
          
          {helperText && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">{helperText}</p>
          )}

          <InputRenderer type={block.inputType} options={block.options} accentColor={accentColor} />
        </div>
      );
  }

  if (block.type === "link_preview") {
    const label = personalizeText(block.label, personalization);
    const helperText = personalizeText(block.helperText, personalization);
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-200">
          {label}
          {block.required && <span className="ml-2 text-[10px] uppercase tracking-wider text-indigo-500 font-semibold bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">Required</span>}
        </label>
        {helperText && <p className="text-sm text-zinc-500 dark:text-zinc-400">{helperText}</p>}
        <div className="flex items-center gap-2 p-3 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-400 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Paste URLs to add link previews
        </div>
      </div>
    );
  }

  if (block.type === "book_call") {
    const title = block.title ? personalizeText(block.title, personalization) : undefined;
    const text = block.text ? personalizeText(block.text, personalization) : undefined;
    return (
      <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-800/50 dark:to-zinc-900 text-center space-y-3">
        {title && <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>}
        {text && <p className="text-sm text-zinc-500 dark:text-zinc-400">{text}</p>}
        <button
          onClick={() => block.bookingUrl && window.open(block.bookingUrl, block.openInNewTab !== false ? "_blank" : "_self")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
          style={{ backgroundColor: accentColor || "#16a34a" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          {block.buttonLabel || "Book a Call"}
        </button>
      </div>
    );
  }

  return null;
}

function InputRenderer({ type, options, accentColor }: { type: InputType; options?: string[]; accentColor?: string }) {
  const baseClasses =
    "w-full rounded-md border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 outline-none transition-all py-2 px-3 text-zinc-900 dark:text-zinc-100";
  
  const focusStyle = accentColor ? { borderColor: accentColor, "--tw-ring-color": `${accentColor}20` } as React.CSSProperties : {};

  switch (type) {
    case "long":
      return <textarea className={`${baseClasses} min-h-[100px]`} rows={4} style={focusStyle} />;
    case "select":
      return (
        <select className={baseClasses} style={focusStyle}>
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
      return <input type="date" className={baseClasses} style={focusStyle} />;
    case "file":
      return (
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-200 border-dashed rounded-lg cursor-pointer bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" style={accentColor ? { borderColor: accentColor } : {}}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
            </div>
            <input type="file" className="hidden" />
          </label>
        </div>
      );
    case "short":
    default:
      return <input type="text" className={baseClasses} style={focusStyle} />;
  }
}
