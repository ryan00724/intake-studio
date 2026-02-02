"use client";

import { IntakeBlock } from "@/types/editor";
import { ContextBlockCard } from "@/src/components/canvas/ContextBlockCard";
import { QuestionBlockCard } from "@/src/components/canvas/QuestionBlockCard";
import { ImageChoiceBlockCard } from "@/src/components/canvas/ImageChoiceBlockCard";

export function BlockRenderer({ block }: { block: IntakeBlock }) {
  if (block.type === "context") {
    return <ContextBlockCard block={block} />;
  }
  
  if (block.type === "image_choice") {
    return <ImageChoiceBlockCard block={block} />;
  }

  return <QuestionBlockCard block={block} />;
}
