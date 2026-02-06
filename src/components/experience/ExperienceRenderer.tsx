import React from "react";
import { IntakeSection, IntakeTheme, IntakeEdge } from "@/types/editor";
import { PersonalizationParams } from "@/src/lib/experience/personalize";
import { GuidedExperience } from "./GuidedExperience";
import { DocumentExperience } from "./DocumentExperience";

interface ExperienceRendererProps {
  sections: IntakeSection[];
  edges?: IntakeEdge[];
  mode: "guided" | "document";
  personalization?: PersonalizationParams;
  title?: string;
  intro?: string;
  estimatedTime?: string;
  closingMessage?: string;
  completionNextSteps?: string;
  completionButtonLabel?: string;
  completionButtonUrl?: string;
  theme?: IntakeTheme;
}

export function ExperienceRenderer({
  sections,
  edges,
  mode,
  personalization,
  title,
  intro,
  estimatedTime,
  closingMessage,
  completionNextSteps,
  completionButtonLabel,
  completionButtonUrl,
  theme,
}: ExperienceRendererProps) {
  if (mode === "document") {
    return (
      <DocumentExperience
        sections={sections}
        personalization={personalization}
        title={title}
        intro={intro}
        theme={theme}
      />
    );
  }

  return (
    <GuidedExperience
      sections={sections}
      edges={edges}
      personalization={personalization}
      title={title}
      intro={intro}
      estimatedTime={estimatedTime}
      closingMessage={closingMessage}
      completionNextSteps={completionNextSteps}
      completionButtonLabel={completionButtonLabel}
      completionButtonUrl={completionButtonUrl}
      theme={theme}
    />
  );
}
