"use client";

import { IntakeBlock } from "@/types/editor";
import { ContextBlockCard } from "@/src/components/canvas/ContextBlockCard";
import { QuestionBlockCard } from "@/src/components/canvas/QuestionBlockCard";
import { ImageChoiceBlockCard } from "@/src/components/canvas/ImageChoiceBlockCard";
import { MoodboardBlockCard } from "@/src/components/canvas/MoodboardBlockCard";
import { ThisNotThisBlockCard } from "@/src/components/canvas/ThisNotThisBlockCard";

export function BlockRenderer({ block }: { block: IntakeBlock }) {
  if (block.type === "context") {
    return <ContextBlockCard block={block} />;
  }
  
  if (block.type === "image_choice") {
    return <ImageChoiceBlockCard block={block} />;
  }

  if (block.type === "image_moodboard") {
    return <MoodboardBlockCard block={block} />;
  }

  if (block.type === "this_not_this") {
    return <ThisNotThisBlockCard block={block} />;
  }

  return <QuestionBlockCard block={block} />;
}
