"use client";

import { EditorProvider, useEditor } from "@/hooks/use-editor";
import { EditorLayout } from "@/components/editor/editor-layout";
import { PreviewLayout } from "@/components/preview/preview-layout";
import { EditorHeader } from "@/components/editor/editor-header";

function PageContent() {
  const { isPreviewMode } = useEditor();

  if (isPreviewMode) {
    return <PreviewLayout />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
        <EditorHeader />
        <EditorLayout />
    </div>
  );
}

export default function Home() {
  return (
    <EditorProvider>
      <PageContent />
    </EditorProvider>
  );
}
