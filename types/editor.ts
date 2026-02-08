export type InputType = "short" | "long" | "select" | "multi" | "slider" | "date" | "file";

export type BlockType = "context" | "question" | "image_choice" | "image_moodboard" | "this_not_this" | "link_preview" | "book_call" | "heading" | "divider" | "image_display" | "video_embed" | "quote";

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface ThisNotThisItem {
  id: string;
  imageUrl: string;
  caption?: string;
}

export interface ThisNotThisBlock extends BaseBlock {
  type: "this_not_this";
  label: string;
  helperText?: string;
  items: ThisNotThisItem[];
}

export interface ImageMoodboardItem {
  id: string;
  imageUrl: string;
  caption?: string;
}

export interface ImageMoodboardBlock extends BaseBlock {
  type: "image_moodboard";
  label: string;
  helperText?: string;
  items: ImageMoodboardItem[];
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

export interface LinkPreviewItem {
  id: string;
  url: string;
  title?: string;
  description?: string;
  image?: string;
  screenshot?: string;
  domain?: string;
}

export interface LinkPreviewBlock extends BaseBlock {
  type: "link_preview";
  label: string;
  helperText?: string;
  required?: boolean;
  maxItems?: number;
}

export interface BookCallBlock extends BaseBlock {
  type: "book_call";
  title?: string;
  text?: string;
  bookingUrl: string;
  buttonLabel?: string;
  openInNewTab?: boolean;
  requiredToContinue?: boolean;
}

export interface HeadingBlock extends BaseBlock {
  type: "heading";
  text: string;
  level: "h1" | "h2" | "h3";
}

export interface DividerBlock extends BaseBlock {
  type: "divider";
  style: "solid" | "dashed" | "dotted";
}

export interface ImageDisplayBlock extends BaseBlock {
  type: "image_display";
  imageUrl: string;
  alt?: string;
  caption?: string;
}

export interface VideoEmbedBlock extends BaseBlock {
  type: "video_embed";
  videoUrl: string;
  caption?: string;
}

export interface QuoteBlock extends BaseBlock {
  type: "quote";
  text: string;
  attribution?: string;
}

export type IntakeBlock = ContextBlock | QuestionBlock | ImageChoiceBlock | ImageMoodboardBlock | ThisNotThisBlock | LinkPreviewBlock | BookCallBlock | HeadingBlock | DividerBlock | ImageDisplayBlock | VideoEmbedBlock | QuoteBlock;

export interface IntakeTheme {
    accentColor?: string;
    cardBackgroundColor?: string;
    fontColor?: string;
    background?: {
        type: "none" | "color" | "image" | "video" | "gradient" | "pattern" | "animated_gradient";
        color?: string;
        imageUrl?: string;
        videoUrl?: string;
        overlayOpacity?: number;
        overlayColor?: string;
        blurPx?: number;
        audioEnabled?: boolean;
        gradientPreset?: string;
        patternType?: string;
        patternColor?: string;
        patternBgColor?: string;
        animatedGradientColors?: string[];
        animatedGradientSpeed?: number;
    };
}

export interface IntakeSectionStyle {
    color?: string;
    background?: {
        type: "none" | "color" | "image" | "video" | "gradient" | "pattern" | "animated_gradient";
        color?: string;
        imageUrl?: string;
        videoUrl?: string;
        overlayOpacity?: number;
        overlayColor?: string;
        blurPx?: number;
        audioEnabled?: boolean;
        gradientPreset?: string;
        patternType?: string;
        patternColor?: string;
        patternBgColor?: string;
        animatedGradientColors?: string[];
        animatedGradientSpeed?: number;
    };
}

export interface SectionRouteRule {
    id: string;
    fromBlockId?: string;
    operator: "equals" | "any";
    value?: string;
    nextSectionId: string;
}

export interface IntakeSection {
  id: string;
  title: string;
  description?: string;
  blocks: IntakeBlock[];
  style?: IntakeSectionStyle;
  routing?: SectionRouteRule[];
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
    colorMode?: "light" | "dark"; // Deploy in light or dark mode
    theme?: IntakeTheme;
}

export interface IntakeEdge {
  id: string;
  source: string;
  target: string;
  condition?: {
    fromBlockId?: string;
    operator: "equals" | "any";
    value?: string;
  };
}

export interface EditorState {
  sections: IntakeSection[];
  edges?: IntakeEdge[];
  metadata: IntakeMetadata;
  selectedId: string | null; // Can be section ID, block ID, or edge ID (prefixed with "edge:")
}

export interface PublishedIntake {
    slug: string;
    sections: IntakeSection[];
    edges?: IntakeEdge[];
    metadata: IntakeMetadata;
    publishedAt: number;
}

export interface Submission {
    id: string;
    intake_id: string;
    answers: Record<string, any>;
    metadata: Record<string, any>;
    created_at: string;
}
