<template>
  <Layout>
    <TooltipProvider>
      <div class="mx-auto space-y-2 px-2 pt-2">
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
                  :projectMetadata="projectMetadata"
                  @update:updateChatMessages="handleUpdateChatMessages"
                  @update:projectMetadata="handleUpdateProjectMetadata"
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
                        <div v-if="!mulmoScriptHistoryStore.isValidScript" class="flex items-center space-x-2">
                          <div
                            class="inline-flex items-center space-x-1 rounded border border-red-200 bg-red-50 px-2 py-1 dark:border-red-800 dark:bg-red-900/20"
                          >
                            <span class="text-xs font-medium text-red-600 dark:text-red-400">{{
                              t("dashboard.errors.noPreviewInProject")
                            }}</span>
                          </div>
                          <XCircle :size="32" class="text-destructive" />
                        </div>
                      </div>
                      <!-- Undo/Redo buttons -->
                      <Button
                        variant="ghost"
                        size="lg"
                        :disabled="!mulmoScriptHistoryStore.undoable"
                        @click="mulmoScriptHistoryStore.undo"
                      >
                        <Undo :class="mulmoScriptHistoryStore.undoable ? 'text-foreground' : 'text-muted-foreground'" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="lg"
                        :disabled="!mulmoScriptHistoryStore.redoable"
                        @click="mulmoScriptHistoryStore.redo"
                      >
                        <Redo :class="mulmoScriptHistoryStore.redoable ? 'text-foreground' : 'text-muted-foreground'" />
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
                    :isArtifactGenerating="isArtifactGenerating"
                    @updateMulmoScript="handleUpdateMulmoScript"
                    @updateMulmoScriptAndPushToHistory="handleUpdateMulmoScriptAndPushToHistory"
                    @generateImage="generateImage"
                    @formatAndPushHistoryMulmoScript="formatAndPushHistoryMulmoScript"
                    @update:scriptEditorActiveTab="handleUpdateScriptEditorActiveTab"
                    :mulmoError="mulmoScriptHistoryStore.mulmoError"
                    @updateMultiLingual="updateMultiLingual"
                    :mulmoMultiLinguals="mulmoMultiLinguals"
                    @imageRestored="handleImageRestored"
                    @movieRestored="handleMovieRestored"
                    @audioUploaded="handleAudioUploaded"
                    @audioRemoved="handleAudioRemoved"
                    @audioGenerated="handleAudioGenerated"
                    @deleteBeat="deleteBeat"
                    @refreshBeatMedia="refreshBeatMedia"
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
                <Generate :projectId="projectId" :isArtifactGenerating="isArtifactGenerating" />
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
                <VideoViewer :projectId="projectId" :isArtifactGenerating="isArtifactGenerating" />
              </CardContent>
            </Card>

            <!-- Download mulmo script -->
            <Card>
              <CardContent class="space-y-4 p-4">
                <div class="space-y-4">
                  <div class="flex justify-center">
                    <Button
                      @click="downloadMulmoScript"
                      class="mt-2 flex h-auto w-full items-center justify-center space-y-2 py-4 whitespace-normal"
                      data-testid="generate-contents-button"
                      :disabled="!mulmoScriptHistoryStore.isValidScript"
                    >
                      <div class="mb-0 flex items-center justify-center gap-2">
                        <Monitor :size="24" />
                      </div>
                      <span>{{ t("project.download.mulmoScript") }}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Debug Log Section -->
            <Card v-if="isDevelopment">
              <CardContent class="space-y-4 p-4">
                <!-- Debug Logs -->
                <DebugLog />
              </CardContent>
            </Card>

            <!-- Publish Section -->
            <Card v-if="hasMulmoMediaApiKey">
              <CardContent class="space-y-4 p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-medium">{{ t("project.publish.title") }}</h3>
                    <p class="text-muted-foreground text-xs">{{ t("project.publish.description") }}</p>
                  </div>
                  <Button @click="handlePublish" :disabled="isPublishing">
                    <span v-if="!isPublishing">{{ t("project.publish.button") }}</span>
                    <span v-else class="flex items-center space-x-2">
                      <span
                        class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                      ></span>
                      <span>{{ t("project.publish.publishing") }}</span>
                    </span>
                  </Button>
                </div>
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
  Monitor,
} from "lucide-vue-next";
import dayjs from "dayjs";
import {
  mulmoScriptSchema,
  mulmoBeatSchema,
  type MulmoScript,
  type BeatSessionType,
  type SessionType,
} from "mulmocast/browser";

import { z } from "zod";
import { toast } from "vue-sonner";

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
import { notifySuccess, notifyProgress, notifyError } from "@/lib/notification";
import { setRandomBeatId } from "@/lib/beat_util.js";
import { insertSpeakers } from "./utils";
import { arrayRemoveAt } from "@/lib/array";

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

const isDevelopment = import.meta.env.DEV;

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
  const res = await window.electronAPI.mulmoHandler("mulmoMultiLinguals", projectId.value);
  if (res && res.noContext) {
    notifyError(t("notify.error.multilinguals.errorMessage"), t("notify.error.noContext"));
  } else {
    mulmoMultiLinguals.value = res;
  }
};

const {
  imageFiles,
  movieFiles,
  lipSyncFiles,
  resetImagesData,
  downloadImageFiles,
  downloadImageFile,
  deleteImageData,
} = useImageFiles();

const { audioFiles, downloadAudioFiles, downloadAudioFile, resetAudioData, deleteAudioData } = useAudioFiles();

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

watch(
  () => mulmoScriptHistoryStore.isValidScript,
  async (newVal, oldVal) => {
    if (newVal && !oldVal) {
      // Save script first to ensure the file is up-to-date before downloading
      await saveMulmoScript();
      downloadAudioFiles(projectId.value, mulmoScriptHistoryStore.lang);
      downloadImageFiles(projectId.value);
    }
  },
);

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

// Delete beat and its associated media files
const deleteBeat = (index: number) => {
  const currentScript = mulmoScriptHistoryStore.currentMulmoScript;
  if (index >= 0 && index < currentScript.beats.length) {
    const beat = currentScript.beats[index];
    const beatIdToDelete = beat.id;

    // Remove beat from script
    const newBeats = arrayRemoveAt(currentScript.beats, index);

    // Delete associated media files if beatId exists
    if (beatIdToDelete) {
      deleteImageData(beatIdToDelete);
      deleteAudioData(beatIdToDelete);
    }

    // Update script and save
    handleUpdateMulmoScriptAndPushToHistory({
      ...currentScript,
      beats: newBeats,
    });

    notifySuccess(t("project.scriptEditor.beatDeleted"));
  }
};

// Refresh media files for a specific beat (used after copying)
const refreshBeatMedia = async (beatId: string, index: number) => {
  if (beatId) {
    await downloadImageFile(projectId.value, index, beatId);
    await downloadAudioFile(projectId.value, mulmoScriptHistoryStore.lang, index, beatId);
  }
};

// internal use
const saveMulmoScript = async () => {
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

const handleUpdateProjectMetadata = (updatedMetadata: ProjectMetadata) => {
  projectMetadata.value = updatedMetadata;
  saveProjectMetadata({ updateTimestamp: false });
};

const handleUpdateScriptEditorActiveTab = async (tab: ScriptEditorTab) => {
  projectMetadata.value.scriptEditorActiveTab = tab;
  await projectApi.saveProjectScript(projectId.value, mulmoScriptHistoryStore.currentMulmoScript);
  saveProjectMetadata({ updateTimestamp: false });
};

const handleAudioUploaded = async (index: number, beatId: string) => {
  // Load uploaded audio file for preview
  const beat = mulmoScriptHistoryStore.currentMulmoScript?.beats?.[index];
  const uploadPath =
    beat?.audio?.type === "audio" && beat.audio.source?.kind === "path" ? beat.audio.source.path : undefined;
  if (uploadPath) {
    await downloadAudioFile(projectId.value, mulmoScriptHistoryStore.lang, index, beatId, {
      mode: "uploaded",
      uploadPath,
    });
  }
};

const handleAudioRemoved = (index: number, beatId: string) => {
  // Clear the audio file from preview
  const lang = mulmoScriptHistoryStore.lang;
  if (audioFiles.value[lang]?.[beatId]) {
    delete audioFiles.value[lang][beatId];
  }
};

const handleAudioGenerated = async (index: number, beatId: string) => {
  // Force load generated TTS audio file
  await downloadAudioFile(projectId.value, mulmoScriptHistoryStore.lang, index, beatId, {
    mode: "generated",
  });
};

const handleUpdateMulmoViewerActiveTab = (tab: MulmoViewerTab) => {
  projectMetadata.value.mulmoViewerActiveTab = tab;
  saveProjectMetadata({ updateTimestamp: false });
};

const mulmoScriptSchemaNoBeats = mulmoScriptSchema.extend({
  beats: z.array(mulmoBeatSchema).min(0),
});

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

const generateImage = async (index: number, target: string) => {
  // await saveMulmoScript();
  notifyProgress(window.electronAPI.mulmoHandler("mulmoGenerateBeatImage", projectId.value, index, target), {
    // loadingMessage: ConcurrentTaskStatusMessageComponent,
    successMessage: t("notify.image.successMessage"),
    errorMessage: t("notify.image.errorMessage"),
    errorDescription: t("notify.error.noContext"),
  });
};

const handleImageRestored = async () => {
  await downloadImageFiles(projectId.value);
};

const handleMovieRestored = async () => {
  await downloadImageFiles(projectId.value);
};

const downloadMulmoScript = () => {
  const jsonString = JSON.stringify(mulmoScriptHistoryStore.currentMulmoScript, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "mulmoScript.json";
  a.click();

  URL.revokeObjectURL(url);
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
          // Audio generation completed - always load generated TTS file
          downloadAudioFile(projectId.value, mulmoScriptHistoryStore.lang, index, mulmoEvent.id, {
            mode: "generated",
          });
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

const isArtifactGenerating = computed(() => {
  return mulmoEventStore.isArtifactGenerating[projectId.value] ?? false;
});

//
const generatingMessage = computed(() => {
  const data = mulmoEventStore.sessionState?.[projectId.value];
  if (!data) {
    return "";
  }
  const ret: string[] = [];
  Object.keys(data["artifact"] ?? {}).forEach((key: SessionType) => {
    if (data["artifact"][key]) {
      ret.push(t(`notify.task.${key}`));
    }
  });
  Object.keys(data["beat"] ?? {}).forEach((beatSessionType: BeatSessionType) => {
    if (data["beat"][beatSessionType] && Object.values(data["beat"][beatSessionType]).some((value) => value)) {
      /*
      const indexes = Object.keys(data["beat"][beatSessionType])
        .filter((index: string) => {
          console.log(index);
          return data["beat"][beatSessionType][Number(index)];
        })
        .map((index: string) => Number(index) + 1);
      */
      ret.push(t(`notify.beat.${beatSessionType}`));
    }
  });
  if (ret.length === 0) {
    return "";
  }
  return t("ui.status.generatingThing", { thing: ret.join(", ") });
});

const ConcurrentTaskStatusMessageComponent = getConcurrentTaskStatusMessageComponent(
  projectId.value,
  generatingMessage,
);

const toastId = ref<null | string>(null);
watch(
  generatingMessage,
  (value) => {
    if (value === "") {
      if (toastId.value) {
        toast.dismiss(toastId.value);
      }
      toastId.value = null;
    } else {
      if (toastId.value == null) {
        toastId.value = toast.loading(ConcurrentTaskStatusMessageComponent, {
          duration: Infinity,
        });
      }
    }
  },
  { immediate: true },
);

// Publish functionality
const isPublishing = ref(false);
const hasMulmoMediaApiKey = import.meta.env.VITE_MULMO_MEDIA_API_KEY;

const handlePublish = async () => {
  if (!projectId.value) return;

  isPublishing.value = true;
  try {
    const result = await window.electronAPI.mulmoHandler("publishMulmoView", projectId.value);

    if (result && typeof result === "object" && "error" in result) {
      const errorResult = result as { error: Error; cause?: { type: string; agentName: string } };

      if (errorResult.cause) {
        const { type, agentName } = errorResult.cause;
        const i18nKey = `notify.errors.${type}.${agentName}`;

        if (t(i18nKey) !== i18nKey) {
          notifyError(t(i18nKey));
          return;
        }
      }

      throw errorResult.error;
    }

    notifySuccess(t("project.publish.success"));
  } catch (error) {
    console.error("Failed to publish:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    notifyError(t("project.publish.failed"), errorMessage);
  } finally {
    isPublishing.value = false;
  }
};

onUnmounted(() => {
  if (toastId.value) {
    toast.dismiss(toastId.value);
  }
  toastId.value = null;
});
</script>

<style scoped>
.writing-mode-vertical {
  writing-mode: vertical-rl;
  text-orientation: sideways;
}
</style>
