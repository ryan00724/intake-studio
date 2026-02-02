import { IntakeSection } from "@/types/editor";

export const INITIAL_SECTIONS: IntakeSection[] = [
  {
    id: "section-1",
    title: "Untitled Section",
    description: "Section description",
    blocks: [],
  },
];

export const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15);
};
