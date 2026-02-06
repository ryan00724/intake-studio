"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { EditorState, IntakeSection, IntakeBlock, IntakeMetadata, PublishedIntake } from "@/types/editor";
import { INITIAL_SECTIONS, generateId } from "@/lib/constants";
import { storePublishedInIdb, PublishedPointer } from "@/lib/published-storage";

interface EditorContextType extends EditorState {
  // Section actions
  addSection: (index?: number) => void;
  updateSection: (id: string, updates: Partial<IntakeSection>) => void;
  removeSection: (id: string) => void;
  reorderSections: (newSections: IntakeSection[]) => void;

  // Block actions
  addBlock: (sectionId: string, block: IntakeBlock, index?: number) => void;
  updateBlock: (sectionId: string, blockId: string, updates: Partial<IntakeBlock>) => void;
  removeBlock: (sectionId: string, blockId: string) => void;
  moveBlock: (activeId: string, overId: string, overSectionId: string) => void; 
  addConnection: (fromSectionId: string, toSectionId: string, fromBlockId: string, optionValue: string) => void;
  updateRouting: (sectionId: string, ruleId: string, updates: Partial<import("@/types/editor").SectionRouteRule>) => void;
  removeRouting: (sectionId: string, ruleId: string) => void;
  
  // Selection
  selectItem: (id: string | null) => void;
  
  // Metadata
  updateMetadata: (updates: Partial<IntakeMetadata>) => void;

  // Publishing
  publishIntake: () => Promise<string>; // Returns slug

  // Global
  setSections: (sections: IntakeSection[] | ((prev: IntakeSection[]) => IntakeSection[])) => void;
  isPreviewMode: boolean;
  togglePreview: () => void;
  isToolboxOpen: boolean;
  setToolboxOpen: (open: boolean) => void;
}

export const EditorContext = createContext<EditorContextType | undefined>(undefined);

const STORAGE_KEY = "intake-studio-state-v3";
const PUBLISHED_KEY_PREFIX = "published_intake_";
const PUBLISHED_KEY = "intake:published:";

export function EditorProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<IntakeSection[]>([]);
  const [metadata, setMetadata] = useState<IntakeMetadata>({ title: "Untitled Intake", mode: "guided" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [edges, setEdges] = useState<any[]>([]); // Placeholder for edges, logic to be added
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isToolboxOpen, setToolboxOpen] = useState(true);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Handle migration from v2 (array) to v3 (object)
        if (Array.isArray(parsed)) {
             setSections(parsed);
             setMetadata({ title: "Untitled Intake", mode: "guided" });
        } else if (parsed.sections) {
             setSections(parsed.sections);
             setMetadata(parsed.metadata || { title: "Untitled Intake", mode: "guided" });
        } else {
             setSections(INITIAL_SECTIONS);
        }
      } catch (e) {
        console.error("Failed to parse editor state", e);
        setSections(INITIAL_SECTIONS);
      }
    } else {
      setSections(INITIAL_SECTIONS);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sections, metadata }));
    }
  }, [sections, metadata, isLoaded]);

  const addSection = (index?: number) => {
    const newSection: IntakeSection = {
      id: generateId(),
      title: "New Section",
      blocks: [],
    };
    
    setSections((prev) => {
      const next = [...prev];
      if (typeof index === 'number') {
        next.splice(index, 0, newSection);
      } else {
        next.push(newSection);
      }
      return next;
    });
    setSelectedId(newSection.id);
  };

  const updateSection = (id: string, updates: Partial<IntakeSection>) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, ...updates } : sec))
    );
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((sec) => sec.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const reorderSections = (newSections: IntakeSection[]) => {
    setSections(newSections);
  };

  const addBlock = (sectionId: string, block: IntakeBlock, index?: number) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const newBlocks = [...sec.blocks];
        if (typeof index === 'number') {
          newBlocks.splice(index, 0, block);
        } else {
          newBlocks.push(block);
        }
        return { ...sec, blocks: newBlocks };
      })
    );
    setSelectedId(block.id);
  };

  const addConnection = (fromSectionId: string, toSectionId: string, fromBlockId: string, optionValue: string) => {
      setSections(prev => prev.map(sec => {
          if (sec.id === fromSectionId) {
              const currentRouting = sec.routing || [];
              // Prevent duplicate rules for same block + value
              if (currentRouting.some(r => r.fromBlockId === fromBlockId && r.value === optionValue)) {
                  return sec;
              }
              
              const newRule = {
                  id: generateId(),
                  fromBlockId,
                  operator: "equals" as const,
                  value: optionValue,
                  nextSectionId: toSectionId
              };
              
              return { ...sec, routing: [...currentRouting, newRule] };
          }
          return sec;
      }));
  };

  const updateRouting = (sectionId: string, ruleId: string, updates: Partial<import("@/types/editor").SectionRouteRule>) => {
      setSections(prev => prev.map(sec => {
          if (sec.id === sectionId && sec.routing) {
              return {
                  ...sec,
                  routing: sec.routing.map(rule => rule.id === ruleId ? { ...rule, ...updates } : rule)
              };
          }
          return sec;
      }));
  };

  const removeRouting = (sectionId: string, ruleId: string) => {
      setSections(prev => prev.map(sec => {
          if (sec.id === sectionId && sec.routing) {
              return {
                  ...sec,
                  routing: sec.routing.filter(rule => rule.id !== ruleId)
              };
          }
          return sec;
      }));
  };

  const updateBlock = (sectionId: string, blockId: string, updates: Partial<IntakeBlock>) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          blocks: sec.blocks.map((b) => {
              if (b.id !== blockId) return b;
              
              // Handle discriminated union updates carefully
              const updatedBlock = { ...b, ...updates };
              
              // If type is changing or preserved, TypeScript needs help verifying the discriminated union
              // We cast to any to allow the update, assuming the caller respects the type contract
              // For safety, we can ensure 'type' isn't accidentally overwritten with incompatible properties
              return updatedBlock as IntakeBlock;
          }),
        };
      })
    );
  };

  const removeBlock = (sectionId: string, blockId: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return { ...sec, blocks: sec.blocks.filter((b) => b.id !== blockId) };
      })
    );
    if (selectedId === blockId) setSelectedId(null);
  };
  
  const moveBlock = (activeId: string, overId: string, overSectionId: string) => {
      // Placeholder
  };

  const selectItem = (id: string | null) => {
    setSelectedId(id);
  };

  const updateMetadata = (updates: Partial<IntakeMetadata>) => {
      setMetadata(prev => ({ ...prev, ...updates }));
  };

  const cleanupPublishedStorage = (keepSlug?: string) => {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i += 1) {
          const key = localStorage.key(i);
          if (!key) continue;
          const isLegacy = key.startsWith(PUBLISHED_KEY_PREFIX);
          const isCurrent = key.startsWith(PUBLISHED_KEY);
          if (!isLegacy && !isCurrent) continue;
          if (keepSlug && (key === `${PUBLISHED_KEY}${keepSlug}` || key === `${PUBLISHED_KEY_PREFIX}${keepSlug}`)) {
              continue;
          }
          keysToRemove.push(key);
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
  };

  const publishIntake = async () => {
      const slug = metadata.slug || generateId();
      const publishedData: PublishedIntake = {
          slug,
          sections,
          edges, // Include edges if you have them in state (currently we use section.routing as source of truth for now, but if we migrate fully to edges state, we pass it here)
          // Since edges state is currently a placeholder, and we derive edges from section.routing, we might want to normalize it before publishing or just stick to sections for now if edges are not fully populated.
          // However, the request implies we should pass edges. 
          // If edges state is empty, maybe we should derive them?
          // But getOutgoingRoutes is a read helper.
          // For now, let's pass the edges state even if empty, assuming future migration.
          // Or better: if edges state is empty but sections have routing, we can optionally populate edges here.
          // But the goal is just "pass edges from published data". So we just include the field.
          metadata: { ...metadata, slug, publishedAt: new Date().toISOString() },
          publishedAt: Date.now()
      };
      
      // Save specific published version
      const payload = JSON.stringify(publishedData);
      const primaryKey = `${PUBLISHED_KEY}${slug}`;
      const legacyKey = `${PUBLISHED_KEY_PREFIX}${slug}`;
      try {
          localStorage.setItem(primaryKey, payload);
          localStorage.removeItem(legacyKey);
      } catch (error) {
          if (error instanceof DOMException && error.name === "QuotaExceededError") {
              cleanupPublishedStorage(slug);
              const pointer: PublishedPointer = { __storage: "idb", key: primaryKey };
              try {
                  localStorage.setItem(primaryKey, JSON.stringify(pointer));
                  localStorage.removeItem(legacyKey);
                  await storePublishedInIdb(primaryKey, publishedData);
              } catch (retryError) {
                  console.error("Failed to publish intake: storage quota exceeded", retryError);
                  alert("Publish failed: storage quota exceeded. Try removing large images or fewer image choices.");
                  return "";
              }
          } else {
              console.error("Failed to publish intake", error);
              return "";
          }
      }
      
      // Update editor state with slug if it didn't have one
      if (!metadata.slug) {
          updateMetadata({ slug });
      }

      return slug;
  };

  const togglePreview = () => setIsPreviewMode((prev) => !prev);

  return (
    <EditorContext.Provider
      value={{
        sections,
        metadata,
        selectedId,
        addSection,
        updateSection,
        removeSection,
        reorderSections,
        addBlock,
        updateBlock,
        removeBlock,
        moveBlock,
        addConnection,
        updateRouting,
        removeRouting,
        selectItem,
        setSections,
        updateMetadata,
        publishIntake,
        isPreviewMode,
        togglePreview,
        isToolboxOpen,
        setToolboxOpen,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}
