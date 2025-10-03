<template>
  <Layout>
    <TooltipProvider>
      <div class="mx-auto space-y-2 px-2">
        <!-- Header Section -->
        <ProjectHeader
          :mulmoScript="mulmoScriptHistoryStore.currentMulmoScript"
          @openProjectFolder="openProjectFolder"
          @updateMulmoScript="handleUpdateMulmoScript"
        />
        <!-- 3 Split Layout -->
        <div class="relative grid h-auto grid-cols-1 lg:h-[calc(100vh-180px)]" :class="gridLayoutClass">
          <!-- Left Column - AI Chat -->
          <div
            class="h-full overflow-y-auto pr-2"
            :class="{ 'lg:block': isLeftColumnOpen, 'lg:hidden': !isLeftColumnOpen }"
            v-if="globalStore.userIsSemiProOrAbove"
          >
            <Card class="flex h-full flex-col">
              <CardHeader class="flex-shrink-0">
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle class="text-primary flex items-center space-x-2">
                      <Bot :size="20" />
                      <span>
                        {{ t("project.chat.title") }}
                      </span>
                    </CardTitle>
                    <p class="text-primary/80 text-sm">
                      {{ t("project.chat.beginnerDescription") }}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" @click="isLeftColumnOpen = false" class="hidden lg:inline-flex">
                    <PanelLeftClose :size="16" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent class="-mt-6 flex flex-1 flex-col overflow-hidden" v-if="projectMetadata">
                <Chat
                  :mulmoScript="mulmoScriptHistoryStore.currentMulmoScript"
                  :messages="projectMetadata?.chatMessages"
                  @update:updateChatMessages="handleUpdateChatMessages"
                  @updateMulmoScript="handleUpdateMulmoScriptWithNotify"
                  @resetMediaFiles="resetMediaFiles"
                  class="flex h-full flex-col"
                />
              </CardContent>
            </Card>
          </div>

          <!-- Left Column - Collapsed State -->
          <div v-if="!isLeftColumnOpen" class="border-border bg-muted hidden h-full w-[48px] border-r lg:flex">
            <button
              @click="isLeftColumnOpen = true"
              class="hover:bg-muted-foreground/10 flex h-full w-full flex-col items-center p-2 transition-colors"
              :aria-label="t('project.chat.openPanel')"
              :title="t('project.chat.openPanel')"
            >
              <PanelLeftOpen :size="16" class="text-muted-foreground mt-2 mb-4" />
              <Bot :size="20" class="text-primary mb-2" />
              <span class="writing-mode-vertical text-muted-foreground text-sm">{{ t("project.chat.title") }}</span>
            </button>
          </div>

          <!-- Middle Column - Script Editor -->
          <div class="h-full">
            <Collapsible class="h-full">
              <Card class="flex h-full flex-col">
                <CardHeader class="flex-shrink-0">
                  <div class="flex items-center justify-between">
                    <CollapsibleTrigger as-child>
                      <CardTitle class="flex cursor-pointer items-center space-x-2">
                        <ScrollText :size="20" />
                        <span>{{ t("project.menu.script") }}</span>
                      </CardTitle>
                    </CollapsibleTrigger>
                    <div class="flex items-center space-x-2">
                      <!-- Validation Status -->
                      <div class="flex items-center space-x-2">
                        <div v-if="mulmoScriptHistoryStore.isValidScript" class="group relative">
                          <CheckCircle
                            :size="16"
                            class="cursor-pointer text-green-500 group-hover:text-green-600 dark:text-green-400 dark:group-hover:text-green-300"
                          />
                          <span
                            class="bg-popover text-popover-foreground border-border pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded border px-2 py-1 text-xs whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                          >
                            {{ t("project.scriptEditor.validationStatus") }}
                          </span>
                        </div>
                        <XCircle v-if="!mulmoScriptHistoryStore.isValidScript" :size="16" class="text-destructive" />
                      </div>
                      <!-- Undo/Redo buttons -->
                      <Button
                        variant="ghost"
                        size="sm"
                        :disabled="!mulmoScriptHistoryStore.undoable"
                        @click="mulmoScriptHistoryStore.undo"
                      >
                        <Undo
                          :size="16"
                          :class="mulmoScriptHistoryStore.undoable ? 'text-foreground' : 'text-muted-foreground'"
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        :disabled="!mulmoScriptHistoryStore.redoable"
                        @click="mulmoScriptHistoryStore.redo"
                      >
                        <Redo
                          :size="16"
                          :class="mulmoScriptHistoryStore.redoable ? 'text-foreground' : 'text-muted-foreground'"
                        />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent class="h-full">
                  <ScriptEditor
                    :mulmoScript="mulmoScriptHistoryStore.currentMulmoScript ?? {}"
                    :imageFiles="imageFiles"
                    :movieFiles="movieFiles"
                    :audioFiles="audioFiles[mulmoScriptHistoryStore.lang ?? globalStore.settings.APP_LANGUAGE] ?? {}"
                    :lipSyncFiles="lipSyncFiles"
                    :scriptEditorActiveTab="projectMetadata?.scriptEditorActiveTab"
                    :isValidScriptData="mulmoScriptHistoryStore.isValidScript"
                    @updateMulmoScript="handleUpdateMulmoScript"
                    @updateMulmoScriptAndPushToHistory="handleUpdateMulmoScriptAndPushToHistory"
                    @generateImage="generateImage"
                    @formatAndPushHistoryMulmoScript="formatAndPushHistoryMulmoScript"
                    @update:scriptEditorActiveTab="handleUpdateScriptEditorActiveTab"
                    :mulmoError="mulmoScriptHistoryStore.mulmoError"
                    @updateMultiLingual="updateMultiLingual"
                    :mulmoMultiLinguals="mulmoMultiLinguals"
                  />
                </CardContent>
              </Card>
            </Collapsible>
          </div>

          <!-- Right Column - Output & Product -->
          <div
            class="space-y-4 overflow-y-auto pl-2"
            :class="{ 'lg:block': isRightColumnOpen, 'lg:hidden': !isRightColumnOpen }"
          >
            <!-- Output Section -->
            <Card v-if="globalStore.userIsPro">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <CardTitle class="flex items-center space-x-2">
                    <Settings :size="20" />
                    <span>{{ t("project.generate.outputSettingsGeneration") }}</span>
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

            <!-- Product Section -->
            <Card class="relative" v-if="globalStore.userIsPro">
              <div class="absolute right-4 z-50 mt-[-16px] flex items-center rounded-lg bg-black/50 text-white">
                <button class="p-3 transition-colors hover:text-red-400" @click="openModal">
                  <Expand class="h-5 w-5" />
                </button>
              </div>
              <CardHeader>
                <CardTitle class="flex items-center space-x-2" @click="openModal">
                  <Play :size="20" />
                  <span>{{ t("project.menu.product") }}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductTabs
                  v-if="project"
                  :project="project"
                  :mulmoViewerActiveTab="projectMetadata?.mulmoViewerActiveTab"
                  :mulmoMultiLinguals="mulmoMultiLinguals"
                  @update:mulmoViewerActiveTab="handleUpdateMulmoViewerActiveTab"
                  @updateMultiLingual="updateMultiLingual"
                />
              </CardContent>
            </Card>

            <Card v-if="!globalStore.userIsPro">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <CardTitle class="flex items-center space-x-2">
                    <Settings :size="20" />
                    <span>{{ t("project.generate.generationAndPlay") }}</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" @click="isRightColumnOpen = false" class="hidden lg:inline-flex">
                    <PanelRightClose :size="16" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent class="p-4">
                <VideoViewer :projectId="projectId" />
              </CardContent>
            </Card>

            <!-- Debug Log Section -->
            <Card>
              <CardContent class="space-y-4 p-4">
                <!-- Debug Logs -->
                <DebugLog />
              </CardContent>
            </Card>
          </div>
          <!-- Right Column - Collapsed State -->
          <div v-if="!isRightColumnOpen" class="border-border bg-muted hidden h-full w-[48px] border-l lg:flex">
            <button
              @click="isRightColumnOpen = true"
              class="hover:bg-muted-foreground/10 flex h-full w-full flex-col items-center p-2 transition-colors"
              :aria-label="t('project.generate.openPanel')"
              :title="t('project.generate.openPanel')"
            >
              <PanelRightOpen :size="16" class="text-muted-foreground mt-2 mb-4" />
              <Settings :size="20" class="text-foreground mb-2" />
              <span class="writing-mode-vertical text-muted-foreground text-sm">{{
                t("project.generate.outputProduct")
              }}</span>
            </button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import {
  ScrollText,
  Settings,
  Play,
  Undo,
  Redo,
  CheckCircle,
  XCircle,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Expand,
} from "lucide-vue-next";
import dayjs from "dayjs";
import { mulmoScriptSchema, mulmoBeatSchema, type MulmoScript } from "mulmocast/browser";
import { z } from "zod";

import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator"; // Will be used for mobile layout
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TooltipProvider } from "@/components/ui/tooltip";

// Import sub-components (to be created)
import Layout from "@/components/layout.vue";
import Chat from "./project/chat.vue";
import ScriptEditor from "./project/script_editor.vue";
import Generate from "./project/generate.vue";
import VideoViewer from "./project/video_viewer.vue";
import ProductTabs from "../components/product/tabs.vue";
import ProjectHeader from "./project/header.vue";
import DebugLog from "./project/debug_log.vue";

import { getConcurrentTaskStatusMessageComponent } from "./project/concurrent_task_status_message";

import { projectApi, type ProjectMetadata } from "@/lib/project_api";
import { notifySuccess, notifyProgress } from "@/lib/notification";
import { setRandomBeatId } from "@/lib/beat_util.js";

import { useMulmoEventStore, useMulmoScriptHistoryStore, useMulmoGlobalStore } from "@/store";

import {
  isLeftColumnOpen,
  isRightColumnOpen,
  useGridLayoutClass,
  setupUserLevelWatch,
} from "./project/composable/style";
import { ChatMessage } from "@/types";
import { type ScriptEditorTab, type MulmoViewerTab } from "../../shared/constants";

import { useImageFiles, useAudioFiles } from "./composable";

// State
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const mulmoEventStore = useMulmoEventStore();
const mulmoScriptHistoryStore = useMulmoScriptHistoryStore();
const globalStore = useMulmoGlobalStore();

// Setup grid layout and user level watching
const gridLayoutClass = useGridLayoutClass();
setupUserLevelWatch();

const projectId = computed(() => route.params.id as string);
const projectMetadata = ref<ProjectMetadata | null>(null);
const project = computed(() => ({
  metadata: projectMetadata.value,
  script: mulmoScriptHistoryStore.currentMulmoScript,
}));

const mulmoMultiLinguals = ref({});
const updateMultiLingual = async () => {
  mulmoMultiLinguals.value = await window.electronAPI.mulmoHandler("mulmoMultiLinguals", projectId.value);
};

const { imageFiles, movieFiles, lipSyncFiles, resetImagesData, downloadImageFiles, downloadImageFile } =
  useImageFiles();

const { audioFiles, downloadAudioFiles, downloadAudioFile, resetAudioData } = useAudioFiles();

// Load project data on mount
onMounted(async () => {
  try {
    updateMultiLingual();
    projectMetadata.value = await projectApi.getProjectMetadata(projectId.value);
    const data = await projectApi.getProjectMulmoScript(projectId.value);
    if (data.beats) {
      data.beats.map(setRandomBeatId);
    }
    mulmoScriptHistoryStore.initMulmoScript(data, globalStore.settings.APP_LANGUAGE);
    // mulmoScriptHistoryStore.lang
    downloadAudioFiles(projectId.value, data.lang ?? globalStore.settings.APP_LANGUAGE);
    downloadImageFiles(projectId.value);
  } catch (error) {
    console.error("Failed to load project:", error);
    router.push("/");
  }
});

onUnmounted(() => {
  mulmoScriptHistoryStore.resetMulmoScript();
});

// mulmoScript
// for only chat
const handleUpdateMulmoScriptWithNotify = (script: MulmoScript) => {
  handleUpdateMulmoScriptAndPushToHistory(script);
  notifySuccess(t("settings.notifications.createSuccess"));
};
// Save to file and push to history
const handleUpdateMulmoScriptAndPushToHistory = (script: MulmoScript) => {
  mulmoScriptHistoryStore.updateMulmoScript(script);
  formatAndPushHistoryMulmoScript();
  saveMulmoScript();
};

// Just update mulmoScript Data
const handleUpdateMulmoScript = (script: MulmoScript) => {
  mulmoScriptHistoryStore.updateMulmoScript(script);
  saveMulmoScriptDebounced();
};
// internal use
const saveMulmoScript = async () => {
  console.log("saved", mulmoScriptHistoryStore.currentMulmoScript);
  // insertSpeakers(mulmoScriptHistoryStore.currentMulmoScript);
  await projectApi.saveProjectScript(projectId.value, mulmoScriptHistoryStore.currentMulmoScript);
  projectMetadata.value.updatedAt = dayjs().toISOString();
  await projectApi.saveProjectMetadata(projectId.value, projectMetadata.value);
};
// internal use
const saveMulmoScriptDebounced = useDebounceFn(saveMulmoScript, 1000);

// end of mulmoScript

const saveProjectMetadata = async (options: { updateTimestamp?: boolean } = {}) => {
  const { updateTimestamp = true } = options;
  if (updateTimestamp) {
    projectMetadata.value.updatedAt = dayjs().toISOString();
  }
  await projectApi.saveProjectMetadata(projectId.value, projectMetadata.value);
};

const saveProjectMetadataDebounced = useDebounceFn(saveProjectMetadata, 1000);

const handleUpdateChatMessages = (messages: ChatMessage[]) => {
  projectMetadata.value.chatMessages = messages;
  saveProjectMetadataDebounced();
};

const handleUpdateScriptEditorActiveTab = async (tab: ScriptEditorTab) => {
  projectMetadata.value.scriptEditorActiveTab = tab;
  await projectApi.saveProjectScript(projectId.value, mulmoScriptHistoryStore.currentMulmoScript);
  saveProjectMetadata({ updateTimestamp: false });
};

const handleUpdateMulmoViewerActiveTab = (tab: MulmoViewerTab) => {
  projectMetadata.value.mulmoViewerActiveTab = tab;
  saveProjectMetadata({ updateTimestamp: false });
};

const mulmoScriptSchemaNoBeats = mulmoScriptSchema.extend({
  beats: z.array(mulmoBeatSchema).min(0),
});

const insertSpeakers = (data) => {
  const existsSpeakers = data.beats.reduce((speakers, beat) => {
    if (beat.speaker && !speakers.has(beat.speaker)) {
      speakers.add(beat.speaker);
    }
    return speakers;
  }, new Set());
  Object.keys(data?.speechParams?.speakers ?? {}).map((speaker) => {
    existsSpeakers.delete(speaker);
  });
  existsSpeakers.forEach((speaker) => {
    data.speechParams.speakers[speaker] = {
      displayName: {
        en: speaker,
      },
      voiceId: "shimmer",
    };
  });
};

const formatAndPushHistoryMulmoScript = () => {
  const data = mulmoScriptSchemaNoBeats.safeParse(mulmoScriptHistoryStore.currentMulmoScript);
  if (data.success) {
    data.data.beats.map(setRandomBeatId);
    insertSpeakers(data.data);
    mulmoScriptHistoryStore.updateMulmoScriptAndPushToHistory(data.data);
    // push store //
  } else {
    const current = mulmoScriptHistoryStore.currentMulmoScript;
    if (!current["$mulmocast"] || !current["beats"] || !current["lang"]) {
      if (!current["$mulmocast"]) {
        current["$mulmocast"] = {
          credit: "closing",
          version: "1.1",
        };
      }
      if (!current["beats"]) {
        current["beats"] = [];
      }
      if (!current["lang"]) {
        current["lang"] = globalStore.settings.APP_LANGUAGE;
      }
      mulmoScriptHistoryStore.updateMulmoScript(current);
    }
  }
};

const openProjectFolder = async () => {
  await projectApi.openProjectFolder(projectId.value);
};

const ConcurrentTaskStatusMessageComponent = getConcurrentTaskStatusMessageComponent(projectId.value ?? "");

const generateImage = async (index: number, target: string) => {
  // await saveMulmoScript();
  notifyProgress(window.electronAPI.mulmoHandler("mulmoGenerateBeatImage", projectId.value, index, target), {
    loadingMessage: ConcurrentTaskStatusMessageComponent,
    successMessage: t("notify.image.successMessage"),
    errorMessage: t("notify.image.errorMessage"),
  });
};

const resetMediaFiles = () => {
  resetImagesData();
  resetAudioData();
};

const openModal = () => {
  globalStore.setMulmoViewerProjectId(projectId.value);
};

// Gets the content generated by the callback. So, it processes only when inSession is false.
watch(
  () => mulmoEventStore.mulmoEvent[projectId.value],
  async (mulmoEvent) => {
    if (mulmoEvent?.inSession) {
      return;
    }
    // generate image
    if (mulmoEvent && mulmoEvent.kind === "session") {
      if (mulmoEvent.sessionType === "image") {
        downloadImageFiles(projectId.value);
      }
      if (mulmoEvent.sessionType === "audio") {
        downloadAudioFiles(projectId.value, mulmoScriptHistoryStore.lang);
      }
      if (mulmoEvent.sessionType === "pdf") {
        // downloadAudioFiles();
      }
    }

    // beats
    if (mulmoEvent?.kind === "beatGenerate" && ["image"].includes(mulmoEvent.sessionType)) {
      const index = mulmoScriptHistoryStore.currentMulmoScript?.beats?.findIndex((beat) => beat.id === mulmoEvent.id);
      if (index === -1 || index === undefined) {
        return;
      }
      downloadImageFile(projectId.value, index, mulmoEvent.id);
    }
    if (mulmoEvent?.kind === "beat") {
      if (mulmoEvent.sessionType === "audio" || mulmoEvent.sessionType === "image") {
        const index = mulmoScriptHistoryStore.currentMulmoScript?.beats?.findIndex((beat) => beat.id === mulmoEvent.id);
        if (index === -1 || index === undefined) {
          return;
        }
        if (mulmoEvent.sessionType === "audio") {
          downloadAudioFile(projectId.value, mulmoScriptHistoryStore.lang, index, mulmoEvent.id);
        }
        if (mulmoEvent.sessionType === "image") {
          downloadImageFile(projectId.value, index, mulmoEvent.id);
        }
      }
      if (mulmoEvent.sessionType === "multiLingual") {
        updateMultiLingual();
      }
    }
    console.log(mulmoEvent);
  },
);
</script>

<style scoped>
.writing-mode-vertical {
  writing-mode: vertical-rl;
  text-orientation: sideways;
}
</style>
