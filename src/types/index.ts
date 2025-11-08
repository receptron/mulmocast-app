import type { MulmoScript, MulmoPresentationStyle } from "mulmocast";
import type { ScriptEditorTab, MulmoViewerTab } from "../shared/constants";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ProjectMetadata = {
  id: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  sessionActive: boolean; // TODO: Move to appropriate location later
  hasErrors: boolean; // TODO: Move to appropriate location later
  chatMessages: ChatMessage[];
  useCache?: boolean;
  presentationStyle?: MulmoPresentationStyle;
  scriptEditorActiveTab: ScriptEditorTab;
  mulmoViewerActiveTab?: MulmoViewerTab;
};
export type Project = {
  metadata: ProjectMetadata;
  script: Partial<MulmoScript> | null;
  isValid?: boolean;
};

export type MulmoProgressLog<T = unknown> = {
  projectId: string;
  type: string;
  data: T;
};

export type MulmoError = {
  beats: Record<string, string[]>;
  script: Record<string, string[]>;
  lang: string[];
  canvasSize: string[];
  speechParams: string[];
  imageParams: string[];
  movieParams: string[];
  soundEffectParams: string[];
  lipSyncParams: string[];
  htmlImageParams: string[];
  textSlideParams: string[];
  captionParams: string[];
  audioParams: string[];
};

export type UserLevel = "beginner" | "semiPro" | "pro";
