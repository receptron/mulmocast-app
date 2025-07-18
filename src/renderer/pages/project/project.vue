<template>
  <Layout>
    <TooltipProvider>
      <div :class="`max-w-[95%] mx-auto ${getCardPadding} ${getContainerSpacing}`">
        <!-- Developer Mode Toggle - Always at the top -->
        <div class="bg-gray-50 dark:bg-gray-900 border rounded-lg p-3" v-if="false">
          <div class="flex items-center justify-between space-x-2 text-sm">
            <div class="flex items-center space-x-2">
              <Settings :size="16" />
              <span>Developer Mode</span>
            </div>
            <Switch v-model="isDevMode" />
          </div>
          <div v-if="isDevMode" class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div class="space-y-2">
              <span class="text-sm font-medium">Design Theme</span>
              <RadioGroup v-model="selectedTheme" class="grid grid-cols-2 gap-2 text-sm">
                <div v-for="option in themeOptions" :key="option.value" class="flex items-center space-x-2">
                  <RadioGroupItem :value="option.value" :id="option.value" />
                  <Label :for="option.value">{{ option.label }}</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        <!-- Header Section -->
        <div v-if="hasProjectData" class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <RouterLink to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft :size="16" class="mr-2" />
                Back
              </Button>
            </RouterLink>
            <div>
              <h1 :class="`font-bold ${getHeaderSize}`">
                {{ project?.title }}
              </h1>
              <p :class="`text-gray-600 ${selectedTheme === 'compact' ? 'text-sm' : ''}`">{{ project?.description }}</p>
            </div>
          </div>
          <div v-if="isDevelopment">
            <Button variant="outline" size="sm" @click="openProjectFolder">
              <FolderOpen :size="16" class="mr-1" />
              Open Project Folder
            </Button>
          </div>
        </div>

        <!-- 3 Split Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-[30%_40%_1fr] gap-4 h-auto lg:h-[calc(100vh-180px)]">
          <!-- Left Column - AI Chat -->
          <div class="h-full overflow-y-auto pr-2">
            <Card
              :class="`bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 h-full flex flex-col ${getTimelineFocusClass}`"
            >
              <CardHeader :class="`flex-shrink-0 ${selectedTheme === 'compact' ? 'pb-3' : ''}`">
                <CardTitle
                  :class="`flex items-center space-x-2 text-blue-700 ${selectedTheme === 'compact' ? 'text-base' : ''}`"
                >
                  <component :is="selectedTheme === 'beginner' ? Bot : Lightbulb" :size="20" />
                  <span>
                    {{ selectedTheme === "beginner" ? "AI Assistant Chat" : "AI-Powered MulmoScript Generation Guide" }}
                  </span>
                </CardTitle>
                <p :class="`text-blue-600 ${selectedTheme === 'compact' ? 'text-xs' : 'text-sm'}`">
                  {{
                    selectedTheme === "beginner"
                      ? "Let's Create Scripts Through Conversation with AI Assistants"
                      : "Use ChatGPT or other AI tools to generate your Script content with these proven prompts"
                  }}
                </p>
              </CardHeader>
              <CardContent
                :class="`flex-1 flex flex-col overflow-hidden ${selectedTheme === 'compact' ? 'pt-0' : ''}`"
                v-if="project"
              >
                <component
                  :is="selectedTheme === 'beginner' ? Chat : PromptGuide"
                  :selectedTheme="selectedTheme"
                  :initialMessages="project?.chatMessages"
                  @update:updateChatMessages="handleUpdateChatMessages"
                  @update:updateMulmoScript="handleUpdateScript"
                  class="h-full flex flex-col"
                />
              </CardContent>
            </Card>
          </div>

          <!-- Middle Column - Script Editor -->
          <div class="h-full">
            <Collapsible v-if="hasProjectData" v-model:open="isScriptViewerOpen" class="h-full">
              <Card class="h-full flex flex-col">
                <CardHeader class="flex-shrink-0">
                  <div class="flex items-center justify-between">
                    <CollapsibleTrigger as-child>
                      <CardTitle class="flex items-center space-x-2 cursor-pointer">
                        <Code2 :size="20" />
                        <span>Script</span>
                      </CardTitle>
                    </CollapsibleTrigger>
                    <div class="flex items-center space-x-2">
                      <!-- Validation Status -->
                      <div class="flex items-center space-x-2">
                        <div v-if="isValidScriptData" class="group relative">
                          <CheckCircle :size="16" class="text-green-500 group-hover:text-green-600 cursor-pointer" />
                          <span
                            class="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
                          >
                            Validation Status
                          </span>
                        </div>
                        <XCircle v-if="!isValidScriptData" :size="16" class="text-red-500" />
                        <span v-if="!isValidScriptData" class="text-sm text-gray-600">
                          {{ validationMessage }}
                        </span>
                      </div>
                      <!-- Undo/Redo buttons -->
                      <Button
                        variant="ghost"
                        size="sm"
                        :disabled="!mulmoScriptHistoryStore.undoable"
                        @click="mulmoScriptHistoryStore.undo"
                      >
                        <Undo :size="16" :class="mulmoScriptHistoryStore.undoable ? 'text-black' : 'text-gray-400'" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        :disabled="!mulmoScriptHistoryStore.redoable"
                        @click="mulmoScriptHistoryStore.redo"
                      >
                        <Redo :size="16" :class="mulmoScriptHistoryStore.redoable ? 'text-black' : 'text-gray-400'" />
                      </Button>
                      <!-- Collapse/Expand Button -->
                      <CollapsibleTrigger as-child>
                        <Button variant="ghost" size="sm">
                          <component :is="isScriptViewerOpen ? ChevronUp : ChevronDown" :size="16" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent
                  :class="`transition-all duration-300 overflow-hidden flex-1 ${
                    isScriptViewerOpen ? 'h-full' : 'max-h-[180px]'
                  }`"
                >
                  <CardContent class="h-full">
                    <ScriptEditor
                      :mulmoValue="mulmoScriptHistoryStore.currentMulmoScript ?? {}"
                      :imageFiles="imageFiles"
                      :movieFiles="movieFiles"
                      :audioFiles="audioFiles"
                      :scriptEditorActiveTab="project?.scriptEditorActiveTab"
                      @update:mulmoValue="mulmoScriptHistoryStore.updateMulmoScript"
                      :isValidScriptData="isValidScriptData"
                      @update:isValidScriptData="(val) => (isValidScriptData = val)"
                      @generateImage="generateImage"
                      @generateAudio="generateAudio"
                      @formatAndPushHistoryMulmoScript="formatAndPushHistoryMulmoScript"
                      @positionUp="positionUp"
                      @addBeat="addBeat"
                      @deleteBeat="deleteBeat"
                      @update:scriptEditorActiveTab="handleUpdateScriptEditorActiveTab"
                      :mulmoError="mulmoError"
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          <!-- Right Column - Output & Product -->
          <div class="space-y-4 overflow-y-auto pl-2">
            <!-- Output Section -->
            <Card v-if="hasProjectData">
              <CardHeader>
                <CardTitle class="flex items-center space-x-2">
                  <Settings :size="20" />
                  <span>Output Settings & Generation</span>
                </CardTitle>
              </CardHeader>
              <CardContent class="p-4">
                <div class="space-y-6">
                  <!-- General Settings -->
                  <div class="border rounded-lg p-4 bg-gray-50">
                    <h3 class="text-sm font-medium mb-4">General Settings</h3>
                    <div class="space-y-4">
                      <!-- Cache Toggle -->
                      <div class="flex items-center justify-between p-4 bg-white rounded-lg">
                        <div class="flex flex-col">
                          <Label for="cache-toggle" class="text-sm font-medium"> Use Cache </Label>
                          <p class="text-xs text-gray-500 mt-1">Enable caching for faster output generation</p>
                        </div>
                        <Switch
                          id="cache-toggle"
                          :model-value="project?.useCache ?? false"
                          @update:model-value="saveCacheEnabled"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Output Buttons -->
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      class="flex flex-col items-center space-y-2 h-auto py-4 whitespace-normal"
                      @click="generateMovie"
                      :disabled="mulmoEventStore.isArtifactGenerating[projectId]"
                    >
                      <Monitor :size="24" />
                      <span>Generate Movie</span>
                    </Button>
                    <Button
                      class="flex flex-col items-center space-y-2 h-auto py-4 whitespace-normal"
                      :disabled="mulmoEventStore.isArtifactGenerating[projectId]"
                    >
                      <FileText :size="24" />
                      <span>Generate PDF</span>
                    </Button>
                    <Button
                      class="flex flex-col items-center space-y-2 h-auto py-4 whitespace-normal"
                      @click="generatePodcast"
                      :disabled="mulmoEventStore.isArtifactGenerating[projectId]"
                    >
                      <Globe :size="24" />
                      <span>Generate Podcast</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Beats Viewer Section -->
            <Collapsible v-if="false" v-model:open="isBeatsViewerOpen">
              <Card>
                <CardHeader>
                  <div class="flex items-center justify-between">
                    <CardTitle class="flex items-center space-x-2">
                      <Play :size="20" />
                      <span>Beats</span>
                      <Badge variant="secondary" class="ml-2"> {{ beatsData.length }} beats </Badge>
                    </CardTitle>
                    <CollapsibleTrigger as-child>
                      <Button variant="ghost" size="sm">
                        <component :is="isBeatsViewerOpen ? ChevronUp : ChevronDown" :size="16" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    <BeatsViewer
                      :beatsData="beatsData || {}"
                      :audioFiles="audioFiles"
                      v-model:viewMode="beatsViewMode"
                      v-model:currentBeatIndex="currentBeatIndex"
                      v-model:timelinePosition="timelinePosition"
                      v-model:isPreviewAreaVisible="isPreviewAreaVisible"
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            <!-- Product Section -->
            <Card v-if="hasProjectData">
              <CardHeader>
                <CardTitle class="flex items-center space-x-2">
                  <Play :size="20" />
                  <span>Product</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductTabs :videoUrl="videoUrl" @playVideo="playVideo" />
              </CardContent>
            </Card>

            <!-- Debug Log Section -->
            <Card>
              <CardContent class="p-4 space-y-4">
                <!-- System Logs -->
                <div class="p-4 bg-gray-50 rounded-lg">
                  <h3 class="text-sm font-medium mb-2">Validate Logs</h3>
                  <div class="h-40 overflow-y-auto text-xs font-mono bg-white p-2 border rounded">
                    <div v-for="(entry, i) in validateLog" :key="'system-' + i" class="whitespace-pre-wrap">
                      {{ entry }}
                    </div>
                  </div>
                </div>
                <!-- Debug Logs -->
                <div class="p-4 bg-gray-50 rounded-lg">
                  <h3 class="text-sm font-medium mb-2">Debug Logs</h3>
                  <div class="h-40 overflow-y-auto text-xs font-mono bg-white p-2 border rounded" ref="logContainer">
                    <div v-for="(entry, i) in debugLog" :key="'debug-' + i" class="whitespace-pre-wrap">
                      {{ entry }}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, defineComponent, h, markRaw } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { isNull } from "graphai/lib/utils/utils";
import { useRoute, useRouter } from "vue-router";

import { projectApi, type ProjectMetadata } from "@/lib/project_api";
import { arrayPositionUp, arrayInsertAfter, arrayRemoveAt } from "@/lib/array";
import {
  ArrowLeft,
  Code2,
  FileText,
  Settings,
  Play,
  Undo,
  Redo,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Monitor,
  Globe,
  Lightbulb,
  Bot,
  FolderOpen,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator"; // Will be used for mobile layout
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Import sub-components (to be created)
import Layout from "@/components/layout.vue";
import Chat from "./components/chat.vue";
import PromptGuide from "./components/prompt_guide.vue";
import ScriptEditor from "./components/script_editor.vue";
import BeatsViewer from "./components/beats_viewer.vue";
import ProductTabs from "./components/product_tabs.vue";
import ConcurrentTaskStatus from "./components/concurrent_task_status.vue";
import dayjs from "dayjs";

import { mulmoScriptSchema, type MulmoScript } from "mulmocast/browser";

import { useMulmoEventStore, useMulmoScriptHistoryStore, useGraphAIDebugLogStore } from "../../store";

import {
  selectedTheme,
  themeOptions,
  isScriptViewerOpen,
  isBeatsViewerOpen,
  beatsViewMode,
  getCardPadding,
  getHeaderSize,
  getContainerSpacing,
  getTimelineFocusClass,
} from "./composable/style";
import { ChatMessage, MulmoError } from "@/types";
import { type ScriptEditorTab } from "../../../shared/constants";
import { notifySuccess, notifyProgress } from "@/lib/notification";

import { zodError2MulmoError } from "../../lib/error";

// State
const route = useRoute();
const router = useRouter();

const mulmoEventStore = useMulmoEventStore();
const mulmoScriptHistoryStore = useMulmoScriptHistoryStore();

const projectId = computed(() => route.params.id as string);
const project = ref<ProjectMetadata | null>(null);

const hasProjectData = computed(() => true); // Todo

const isDevMode = ref(false);
const isDevelopment = import.meta.env.DEV;

const graphAIDebugStore = useGraphAIDebugLogStore();

const validationMessage = ref("");

const currentBeatIndex = ref(0);
const timelinePosition = ref(0);
const isPreviewAreaVisible = ref(false);

// Load project data on mount
onMounted(async () => {
  try {
    project.value = await projectApi.getProjectMetadata(projectId.value);
    mulmoScriptHistoryStore.initMulmoScript(await projectApi.getProjectMulmoScript(projectId.value));
  } catch (error) {
    console.error("Failed to load project:", error);
    router.push("/");
  }
});

const handleUpdateScript = (script: MulmoScript) => {
  mulmoScriptHistoryStore.updateMulmoScript(script);
  isScriptViewerOpen.value = true;
  notifySuccess("Script created successfully 🎉");
};

const saveProjectMetadata = useDebounceFn(async (project: ProjectMetadata) => {
  await projectApi.saveProjectMetadata(projectId.value, {
    ...project,
    updatedAt: dayjs().toISOString(),
  });
}, 1000);

const handleUpdateChatMessages = (messages: ChatMessage[]) => {
  project.value.chatMessages = messages;
  saveProjectMetadata(project.value);
};

const saveCacheEnabled = (enabled: boolean) => {
  project.value.useCache = enabled;
  saveProjectMetadata(project.value);
};

const handleUpdateScriptEditorActiveTab = (tab: ScriptEditorTab) => {
  project.value.scriptEditorActiveTab = tab;
  saveProjectMetadata(project.value);
};

const saveMulmo = async (data: MulmoScript) => {
  console.log("saved", data);
  await projectApi.saveProjectScript(projectId.value, mulmoScriptHistoryStore.currentMulmoScript);
  project.value.updatedAt = dayjs().toISOString();
  await projectApi.saveProjectMetadata(projectId.value, project.value);
};
const saveMulmoScript = useDebounceFn(saveMulmo, 1000);

watch(
  () => mulmoScriptHistoryStore.currentMulmoScript,
  () => {
    // Be careful not to save a page just by opening it.
    saveMulmoScript(mulmoScriptHistoryStore.currentMulmoScript);
  },
  { deep: true },
);

const beatsData = computed(() => mulmoScriptHistoryStore.currentMulmoScript?.beats ?? []);

const mulmoError = computed<MulmoError>(() => {
  const zodError = mulmoScriptSchema.safeParse(mulmoScriptHistoryStore.currentMulmoScript);
  if (!zodError.success) {
    return zodError2MulmoError(zodError.error);
  }
  return null;
});

const formatAndPushHistoryMulmoScript = () => {
  const data = mulmoScriptSchema.safeParse(mulmoScriptHistoryStore.currentMulmoScript);
  if (data.success) {
    data.data.beats.map((beat) => {
      if (isNull(beat.id)) {
        beat.id = crypto.randomUUID();
      }
      return beat;
    });
    mulmoScriptHistoryStore.updateMulmoScriptAndPushToHistory(data.data);
    // push store //
  }
  console.log(data);
};

const ConcurrentTaskStatusMessageComponent = markRaw(
  defineComponent({
    setup() {
      return () => h(ConcurrentTaskStatus, { projectId: projectId.value });
    },
  }),
);

const generateMovie = async () => {
  notifyProgress(window.electronAPI.mulmoHandler("mulmoActionRunner", projectId.value, "movie"), {
    loadingMessage: ConcurrentTaskStatusMessageComponent,
    successMessage: "Movie generated successfully",
    errorMessage: "Failed to generate movie",
  });
};

const generatePodcast = async () => {
  notifyProgress(window.electronAPI.mulmoHandler("mulmoActionRunner", projectId.value, "audio"), {
    loadingMessage: ConcurrentTaskStatusMessageComponent,
    successMessage: "Podcast generated successfully",
    errorMessage: "Failed to generate podcast",
  });
};

const openProjectFolder = async () => {
  await projectApi.openProjectFolder(projectId.value);
};

const generateImage = async (index: number, target: string) => {
  await saveMulmo(mulmoScriptHistoryStore.currentMulmoScript);
  notifyProgress(window.electronAPI.mulmoHandler("mulmoImageGenerate", projectId.value, index, target), {
    loadingMessage: ConcurrentTaskStatusMessageComponent,
    successMessage: "Image generated successfully",
    errorMessage: "Failed to generate image",
  });
};

const generateAudio = async (index: number) => {
  notifyProgress(window.electronAPI.mulmoHandler("mulmoAudioGenerate", projectId.value, index), {
    loadingMessage: ConcurrentTaskStatusMessageComponent,
    successMessage: "Audio generated successfully",
    errorMessage: "Failed to generate audio",
  });
};

const bufferToUrl = (buffer: Buffer, mimeType: string) => {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  return url;
};

const audioFiles = ref<(string | null)[]>([]);
const imageFiles = ref<(string | null)[]>([]);
const movieFiles = ref<(string | null)[]>([]);

const positionUp = (index: number) => {
  imageFiles.value = arrayPositionUp<string | null>(imageFiles.value, index);
  movieFiles.value = arrayPositionUp<string | null>(movieFiles.value, index);
  audioFiles.value = arrayPositionUp<string | null>(audioFiles.value, index);
};

const addBeat = (index: number) => {
  imageFiles.value = arrayInsertAfter<string | null>(imageFiles.value, index, null);
  movieFiles.value = arrayInsertAfter<string | null>(movieFiles.value, index, null);
  audioFiles.value = arrayInsertAfter<string | null>(audioFiles.value, index, null);
};
const deleteBeat = (index: number) => {
  imageFiles.value = arrayRemoveAt<string | null>(imageFiles.value, index);
  movieFiles.value = arrayRemoveAt<string | null>(movieFiles.value, index);
  audioFiles.value = arrayRemoveAt<string | null>(audioFiles.value, index);
};

const downloadAudioFiles = async () => {
  console.log("audioFiles");
  const res: Buffer[] = await window.electronAPI.mulmoHandler("mulmoAudioFiles", projectId.value);
  audioFiles.value = res.map((buffer) => {
    if (buffer) {
      return bufferToUrl(buffer, "audio/mp3");
    }
    return "";
  });
};

const downloadImageFiles = async () => {
  const res: { imageData?: Buffer; movieData?: Buffer }[] = await window.electronAPI.mulmoHandler(
    "mulmoImageFiles",
    projectId.value,
  );
  imageFiles.value = res.map((data) => {
    if (data && data.imageData) {
      return bufferToUrl(data.imageData, "image/png");
    }
    return "";
  });
  movieFiles.value = res.map((data) => {
    if (data && data.movieData) {
      return bufferToUrl(data.movieData, "video/mp4");
    }
    return "";
  });
};
downloadAudioFiles();
downloadImageFiles();

const isValidScriptData = ref(true);

const logContainer = ref<HTMLElement | null>(null);
const validateLog = computed(() => {
  // mulmoScriptSchema.parse(mulmoScriptHistoryStore.currentMulmoScript)
  return [];
});

const videoUrl = ref("");
const playVideo = async (callback?: () => void) => {
  const buffer: Buffer = await window.electronAPI.mulmoHandler("downloadFile", projectId.value, "movie");
  videoUrl.value = bufferToUrl(buffer, "video/mp4");
  if (callback) {
    callback();
  }
};

watch(
  () => mulmoEventStore.mulmoEvent[projectId.value],
  async (mulmoEvent) => {
    // session
    if (mulmoEvent && mulmoEvent.kind === "session" && mulmoEvent.sessionType === "video" && !mulmoEvent.inSession) {
      playVideo();
    }
    // beats
    if (
      mulmoEvent &&
      mulmoEvent.kind === "beat" &&
      ["image", "movie", "html"].includes(mulmoEvent.sessionType) &&
      !mulmoEvent.inSession
    ) {
      const data: { imageData?: Buffer; movieData?: Buffer } = await window.electronAPI.mulmoHandler(
        "mulmoImageFile",
        projectId.value,
        mulmoEvent.index,
      );
      if (data && data.imageData) {
        imageFiles.value[mulmoEvent.index] = bufferToUrl(data.imageData, "image/png");
      }
      if (data && data.movieData) {
        movieFiles.value[mulmoEvent.index] = bufferToUrl(data.movieData, "video/mp4");
      }
    }
    if (mulmoEvent && mulmoEvent.kind === "beat" && mulmoEvent.sessionType === "audio" && !mulmoEvent.inSession) {
      const res: Buffer = await window.electronAPI.mulmoHandler("mulmoAudioFile", projectId.value, mulmoEvent.index);
      if (res) {
        audioFiles.value[mulmoEvent.index] = bufferToUrl(res, "audio/mp3");
      }
    }
    console.log(mulmoEvent);
  },
  { immediate: true },
);

const debugLog = computed(() => graphAIDebugStore.graphaiDebugLog[projectId.value]);

watch(
  () => debugLog,
  () => {
    logContainer.value?.scrollTo({ top: logContainer.value.scrollHeight });
  },
  { deep: true },
);
</script>
