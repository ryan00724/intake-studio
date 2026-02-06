import { EditorState, IntakeSection, IntakeEdge } from "@/types/editor";

export interface Route {
    targetSectionId: string;
    condition?: {
        fromBlockId: string;
        operator: "equals";
        value: string;
    };
}

/**
 * Retrieves outgoing navigation paths for a given section.
 * Prioritizes node-based edges if they exist in the editor state.
 * Falls back to legacy section.routing rules if no edges are present.
 */
export function getOutgoingRoutes(
    sections: IntakeSection[], 
    sectionId: string, 
    edges?: IntakeEdge[]
): Route[] {
    // 1. Primary: Use node-based edges if available
    if (edges && edges.length > 0) {
        // Filter edges originating from this section
        const matchingEdges = edges.filter(edge => edge.source === sectionId);
        
        if (matchingEdges.length > 0) {
            return matchingEdges.map(edge => ({
                targetSectionId: edge.target,
                condition: edge.condition
            }));
        }
    }

    // 2. Fallback: Legacy section.routing
    const section = sections.find(s => s.id === sectionId);
    if (section?.routing && section.routing.length > 0) {
        return section.routing.map(rule => ({
            targetSectionId: rule.nextSectionId,
            condition: {
                fromBlockId: rule.fromBlockId,
                operator: rule.operator,
                value: rule.value
            }
        }));
    }

    // No explicit routes defined
    return [];
}
