"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/src/components/ui/Button";

interface CanvasViewportProps {
  children: React.ReactNode;
  onBackgroundClick?: () => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 1.6;
const ZOOM_SENSITIVITY = 0.001;
const PAN_SENSITIVITY = 1;

export function CanvasViewport({ children, onBackgroundClick }: CanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);

  // Handle Space key for panning mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setIsPanning(false);
        lastMousePos.current = null;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // We must use a native non-passive listener to properly prevent browser zoom
    const onWheel = (e: WheelEvent) => {
      // Zoom: Ctrl + Wheel
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        // Use e.deltaY directly. 
        // Scrolling DOWN (positive delta) -> Zoom OUT (decrease scale)
        // Scrolling UP (negative delta) -> Zoom IN (increase scale)
        const zoomDelta = -e.deltaY * ZOOM_SENSITIVITY; 
        setScale((prev) => Math.min(Math.max(prev + zoomDelta, MIN_SCALE), MAX_SCALE));
      } 
      // Pan: Wheel (Vertical Scroll) or Shift + Wheel (Horizontal Scroll)
      // Only if NOT holding Ctrl, to separate zoom vs pan explicitly
      else {
        // e.preventDefault(); // Optional: prevent browser navigation/scroll if we want full control
        
        // If we are just scrolling, we update the offset (panning)
        // This mimics native scrolling behavior on an infinite canvas
        const deltaX = e.shiftKey ? -e.deltaY : -e.deltaX;
        const deltaY = e.shiftKey ? -e.deltaX : -e.deltaY;

        setOffset((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));
      }
    };

    container.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", onWheel);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    hasMoved.current = false;
    // Pan start conditions:
    // 1. Middle mouse button (button 1)
    // 2. Left mouse button (button 0) AND Space is held
    if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
      e.preventDefault();
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !lastMousePos.current) return;
    
    hasMoved.current = true;
    const deltaX = (e.clientX - lastMousePos.current.x) * PAN_SENSITIVITY;
    const deltaY = (e.clientY - lastMousePos.current.y) * PAN_SENSITIVITY;

    setOffset((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    lastMousePos.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
      // If we panned, don't trigger click
      if (hasMoved.current) return;
      
      // If space was pressed, we were likely preparing to pan, so ignore
      if (isSpacePressed) return;

      // Only trigger if clicking on the background elements
      // We can identify them by checking if the target has a specific data attribute
      // or if it matches our container refs
      const target = e.target as HTMLElement;
      if (
          target === containerRef.current || 
          target.hasAttribute('data-viewport-bg')
      ) {
          onBackgroundClick?.();
      }
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, MAX_SCALE));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, MIN_SCALE));
  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Determine cursor style
  const cursorStyle = isPanning ? "cursor-grabbing" : isSpacePressed ? "cursor-grab" : "cursor-default";

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-zinc-100/30 dark:bg-zinc-900/30 ${cursorStyle}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      // Prevent default context menu on right click if needed, or middle click
      onContextMenu={(e) => isPanning && e.preventDefault()}
    >
      {/* Infinite Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        data-viewport-bg="true"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          backgroundPosition: `${offset.x}px ${offset.y}px`,
          transform: `scale(${scale})`,
          transformOrigin: '0 0', // This aligns background scale with content roughly, though simplistic
          color: 'var(--foreground-rgb, #000)', // simplified, relies on current text color usually
        }}
      />
      
      {/* Canvas Content Surface */}
      <div
        className="absolute w-full min-h-full flex justify-center origin-top-left transition-transform duration-75 ease-out will-change-transform"
        data-viewport-bg="true"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          // Origin center for zoom usually feels better if zooming to center, but we use top-left + translate logic.
          // For MVP, simplistic translate/scale is fine.
          // However, zooming to center of view vs top-left:
          // If we use origin-center, translate logic is different.
          // Let's stick to origin-top-left (default) and just scale.
          transformOrigin: "center top", // Actually, let's try center top so it zooms relative to vertical center
        }}
      >
        <div 
             className="w-full max-w-3xl pt-16 pb-32 px-8" 
             // Stop propagation to prevent panning when interacting with content, 
             // UNLESS space is pressed.
             onMouseDown={(e) => !isSpacePressed && e.stopPropagation()}
        >
             {children}
        </div>
      </div>

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur shadow-sm border border-zinc-200 dark:border-zinc-700 p-1.5 rounded-xl z-50">
        <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="h-px bg-zinc-200 dark:bg-zinc-700 mx-1" />
        <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 w-8 p-0" title="Reset View">
          <RotateCcw className="w-4 h-4" />
        </Button>
        <div className="h-px bg-zinc-200 dark:bg-zinc-700 mx-1" />
        <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Helper Label for Pan */}
      <div className="absolute bottom-4 left-4 text-[10px] text-zinc-400 font-medium pointer-events-none select-none bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md backdrop-blur-sm">
        Space + Drag to pan • Ctrl + Scroll to zoom
      </div>
    </div>
  );
}
