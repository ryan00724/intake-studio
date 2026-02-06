"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEditor } from "@/hooks/use-editor";
import { SortableSection } from "./sortable-section";
import { AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function Canvas() {
  const { sections, selectItem, selectedId } = useEditor();
  const { setNodeRef } = useDroppable({
    id: "canvas-root",
    data: { type: "root" }
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<{ path: string; marker?: string; sourceId: string; targetId: string; isRouting?: boolean; selectionId?: string }[]>([]);
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);

  // Function to calculate connection lines
  const updateConnections = () => {
    if (!containerRef.current || sections.length < 2) {
      setConnections([]);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const scale = containerRef.current.offsetWidth > 0 
        ? containerRect.width / containerRef.current.offsetWidth 
        : 1;

    const newConnections: typeof connections = [];

    // Get all section elements
    const sectionElements = Array.from(containerRef.current.querySelectorAll('[data-section-id]'));
    
    // Map section IDs to their elements
    const sectionMap = new Map<string, Element>();
    sectionElements.forEach(el => {
        const id = el.getAttribute('data-section-id');
        if (id) sectionMap.set(id, el);
    });

    const getAnchors = (rect: DOMRect) => {
        const xOffset = rect.left - containerRect.left;
        const yOffset = rect.top - containerRect.top;
        
        // Vertical
        return {
            start: { 
                x: (xOffset + rect.width / 2) / scale, 
                y: (yOffset + rect.height) / scale 
            },
            end: { 
                x: (xOffset + rect.width / 2) / scale, 
                y: yOffset / scale 
            }
        };
    };

    // 1. Sequential Connections
    // (Legacy logic for visual flow, but only if no routing exists?)
    // Actually, let's keep drawing sequential line for now as visual fallback for linear flow
    for (let i = 0; i < sections.length - 1; i++) {
        const currentSection = sections[i];
        const nextSection = sections[i + 1];
        
        // Skip if this section has explicit routing
        if (currentSection.routing && currentSection.routing.length > 0) continue;

        const currentEl = sectionMap.get(currentSection.id);
        const nextEl = sectionMap.get(nextSection.id);

        if (currentEl && nextEl) {
            const currentRect = currentEl.getBoundingClientRect();
            const nextRect = nextEl.getBoundingClientRect();
            
            const anchorsCurrent = getAnchors(currentRect);
            const anchorsNext = getAnchors(nextRect);

            // Sequential path logic (Vertical)
            const midY = (anchorsCurrent.start.y + anchorsNext.end.y) / 2;
            const d = `M ${anchorsCurrent.start.x} ${anchorsCurrent.start.y} C ${anchorsCurrent.start.x} ${midY}, ${anchorsNext.end.x} ${midY}, ${anchorsNext.end.x} ${anchorsNext.end.y}`;

            newConnections.push({ path: d, sourceId: currentSection.id, targetId: nextSection.id });
        }
    }

    // 2. Routing Connections
    sections.forEach(section => {
        if (section.routing) {
            section.routing.forEach(rule => {
                const currentEl = sectionMap.get(section.id);
                const targetEl = sectionMap.get(rule.nextSectionId);

                if (currentEl && targetEl) {
                    const currentRect = currentEl.getBoundingClientRect();
                    const targetRect = targetEl.getBoundingClientRect();
                    
                    const anchorsCurrent = getAnchors(currentRect);
                    const anchorsTarget = getAnchors(targetRect);

                    // Vertical routing
                    const startX = anchorsCurrent.start.x + 20; // Offset start
                    const endX = anchorsTarget.end.x + 20;     // Offset end
                    
                    const isBackwards = anchorsTarget.end.y < anchorsCurrent.start.y;
                    const controlOffset = 80;
                    let d = "";

                    if (isBackwards) {
                        // Curve out to the right
                        const rightMost = Math.max(startX, endX) + 100;
                        d = `M ${startX} ${anchorsCurrent.start.y} C ${rightMost} ${anchorsCurrent.start.y}, ${rightMost} ${anchorsTarget.end.y}, ${endX} ${anchorsTarget.end.y}`;
                    } else {
                        d = `M ${startX} ${anchorsCurrent.start.y} C ${startX} ${anchorsCurrent.start.y + controlOffset}, ${endX} ${anchorsTarget.end.y - controlOffset}, ${endX} ${anchorsTarget.end.y}`;
                    }

                    // Generate a virtual ID for selection (prefix with "edge:")
                    // We construct it from rule ID if available, or just composite
                    const edgeId = rule.id || `${section.id}-${rule.nextSectionId}`;
                    const selectionId = `edge:${section.id}:${rule.id}`;

                    newConnections.push({ 
                        path: d, 
                        marker: "url(#arrowhead)", 
                        sourceId: section.id, 
                        targetId: rule.nextSectionId, 
                        isRouting: true,
                        // Store full ID for selection
                        selectionId: selectionId 
                    });
                }
            });
        }
    });

    setConnections(newConnections);
  };

  useEffect(() => {
    updateConnections();
    
    let rafId: number;
    const loop = () => {
        updateConnections();
        rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    window.addEventListener('resize', updateConnections);
    
    return () => {
        window.removeEventListener('resize', updateConnections);
        cancelAnimationFrame(rafId);
    };
  }, [sections, selectedId, hoveredSectionId]);

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-none min-h-[500px] relative flex flex-col gap-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
           selectItem(null);
        }
      }}
    >
        {/* Connection Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0">
            <defs>
                <marker
                    id="arrowhead"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                    className="text-indigo-400"
                >
                    <path d="M0,0 L0,6 L6,3 z" fill="currentColor" />
                </marker>
            </defs>
            {connections.map((conn, i) => {
                // Determine active state for edge highlighting
                const activeId = hoveredSectionId || selectedId;
                const isSelected = conn.selectionId && selectedId === conn.selectionId;
                
                // Connection is active if either source OR target is the active node OR if the edge itself is selected
                const isConnectedToActive = activeId ? (conn.sourceId === activeId || conn.targetId === activeId) : false;
                
                // Styling
                let strokeClass = "";
                let opacityClass = "";
                let pointerEvents = "pointer-events-none"; // Default
                
                if (conn.isRouting && conn.selectionId) {
                    pointerEvents = "pointer-events-stroke cursor-pointer";
                }

                if (isSelected) {
                    strokeClass = "stroke-indigo-600 stroke-[3px]";
                    opacityClass = "opacity-100";
                } else if (activeId) {
                    if (isConnectedToActive) {
                        strokeClass = conn.marker ? "stroke-indigo-500 stroke-[2px]" : "stroke-zinc-500 dark:stroke-zinc-400 stroke-[2px]";
                        opacityClass = "opacity-100";
                    } else {
                        strokeClass = conn.marker ? "stroke-indigo-300 stroke-[1px]" : "stroke-zinc-300 dark:stroke-zinc-700 stroke-[1px]";
                        opacityClass = "opacity-20"; // Fade out unrelated edges
                    }
                } else {
                    // Default state (no selection/hover)
                    strokeClass = conn.marker ? "stroke-indigo-400/50 stroke-[1.5px] hover:stroke-[3px] hover:stroke-indigo-500" : "stroke-zinc-300 dark:stroke-zinc-700 stroke-[1.5px]";
                    opacityClass = "opacity-40 hover:opacity-100";
                }

                return (
                    <path 
                        key={i}
                        d={conn.path}
                        className={`transition-all duration-300 ${strokeClass} ${opacityClass} ${pointerEvents}`}
                        fill="none"
                        markerEnd={conn.marker}
                        onClick={(e) => {
                            if (conn.selectionId) {
                                e.stopPropagation();
                                selectItem(conn.selectionId);
                            }
                        }}
                    />
                );
            })}
        </svg>

        <div 
            ref={setNodeRef} 
            className="relative z-10 w-full max-w-3xl mx-auto space-y-6"
            onClick={() => selectItem(null)}
        >
            <SortableContext
                items={sections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
            >
                {sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-zinc-400 gap-2 min-h-[300px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/20 w-96">
                    <p className="font-medium">Drag a section here to start</p>
                </div>
                ) : (
                 <>
                     <AnimatePresence mode="popLayout">
                        {sections.map((section) => (
                            <div 
                                key={section.id} 
                                className="w-full"
                                onMouseEnter={() => setHoveredSectionId(section.id)}
                                onMouseLeave={() => setHoveredSectionId(null)}
                                style={{
                                    opacity: (hoveredSectionId || selectedId) && (hoveredSectionId !== section.id && selectedId !== section.id) ? 0.6 : 1,
                                    transition: "opacity 0.3s ease"
                                }}
                            >
                                <SortableSection section={section} />
                            </div>
                        ))}
                    </AnimatePresence>
                 </>
                )}
            </SortableContext>
        </div>
    </div>
  );
}
