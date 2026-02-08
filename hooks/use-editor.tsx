"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useRef } from "react";
import { EditorState, IntakeSection, IntakeBlock, IntakeMetadata, PublishedIntake } from "@/types/editor";
import { INITIAL_SECTIONS, generateId } from "@/lib/constants";
import { storePublishedInIdb, PublishedPointer } from "@/lib/published-storage";
import { validateFlow, FlowValidationResult } from "@/src/lib/flow-validation";

interface EditorContextType extends EditorState {
  intakeId?: string;
  isSaving: boolean;
  lastSaved?: Date;
  
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
  activeCategory: string;
  setActiveCategory: (id: string) => void;
  validation: FlowValidationResult;
}

export const EditorContext = createContext<EditorContextType | undefined>(undefined);

const STORAGE_KEY = "intake-studio-state-v3";
const PUBLISHED_KEY_PREFIX = "published_intake_";
const PUBLISHED_KEY = "intake:published:";

export function EditorProvider({ children, intakeId }: { children: ReactNode; intakeId?: string }) {
  const [sections, setSections] = useState<IntakeSection[]>([]);
  const [metadata, setMetadata] = useState<IntakeMetadata>({ 
    title: "Untitled Intake", 
    mode: "guided",
    theme: {
      accentColor: "#3b82f6",
      background: {
        type: "color",
        color: "#3b82f6",
      }
    }
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [edges, setEdges] = useState<any[]>([]); // Placeholder for edges, logic to be added
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isToolboxOpen, setToolboxOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState("structure");
  
  // Persistence state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | undefined>(undefined);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Compute validation
  const validation = useMemo(() => validateFlow(sections), [sections]);

  // Load Initial State
  useEffect(() => {
    async function load() {
      if (intakeId) {
        // Load from DB (no auth required for now)
        try {
          const res = await fetch(`/api/intakes/${intakeId}`);
          
          if (!res.ok) throw new Error("Failed to load intake");
          
          const intake = await res.json();
          const draft = intake.draft_json || {};
          
          if (draft.sections) setSections(draft.sections);
          else setSections(INITIAL_SECTIONS);
          
          if (draft.edges) setEdges(draft.edges);
          
          if (draft.metadata) setMetadata(draft.metadata);
          else setMetadata(prev => ({ ...prev, title: intake.title, slug: intake.slug }));
          
        } catch (err) {
          console.error("Error loading intake:", err);
          setSections(INITIAL_SECTIONS);
        }
      } else {
        // Load from LocalStorage (Legacy / Anon)
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                setSections(parsed);
                setMetadata(prev => ({ ...prev, title: "Untitled Intake" }));
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
      }
      setIsLoaded(true);
    }
    
    load();
  }, [intakeId]);

  // Save State (Debounced)
  useEffect(() => {
    if (!isLoaded) return;

    // LocalStorage (always sync for backup/anon)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sections, metadata }));

    // DB Save
    if (intakeId) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setIsSaving(true);
      
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const payload = {
              draft_json: { sections, metadata, edges },
              title: metadata.title,
              slug: metadata.slug,
          };
          
          await fetch(`/api/intakes/${intakeId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
          });
          setLastSaved(new Date());
        } catch (err) {
          console.error("Auto-save failed:", err);
        } finally {
          setIsSaving(false);
        }
      }, 1500); // 1.5s debounce
    }
  }, [sections, metadata, edges, isLoaded, intakeId]);

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
          edges,
          metadata: { ...metadata, slug, publishedAt: new Date().toISOString() },
          publishedAt: Date.now()
      };
      
      // 1. Local Persistence (Legacy / Offline)
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
                  alert("Publish failed: storage quota exceeded.");
                  return "";
              }
          }
      }

      // 2. DB Persistence (no auth required for now)
      if (intakeId) {
          try {
              await fetch(`/api/intakes/${intakeId}/publish`, {
                  method: "POST",
              });
          } catch (err) {
              console.error("Failed to publish to DB:", err);
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
        edges,
        metadata,
        selectedId,
        intakeId,
        isSaving,
        lastSaved,
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
        activeCategory,
        setActiveCategory,
        validation,
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
