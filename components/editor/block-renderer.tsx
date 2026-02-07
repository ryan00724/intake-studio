"use client";

import { IntakeBlock } from "@/types/editor";
import { ContextBlockCard } from "@/src/components/canvas/ContextBlockCard";
import { QuestionBlockCard } from "@/src/components/canvas/QuestionBlockCard";
import { ImageChoiceBlockCard } from "@/src/components/canvas/ImageChoiceBlockCard";
import { MoodboardBlockCard } from "@/src/components/canvas/MoodboardBlockCard";
import { ThisNotThisBlockCard } from "@/src/components/canvas/ThisNotThisBlockCard";
import { LinkPreviewBlockCard } from "@/src/components/canvas/LinkPreviewBlockCard";
import { BookCallBlockCard } from "@/src/components/canvas/BookCallBlockCard";

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

  if (block.type === "link_preview") {
    return <LinkPreviewBlockCard block={block} />;
  }

  if (block.type === "book_call") {
    return <BookCallBlockCard block={block} />;
  }

  return <QuestionBlockCard block={block} />;
}
