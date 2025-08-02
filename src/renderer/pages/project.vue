<template>
  <Layout>
    <TooltipProvider>
      <div :class="`mx-auto max-w-[95%] ${getCardPadding} ${getContainerSpacing}`">
        <!-- Developer Mode Toggle - Always at the top -->
        <div class="rounded-lg border bg-gray-50 p-3 dark:bg-gray-900" v-if="false">
          <div class="flex items-center justify-between space-x-2 text-sm">
            <div class="flex items-center space-x-2">
              <Settings :size="16" />
              <span>Developer Mode</span>
            </div>
            <Switch v-model="isDevMode" />
          </div>
          <div v-if="isDevMode" class="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
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
        <ProjectHeader
          v-if="hasProjectData"
          :mulmoScript="mulmoScriptHistoryStore.currentMulmoScript"
          :selectedTheme="selectedTheme"
          :getHeaderSize="getHeaderSize"
          :isDevelopment="isDevelopment"
          @openProjectFolder="openProjectFolder"
          @updateMulmoScript="handleUpdateScriptFromHeader"
        />

        <!-- 3 Split Layout -->
        <div class="relative grid h-auto grid-cols-1 gap-4 lg:h-[calc(100vh-180px)]" :class="gridLayoutClass">
          <!-- Left Column - AI Chat -->
          <div
            class="h-full overflow-y-auto pr-2"
            :class="{ 'lg:block': isLeftColumnOpen, 'lg:hidden': !isLeftColumnOpen }"
          >
            <Card
              :class="`flex h-full flex-col border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 ${getTimelineFocusClass}`"
            >
              <CardHeader :class="`flex-shrink-0 ${selectedTheme === 'compact' ? 'pb-3' : ''}`">
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle
                      :class="`flex items-center space-x-2 text-blue-700 ${selectedTheme === 'compact' ? 'text-base' : ''}`"
                    >
                      <component :is="selectedTheme === 'beginner' ? Bot : Lightbulb" :size="20" />
                      <span>
                        {{ t(selectedTheme === "beginner" ? "panels.aiAssistantChat" : "panels.aiPoweredGuide") }}
                      </span>
                    </CardTitle>
                    <p :class="`text-blue-600 ${selectedTheme === 'compact' ? 'text-xs' : 'text-sm'}`">
                      {{
                        t(selectedTheme === "beginner" ? "panels.beginnerDescription" : "panels.advancedDescription")
                      }}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" @click="isLeftColumnOpen = false" class="hidden lg:inline-flex">
                    <PanelLeftClose :size="16" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent
                :class="`flex flex-1 flex-col overflow-hidden ${selectedTheme === 'compact' ? 'pt-0' : ''}`"
                v-if="projectMetadata"
              >
                <component
                  :is="selectedTheme === 'beginner' ? Chat : PromptGuide"
                  :selectedTheme="selectedTheme"
                  :messages="projectMetadata?.chatMessages"
                  @update:updateChatMessages="handleUpdateChatMessages"
                  @update:updateMulmoScript="handleUpdateScript"
                  class="flex h-full flex-col"
                />
              </CardContent>
            </Card>
          </div>

          <!-- Left Column - Collapsed State -->
          <div v-if="!isLeftColumnOpen" class="hidden h-full w-[48px] border-r border-gray-200 bg-gray-100 lg:flex">
            <button
              @click="isLeftColumnOpen = true"
              class="flex h-full w-full flex-col items-center p-2 transition-colors hover:bg-gray-200"
              :aria-label="t('panels.openAiChat')"
              :title="t('panels.openAiChat')"
            >
              <PanelLeftOpen :size="16" class="mt-2 mb-4 text-gray-600" />
              <Bot :size="20" class="mb-2 text-blue-700" />
              <span class="writing-mode-vertical text-sm text-gray-600">{{ t("panels.aiAssistantChat") }}</span>
            </button>
          </div>

          <!-- Middle Column - Script Editor -->
          <div class="h-full">
            <Collapsible v-if="hasProjectData" v-model:open="isScriptViewerOpen" class="h-full">
              <Card class="flex h-full flex-col">
                <CardHeader class="flex-shrink-0">
                  <div class="flex items-center justify-between">
                    <CollapsibleTrigger as-child>
                      <CardTitle class="flex cursor-pointer items-center space-x-2">
                        <Code2 :size="20" />
                        <span>Script</span>
                      </CardTitle>
                    </CollapsibleTrigger>
                    <div class="flex items-center space-x-2">
                      <!-- Validation Status -->
                      <div class="flex items-center space-x-2">
                        <div v-if="isValidScriptData" class="group relative">
                          <CheckCircle :size="16" class="cursor-pointer text-green-500 group-hover:text-green-600" />
                          <span
                            class="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
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
                  :class="`flex-1 overflow-hidden transition-all duration-300 ${
                    isScriptViewerOpen ? 'h-full' : 'max-h-[180px]'
                  }`"
                >
                  <CardContent class="h-full">
                    <ScriptEditor
                      :mulmoValue="mulmoScriptHistoryStore.currentMulmoScript ?? {}"
                      :imageFiles="imageFiles"
                      :movieFiles="movieFiles"
                      :audioFiles="audioFiles"
                      :scriptEditorActiveTab="projectMetadata?.scriptEditorActiveTab"
                      @update:mulmoValue="mulmoScriptHistoryStore.updateMulmoScript"
                      :isValidScriptData="isValidScriptData"
                      @update:isValidScriptData="(val) => (isValidScriptData = val)"
                      @generateImage="generateImage"
                      @formatAndPushHistoryMulmoScript="formatAndPushHistoryMulmoScript"
                      @positionUp="positionUp"
                      @addBeat="addBeat"
                      @deleteBeat="deleteBeat"
                      @update:scriptEditorActiveTab="handleUpdateScriptEditorActiveTab"
                      :mulmoError="mulmoError"
                      @saveMulmo="saveMulmo"
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          <!-- Right Column - Output & Product -->
          <div
            class="space-y-4 overflow-y-auto pl-2"
            :class="{ 'lg:block': isRightColumnOpen, 'lg:hidden': !isRightColumnOpen }"
          >
            <!-- Output Section -->
            <Card v-if="hasProjectData">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <CardTitle class="flex items-center space-x-2">
                    <Settings :size="20" />
                    <span>{{ t("panels.outputSettingsGeneration") }}</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" @click="isRightColumnOpen = false" class="hidden lg:inline-flex">
                    <PanelRightClose :size="16" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent class="p-4">
                <Generate :projectId="projectId" />
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
                <MulmoViewer v-if="project" :project="project" />
              </CardContent>
            </Card>

            <!-- Debug Log Section -->
            <Card>
              <CardContent class="space-y-4 p-4">
                <!-- Debug Logs -->
                <div class="rounded-lg bg-gray-50 p-4">
                  <h3 class="mb-2 text-sm font-medium">Debug Logs</h3>
                  <div class="h-40 overflow-y-auto rounded border bg-white p-2 font-mono text-xs" ref="logContainer">
                    <div v-for="(entry, i) in debugLog" :key="'debug-' + i" class="whitespace-pre-wrap">
                      {{ entry }}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Right Column - Collapsed State -->
          <div v-if="!isRightColumnOpen" class="hidden h-full w-[48px] border-l border-gray-200 bg-gray-100 lg:flex">
            <button
              @click="isRightColumnOpen = true"
              class="flex h-full w-full flex-col items-center p-2 transition-colors hover:bg-gray-200"
              :aria-label="t('panels.openOutputProduct')"
              :title="t('panels.openOutputProduct')"
            >
              <PanelRightOpen :size="16" class="mt-2 mb-4 text-gray-600" />
              <Settings :size="20" class="mb-2 text-gray-700" />
              <span class="writing-mode-vertical text-sm text-gray-600">{{ t("panels.outputProduct") }}</span>
            </button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import {
  Code2,
  Settings,
  Play,
  Undo,
  Redo,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-vue-next";
import dayjs from "dayjs";
import { mulmoScriptSchema, type MulmoScript } from "mulmocast/browser";

import { Button, Badge, Label, Switch } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator"; // Will be used for mobile layout
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Import sub-components (to be created)
import Layout from "@/components/layout.vue";
import Chat from "./project/chat.vue";
import PromptGuide from "./project/prompt_guide.vue";
import ScriptEditor from "./project/script_editor.vue";
import BeatsViewer from "./project/beats_viewer.vue";
import Generate from "./project/generate.vue";
import MulmoViewer from "../components/mulmo_viewer.vue";
import ProjectHeader from "./project/project_header.vue";

import { getConcurrentTaskStatusMessageComponent } from "./project/concurrent_task_status_message";

import { projectApi, type ProjectMetadata } from "@/lib/project_api";
import { arrayPositionUp, arrayInsertAfter, arrayRemoveAt } from "@/lib/array";
import { notifySuccess, notifyProgress } from "@/lib/notification";
import { setRandomBeatId } from "@/lib/beat_util.js";
import { bufferToUrl } from "@/lib/utils";

import { useMulmoEventStore, useMulmoScriptHistoryStore, useGraphAIDebugLogStore } from "../store";

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
  isLeftColumnOpen,
  isRightColumnOpen,
  gridLayoutClass,
} from "./project/composable/style";
import { ChatMessage, MulmoError } from "@/types";
import { type ScriptEditorTab } from "../../shared/constants";

import { zodError2MulmoError } from "../lib/error";

// State
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const mulmoEventStore = useMulmoEventStore();
const mulmoScriptHistoryStore = useMulmoScriptHistoryStore();

const projectId = computed(() => route.params.id as string);
const projectMetadata = ref<ProjectMetadata | null>(null);
const project = computed(() => ({
  metadata: projectMetadata.value,
  script: mulmoScriptHistoryStore.currentMulmoScript,
}));

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
    projectMetadata.value = await projectApi.getProjectMetadata(projectId.value);
    const data = await projectApi.getProjectMulmoScript(projectId.value);
    data.beats.map(setRandomBeatId);
    mulmoScriptHistoryStore.initMulmoScript(data);
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

const handleUpdateScriptFromHeader = (script: MulmoScript) => {
  mulmoScriptHistoryStore.updateMulmoScript(script);
};

const saveProjectMetadata = useDebounceFn(async (projectMetadata: ProjectMetadata) => {
  await projectApi.saveProjectMetadata(projectId.value, {
    ...projectMetadata,
    updatedAt: dayjs().toISOString(),
  });
}, 1000);

const handleUpdateChatMessages = (messages: ChatMessage[]) => {
  projectMetadata.value.chatMessages = messages;
  saveProjectMetadata(projectMetadata.value);
};

const handleUpdateScriptEditorActiveTab = (tab: ScriptEditorTab) => {
  projectMetadata.value.scriptEditorActiveTab = tab;
  saveProjectMetadata(projectMetadata.value);
};

const saveMulmo = async () => {
  console.log("saved", mulmoScriptHistoryStore.currentMulmoScript);
  await projectApi.saveProjectScript(projectId.value, mulmoScriptHistoryStore.currentMulmoScript);
  projectMetadata.value.updatedAt = dayjs().toISOString();
  await projectApi.saveProjectMetadata(projectId.value, projectMetadata.value);
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
    data.data.beats.map(setRandomBeatId);
    mulmoScriptHistoryStore.updateMulmoScriptAndPushToHistory(data.data);
    // push store //
  }
  console.log(data);
};

const ConcurrentTaskStatusMessageComponent = getConcurrentTaskStatusMessageComponent(projectId.value ?? "");

const openProjectFolder = async () => {
  await projectApi.openProjectFolder(projectId.value);
};

const generateImage = async (index: number, target: string) => {
  await saveMulmo();
  notifyProgress(window.electronAPI.mulmoHandler("mulmoImageGenerate", projectId.value, index, target), {
    loadingMessage: ConcurrentTaskStatusMessageComponent,
    successMessage: "Image generated successfully",
    errorMessage: "Failed to generate image",
  });
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
  const res = (await window.electronAPI.mulmoHandler("mulmoAudioFiles", projectId.value)) as Buffer[];
  audioFiles.value = res.map((buffer) => {
    if (buffer) {
      return bufferToUrl(buffer, "audio/mp3");
    }
    return "";
  });
};

const downloadImageFiles = async () => {
  const res = (await window.electronAPI.mulmoHandler("mulmoImageFiles", projectId.value)) as {
    imageData?: Buffer;
    movieData?: Buffer;
  }[];
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

watch(
  () => mulmoEventStore.mulmoEvent[projectId.value],
  async (mulmoEvent) => {
    // generate image
    if (mulmoEvent && mulmoEvent.kind === "session" && mulmoEvent.sessionType === "image" && !mulmoEvent.inSession) {
      await downloadImageFiles();
    }

    if (mulmoEvent && mulmoEvent.kind === "session" && mulmoEvent.sessionType === "audio" && !mulmoEvent.inSession) {
      // await downloadImageFiles();
      // console.log(
    }

    // beats
    if (
      mulmoEvent &&
      mulmoEvent.kind === "beatGenerate" &&
      ["image"].includes(mulmoEvent.sessionType) &&
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
      const res = (await window.electronAPI.mulmoHandler(
        "mulmoAudioFile",
        projectId.value,
        mulmoEvent.index,
      )) as Buffer;
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

<style scoped>
.writing-mode-vertical {
  writing-mode: vertical-rl;
  text-orientation: sideways;
}
</style>
