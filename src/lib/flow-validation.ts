import { IntakeSection, QuestionBlock, ImageChoiceBlock } from "@/types/editor";

export interface ValidationError {
  type: "error" | "warning";
  message: string;
  sectionId?: string;
  blockId?: string;
}

export interface ValidationStats {
  startSections: string[];
  endSections: string[];
  unreachableSections: string[];
  totalSections: number;
}

export interface FlowValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  stats: ValidationStats;
}

export function validateFlow(sections: IntakeSection[]): FlowValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  if (sections.length === 0) {
    return {
      isValid: false,
      errors: [{ type: "error", message: "Flow must have at least one section." }],
      warnings: [],
      stats: { startSections: [], endSections: [], unreachableSections: [], totalSections: 0 }
    };
  }

  // 1. Build Graph & Maps
  const sectionIds = new Set(sections.map(s => s.id));
  const incomingEdges: Record<string, string[]> = {};
  const outgoingEdges: Record<string, string[]> = {};
  
  sections.forEach(s => {
    incomingEdges[s.id] = [];
    outgoingEdges[s.id] = [];
  });

  // Populate edges from section.routing (and linear flow if applicable? 
  // For guided experience, linear flow is a fallback, but we should treat it as an implicit edge if NO routing exists?
  // Actually, standard guided flow implies linear progression if no explicit routing overrides. 
  // However, node-based editors usually explicitize this. 
  // The requirement says: "A start section is a section with NO incoming edges."
  // "An end section is a section with NO outgoing edges."
  // If we assume purely explicit routing from now on, or do we still support implicit linear?
  // The prompt implies a node-based view ("Sections are nodes, edges represent routing").
  // So we should validate based on *explicit* connections if possible, OR if linear fallback is still active, consider next index as default.
  // BUT the prompt says "Refactor section routing to be edge-based" was done. 
  // Let's check getOutgoingRoutes behavior. It has a fallback to linear progression if no routing rules match?
  // No, getOutgoingRoutes returns [] if no rules/edges. 
  // GuidedExperience.handleNext has "Default Linear Progression (Fallback)" at step 2.
  // So technically, every section *could* go to the next one implicitly.
  // However, "Publish Readiness" usually enforces *explicit* completeness or acknowledges the linear flow.
  // If we enforce strict graph logic, linear fallback might be confusing.
  // Let's stick to EXPLICIT routing for the validation to ensure the user configured what they see.
  // Or, if the user hasn't added any routing, maybe they intend linear?
  // Let's verify: "Rules: 1) Start section detection... 2) End section detection..."
  // This implies checking explicit structure.
  
  sections.forEach(section => {
    if (section.routing && section.routing.length > 0) {
      let anyCount = 0;
      section.routing.forEach(rule => {
        const target = rule.nextSectionId;
        if (sectionIds.has(target)) {
          outgoingEdges[section.id].push(target);
          incomingEdges[target].push(section.id);

          // 4. Conditional Integrity
          if (rule.operator === "any") {
              anyCount++;
          } else if (rule.fromBlockId) {
            // Existing equals check
            const block = section.blocks.find(b => b.id === rule.fromBlockId);
            if (!block) {
              errors.push({
                type: "error",
                message: "Routing rule references a missing question.",
                sectionId: section.id,
                blockId: rule.fromBlockId
              });
            } else {
              // Check type
              const isSelect = (block.type === "question" && block.inputType === "select") || block.type === "image_choice";
              if (!isSelect) {
                errors.push({
                  type: "error",
                  message: "Routing rule references a non-select block.",
                  sectionId: section.id,
                  blockId: block.id
                });
              } else {
                // Check value exists
                let options: string[] = [];
                if (block.type === "image_choice") {
                   options = (block as ImageChoiceBlock).options.map(o => o.id);
                } else if (block.type === "question") {
                   options = (block as QuestionBlock).options || [];
                }
                
                if (rule.value && !options.includes(rule.value)) {
                   errors.push({
                    type: "error",
                    message: `Routing condition value '${rule.value}' does not exist in options.`,
                    sectionId: section.id,
                    blockId: block.id
                  });
                }
              }
            }
          }
        }
      });

      if (anyCount > 1) {
          errors.push({
              type: "error",
              message: `Section has ${anyCount} fallback ('any') routes. Only one is allowed.`,
              sectionId: section.id
          });
      }
    }
  });

  // 1b. Block integrity checks
  sections.forEach(section => {
    const sectionLabel = section.title || "Untitled Section";
    section.blocks.forEach(block => {
      // book_call: must have valid http/https booking URL
      if (block.type === "book_call") {
        if (!block.bookingUrl) {
          errors.push({
            type: "error",
            message: `"Book a Call" block in "${sectionLabel}" is missing a booking URL.`,
            sectionId: section.id,
            blockId: block.id,
          });
        } else {
          try {
            const u = new URL(block.bookingUrl);
            if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
          } catch {
            errors.push({
              type: "error",
              message: `"Book a Call" block in "${sectionLabel}" has an invalid URL. Must be http:// or https://.`,
              sectionId: section.id,
              blockId: block.id,
            });
          }
        }
      }

      // link_preview: no publish-time errors needed (clients provide links at runtime).
      // Only warn if maxItems is set to 0 (likely a config mistake).
      if (block.type === "link_preview") {
        if (block.maxItems !== undefined && block.maxItems <= 0) {
          warnings.push({
            type: "warning",
            message: `"Link Preview" block in "${sectionLabel}" has max links set to ${block.maxItems}.`,
            sectionId: section.id,
            blockId: block.id,
          });
        }
      }
    });
  });

  // 2. Start Sections (In-degree 0)
  // Note: Section at index 0 is implicitly a start if we consider entry point? 
  // Usually the first section in the list is the entry point in GuidedExperience.
  // But strictly graph-wise:
  const startSections = sections.filter(s => incomingEdges[s.id].length === 0).map(s => s.id);
  
  if (startSections.length === 0) {
    // This implies a cycle covering everyone? Or everyone has incoming?
    // Since it's a DAG usually, this is rare unless full cycle.
    // Actually, if index 0 is always entry, maybe we should pin it?
    // But graph validation usually wants to confirm 0 is the logical start.
    // If we have a cycle A->B->A, no start.
    errors.push({ type: "error", message: "Flow has no clear start section (infinite loop likely)." });
  } else if (startSections.length > 1) {
    // Warning: Multiple starts
    // However, only sections[0] is typically rendered first. 
    // If sections[0] is NOT in startSections (meaning it has incoming edges), that's weird for an entry point.
    // Let's assume startSections includes sections[0] normally.
    warnings.push({ 
      type: "warning", 
      message: `Multiple start sections detected (${startSections.length}). Only the first one will be shown initially.`,
      sectionId: startSections[0] // just point to one
    });
  }

  // 3. End Sections (Out-degree 0)
  const endSections = sections.filter(s => outgoingEdges[s.id].length === 0).map(s => s.id);
  if (endSections.length === 0) {
    warnings.push({ type: "warning", message: "No end sections defined (flow might loop forever)." });
  }

  // 4. Reachability
  // BFS from effective start (sections[0] is the real entry point)
  const reachable = new Set<string>();
  const entryPoint = sections[0]?.id;
  
  if (entryPoint) {
    const queue = [entryPoint];
    reachable.add(entryPoint);
    
    while (queue.length > 0) {
      const curr = queue.shift()!;
      outgoingEdges[curr].forEach(next => {
        if (!reachable.has(next)) {
          reachable.add(next);
          queue.push(next);
        }
      });
    }
  }

  const unreachableSections = sections.filter(s => !reachable.has(s.id)).map(s => s.id);
  if (unreachableSections.length > 0) {
    warnings.push({ 
      type: "warning", 
      message: `${unreachableSections.length} section(s) are unreachable from the start.`,
      sectionId: unreachableSections[0]
    });
  }

  // 5. Cycles (DFS)
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  let hasCycle = false;

  function detectCycle(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    for (const neighbor of outgoingEdges[nodeId]) {
      if (!visited.has(neighbor)) {
        if (detectCycle(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  if (entryPoint) {
      // Just check from entry? Or all nodes? 
      // Checking reachable components is enough usually.
      // But let's check all unvisited to catch disconnected cycles too if needed, though reachable is more important.
      if (detectCycle(entryPoint)) {
          hasCycle = true;
      }
  }

  if (hasCycle) {
    warnings.push({ type: "warning", message: "This flow contains a loop." });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      startSections,
      endSections,
      unreachableSections,
      totalSections: sections.length
    }
  };
}
