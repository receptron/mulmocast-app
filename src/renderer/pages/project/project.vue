<template>
  <Layout>
    <TooltipProvider>
      <div :class="`max-w-7xl mx-auto ${getCardPadding} ${getContainerSpacing}`">
        <!-- Developer Mode Toggle - Always at the top -->
        <div class="bg-gray-50 dark:bg-gray-900 border rounded-lg p-3">
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
        </div>

        <!-- AI Assistant Section -->
        <Card :class="`bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 ${getTimelineFocusClass}`">
          <CardHeader :class="selectedTheme === 'compact' ? 'pb-3' : ''">
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
          <CardContent :class="selectedTheme === 'compact' ? 'pt-0' : ''" v-if="project">
            <component
              :is="selectedTheme === 'beginner' ? Chat : PromptGuide"
              :selectedTheme="selectedTheme"
              :initialMessages="project?.chatMessages"
              @update:updateChatMessages="handleUpdateChatMessages"
              @update:updateMulmoScript="handleUpdateScript"
            />
          </CardContent>
        </Card>

        <Separator v-if="hasProjectData" :class="getTimelineFocusClass" />

        <!-- MulmoScript Viewer Section -->
        <Collapsible v-if="hasProjectData" v-model:open="isScriptViewerOpen" :class="getTimelineFocusClass">
          <Card>
            <CardHeader>
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
                  <Button variant="ghost" size="sm">
                    <Undo :size="16" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Redo :size="16" />
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
              :class="`transition-all duration-300 overflow-hidden ${
                isScriptViewerOpen ? 'max-h-[800px]' : 'max-h-[180px]'
              }`"
            >
              <CardContent>
                <ScriptEditor
                  :mulmoValue="mulmoScript"
                  :imageFiles="imageFiles"
                  @update:mulmoValue="(val) => (mulmoScript = val)"
                  :isValidScriptData="isValidScriptData"
                  @update:isValidScriptData="(val) => (isValidScriptData = val)"
                  @generateImage="(val) => generateImage(val)"
                  @generateAudio="(val) => generateAudio(val)"
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <!-- Output Section -->
        <Card v-if="hasProjectData">
          <CardContent class="p-4">
            <div class="space-y-4">
              <!-- Select Presentation Style -->
              <Style v-model="selectedPresentationStyle"></Style>

              <!-- Caption Toggle -->
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div class="flex flex-col">
                  <Label for="caption-toggle" class="text-sm font-medium"> Caption Display </Label>
                  <p class="text-xs text-gray-500 mt-1">Show captions in video and HTML outputs</p>
                </div>
                <Switch id="caption-toggle" v-model:checked="captionEnabled" />
              </div>

              <!-- Output Buttons -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  class="flex flex-col items-center space-y-2 h-auto py-4"
                  @click="generateMovie"
                  :disabled="store.isArtifactGenerating[projectId]"
                >
                  <Monitor :size="24" />
                  <span>Generate Movie</span>
                </Button>
                <Button
                  class="flex flex-col items-center space-y-2 h-auto py-4"
                  :disabled="store.isArtifactGenerating[projectId]"
                >
                  <FileText :size="24" />
                  <span>Generate PDF</span>
                </Button>
                <Button
                  class="flex flex-col items-center space-y-2 h-auto py-4"
                  @click="generatePodcast"
                  :disabled="store.isArtifactGenerating[projectId]"
                >
                  <Globe :size="24" />
                  <span>Generate Podcast</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Beats Viewer Section -->
        <Collapsible v-if="beatsData.length > 0" v-model:open="isBeatsViewerOpen">
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
                  :beatsData="beatsData"
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
        <Card v-if="hasProjectData" class="mb-8">
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
    </TooltipProvider>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { projectApi, type ProjectMetadata } from "@/lib/project_api";
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
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import Style from "./components/style.vue";
import BeatsViewer from "./components/beats_viewer.vue";
import ProductTabs from "./components/product_tabs.vue";

import dayjs from "dayjs";

import type { MulmoScript } from "mulmocast";
// import { mulmoScriptSchema } from "mulmocast";

import { useDebounceFn } from "@vueuse/core";
import { useStore } from "../../store";

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
import { ChatMessage } from "@/types";
import { notifySuccess } from "@/lib/notification";

// State
const route = useRoute();
const router = useRouter();

const store = useStore();

const projectId = computed(() => route.params.id as string);
const project = ref<ProjectMetadata | null>(null);

const mulmoScript = ref<MulmoScript | null>(null);

const hasProjectData = computed(() => true); // Todo

const isDevMode = ref(false);

const validationMessage = ref("");
const selectedPresentationStyle = ref<"ghibli" | "dilbert" | "japanese">("ghibli");

const captionEnabled = ref(true);
const currentBeatIndex = ref(0);
const timelinePosition = ref(0);
const isPreviewAreaVisible = ref(false);

// Load project data on mount
onMounted(async () => {
  try {
    project.value = await projectApi.getProjectMetadata(projectId.value);
    mulmoScript.value = await projectApi.getProjectMulmoScript(projectId.value);
    // TODO: Load mulmo script data from project
  } catch (error) {
    console.error("Failed to load project:", error);
    router.push("/");
  }
});

const handleUpdateScript = (script: MulmoScript) => {
  mulmoScript.value = script;
  isScriptViewerOpen.value = true;
  notifySuccess("Script created successfully 🎉");
};

const handleUpdateChatMessages = async (messages: ChatMessage[]) => {
  await saveChatMessages(messages);
};

const saveChatMessages = useDebounceFn(async (messages: ChatMessage[]) => {
  await projectApi.saveProjectMetadata(projectId.value, {
    ...project.value,
    updatedAt: dayjs().toISOString(),
    chatMessages: messages,
  });
}, 1000);

const saveMulmo = async (data) => {
  console.log("saved", data);
  await projectApi.saveProjectScript(projectId.value, mulmoScript.value);
  project.value.updatedAt = dayjs().toISOString();
  await projectApi.saveProjectMetadata(projectId.value, project.value);
};
const saveMulmoScript = useDebounceFn(saveMulmo, 1000);

watch(mulmoScript, () => {
  // Be careful not to save a page just by opening it.
  saveMulmoScript(mulmoScript.value);
});

const beatsData = computed(() => mulmoScript.value?.beats ?? []);

const generateMovie = async () => {
  console.log("generateMovie");
  await window.electronAPI.mulmoHandler("mulmoActionRunner", projectId.value, "movie");
};

const generatePodcast = async () => {
  console.log("generateMovie");
  await window.electronAPI.mulmoHandler("mulmoActionRunner", projectId.value, "audio");
};

const generateImage = async (index) => {
  await saveMulmo(mulmoScript.value);
  await window.electronAPI.mulmoHandler("mulmoImageGenerate", projectId.value, index);
  console.log(index);
};
const generateAudio = async (index) => {
  await window.electronAPI.mulmoHandler("mulmoAudioGenerate", projectId.value, index);
  console.log(index);
};

const bufferToUrl = (buffer: Buffer, mimeType: string) => {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  return url;
};

const audioFiles = ref<(ArrayBuffer | null)[]>([]);
const imageFiles = ref<(ArrayBuffer | null)[]>([]);
const downloadAudioFiles = async () => {
  console.log("audioFiles");
  const res = await window.electronAPI.mulmoHandler("mulmoAudioFiles", projectId.value);
  console.log(res);
  audioFiles.value = res.map((buffer) => {
    if (buffer) {
      return bufferToUrl(buffer, "audio/mp3");
    }
    return "";
  });
  console.log(audioFiles.value);
};
const downloadImageFiles = async () => {
  const res2 = await window.electronAPI.mulmoHandler("mulmoImageFiles", projectId.value);
  console.log(res2);
  imageFiles.value = res2.map((data) => {
    if (data && data.imageData) {
      return bufferToUrl(data.imageData, "image/png");
    }
    return "";
  });
  console.log(imageFiles.value);
};
downloadAudioFiles();
downloadImageFiles();

const isValidScriptData = ref(true);

const logContainer = ref<HTMLElement | null>(null);
const validateLog = computed(() => {
  // mulmoScriptSchema.parse(mulmoScript.value)
  return [];
});

const videoUrl = ref("");
const playVideo = async (callback?: () => void) => {
  const buffer = await window.electronAPI.mulmoHandler("downloadFile", projectId.value, "movie");
  videoUrl.value = bufferToUrl(buffer, "video/mp4");
  if (callback) {
    callback();
  }
};

watch(
  () => store.mulmoEvent[projectId.value],
  async (mulmoEvent) => {
    // session
    if (mulmoEvent && mulmoEvent.kind === "session" && mulmoEvent.sessionType === "video" && !mulmoEvent.inSession) {
      playVideo();
    }
    // beats
    if (mulmoEvent && mulmoEvent.kind === "beat" && mulmoEvent.sessionType === "image" && !mulmoEvent.inSession) {
      const data = await window.electronAPI.mulmoHandler("mulmoImageFile", projectId.value, mulmoEvent.index);
      if (data && data.imageData) {
        imageFiles.value[mulmoEvent.index] = bufferToUrl(data.imageData, "image/png");
      }
    }
    if (mulmoEvent && mulmoEvent.kind === "beat" && mulmoEvent.sessionType === "audio" && !mulmoEvent.inSession) {
      const res = await window.electronAPI.mulmoHandler("mulmoAudioFile", projectId.value, mulmoEvent.index);
      if (res) {
        audioFiles.value[mulmoEvent.index] = bufferToUrl(res, "audio/mp3");
      }
    }
    console.log(mulmoEvent);
  },
  { immediate: true },
);

const debugLog = computed(() => store?.graphaiDebugLog[projectId.value]);

watch(
  () => debugLog,
  () => {
    logContainer.value?.scrollTo({ top: logContainer.value.scrollHeight });
  },
  { deep: true },
);
</script>
