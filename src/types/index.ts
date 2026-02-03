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
  chatConversationMode?: string;
  chatTemplateIndex?: number;
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

export type Lang = "ja" | "en";

// Azure OpenAI Service configuration types
export type AzureOpenAIServiceConfig = {
  apiKey?: string;
  baseUrl?: string; // https://<resource-name>.openai.azure.com/
};

export type AzureOpenAIConfig = {
  image?: AzureOpenAIServiceConfig;
  tts?: AzureOpenAIServiceConfig;
  llm?: AzureOpenAIServiceConfig;
};

type LlmConfigOllama = { url: string; model: string };
type LlmConfigOpenAI = { model: string };
type LlmConfigGemini = { model: string };
type LlmConfigAnthropic = { model: string };
type LlmConfigGroq = { model: string };
type LlmConfigAzureOpenAI = { model: string }; // Azure OpenAI requires explicit model (deployment name)

export type LlmConfigs = {
  ollama?: LlmConfigOllama;
  openai?: LlmConfigOpenAI;
  gemini?: LlmConfigGemini;
  anthropic?: LlmConfigAnthropic;
  groq?: LlmConfigGroq;
  azureOpenai?: LlmConfigAzureOpenAI;
};

export type Settings = {
  APIKEY: Record<string, string>;
  USE_LANGUAGES: Record<string, boolean>;
  APP_LANGUAGE?: string;
  MAIN_LANGUAGE?: string;
  CHAT_LLM?: string;
  llmConfigs: LlmConfigs;
  USER_LEVEL: string;
  onboardProject: number;
  DARK_MODE?: string; // Backward compatible
  CHAT_CONVERSATION_MODE?: string;
  CHAT_TEMPLATE_INDEX?: number;
  AZURE_OPENAI?: AzureOpenAIConfig;
};

export type MediaType = "image" | "movie";

export type ProjectScriptMedia = {
  fileName: string;
  projectRelativePath: string;
  data: ArrayBuffer;
  mediaType: MediaType;
  mimeType: string;
};

export type BgmMetadata = {
  id: string;
  fileName: string;
  title: string;
  prompt: string;
  duration: string;
  createdAt: string;
};

export type MulmoTransition = {
  type:
    | "fade"
    | "slideout_left"
    | "slideout_right"
    | "slideout_up"
    | "slideout_down"
    | "slidein_left"
    | "slidein_right"
    | "slidein_up"
    | "slidein_down"
    | "wipeleft"
    | "wiperight"
    | "wipeup"
    | "wipedown"
    | "wipetl"
    | "wipetr"
    | "wipebl"
    | "wipebr";
  duration?: number;
};

export type MulmoMovieParams = {
  transition?: MulmoTransition;
  // Add other movieParams properties as needed
};
