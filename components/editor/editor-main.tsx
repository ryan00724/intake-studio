"use client";

import React from "react";
import { useEditor } from "@/hooks/use-editor";
import { EditorLayout } from "@/components/editor/editor-layout";
import { PreviewLayout } from "@/components/preview/preview-layout";
import { EditorHeader } from "@/components/editor/editor-header";

export function EditorMain() {
  const { isPreviewMode, metadata } = useEditor();

  if (isPreviewMode) {
    return <PreviewLayout />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-black">
        <EditorHeader />
        <EditorLayout />
    </div>
  );
}
