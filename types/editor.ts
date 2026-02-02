export type InputType = "short" | "long" | "select" | "multi" | "slider" | "date" | "file";

export type BlockType = "context" | "question" | "image_choice";

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface ImageChoiceOption {
  id: string;
  imageUrl: string;
  label?: string;
}

export interface ImageChoiceBlock extends BaseBlock {
  type: "image_choice";
  label: string;
  helperText?: string;
  required?: boolean;
  multi?: boolean;
  options: ImageChoiceOption[];
}

export interface ContextBlock extends BaseBlock {
  type: "context";
  text: string;
}

export interface QuestionBlock extends BaseBlock {
  type: "question";
  label: string;
  helperText?: string;
  required?: boolean;
  inputType: InputType;
  options?: string[]; // For select/multi
}

export type IntakeBlock = ContextBlock | QuestionBlock | ImageChoiceBlock;

export interface IntakeTheme {
    accentColor?: string;
    background?: {
        type: "none" | "color" | "image";
        color?: string;
        imageUrl?: string;
        overlayOpacity?: number;
        overlayColor?: string;
        blurPx?: number;
    };
}

export interface IntakeSectionStyle {
    color?: string;
    background?: {
        type: "none" | "color" | "image";
        color?: string;
        imageUrl?: string;
        overlayOpacity?: number;
        blurPx?: number;
    };
}

export interface IntakeSection {
  id: string;
  title: string;
  description?: string;
  blocks: IntakeBlock[];
  style?: IntakeSectionStyle;
}

export interface IntakeMetadata {
    title: string;
    description?: string; // Welcome text
    estimatedTime?: string; // e.g. "3-5 minutes"
    completionText?: string; // Closing message
    completionNextSteps?: string; // "What happens next" text
    completionButtonLabel?: string; // Optional CTA label
    completionButtonUrl?: string; // Optional CTA URL
    slug?: string;
    publishedAt?: string;
    mode?: "guided" | "document";
    theme?: IntakeTheme;
}

export interface EditorState {
  sections: IntakeSection[];
  metadata: IntakeMetadata;
  selectedId: string | null; // Can be section ID or block ID
}

export interface PublishedIntake {
    slug: string;
    sections: IntakeSection[];
    metadata: IntakeMetadata;
    publishedAt: number;
}
