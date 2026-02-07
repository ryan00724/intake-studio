"use client";

import { EditorProvider } from "@/hooks/use-editor";
import { EditorMain } from "@/components/editor/editor-main";
import { use } from "react";

export default function DatabaseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  // In Next.js 15+, params is a Promise
  const { id } = use(params);

  return (
    <EditorProvider intakeId={id}>
      <EditorMain />
    </EditorProvider>
  );
}
