<template>
  <Layout>
    <TooltipProvider>
      <div :class="`${isSplitView ? 'max-w-[95%]' : 'max-w-7xl'} mx-auto ${getCardPadding} ${getContainerSpacing}`">
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
          <div>
            <Button variant="outline" size="sm" @click="isSplitView = !isSplitView">
              <Columns :size="16" class="mr-2" />
              {{ isSplitView ? 'Single View' : 'Split View' }}
            </Button>
          </div>
        </div>

        <!-- Main Content Area -->
        <div v-if="!isSplitView" class="space-y-6">
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
                  <Button variant="ghost" size="sm" :disabled="!store.undoable" @click="store.undo">
                    <Undo :size="16" :class="store.undoable ? 'text-black' : 'text-gray-400'" />
                  </Button>
                  <Button variant="ghost" size="sm" :disabled="!store.redoable" @click="store.redo">
                    <Redo :size="16" :class="store.redoable ? 'text-black' : 'text-gray-400'" />
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
                  :mulmoValue="store.currentMulmoScript"
                  :imageFiles="imageFiles"
                  @update:mulmoValue="store.updateMulmoScript"
                  :isValidScriptData="isValidScriptData"
                  @update:isValidScriptData="(val) => (isValidScriptData = val)"
                  @generateImage="(val) => generateImage(val)"
                  @generateAudio="(val) => generateAudio(val)"
                  @formatAndPushHistoryMulmoScript="formatAndPushHistoryMulmoScript"
                  :audioFiles="audioFiles"
                  :mulmoError="mulmoError"
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
          </Collapsible>
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
          <ConcurrentTaskStatus :projectId="projectId" />
        </div>

        <!-- Split View Layout -->
        <div v-if="isSplitView" class="grid grid-cols-1 lg:grid-cols-[40%_1fr] gap-6 h-[calc(100vh-200px)]">
          <!-- Left Column -->
          <div class="space-y-6 overflow-y-auto pr-4">
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

          <!-- Right Column -->
          <div class="space-y-6 h-full">
            <!-- MulmoScript Viewer Section -->
            <Collapsible v-if="hasProjectData" v-model:open="isScriptViewerOpen" :class="`${getTimelineFocusClass} h-full`">
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
                      <Button variant="ghost" size="sm" :disabled="!store.undoable" @click="store.undo">
                        <Undo :size="16" :class="store.undoable ? 'text-black' : 'text-gray-400'" />
                      </Button>
                      <Button variant="ghost" size="sm" :disabled="!store.redoable" @click="store.redo">
                        <Redo :size="16" :class="store.redoable ? 'text-black' : 'text-gray-400'" />
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
                      :mulmoValue="store.currentMulmoScript"
                      :imageFiles="imageFiles"
                      @update:mulmoValue="store.updateMulmoScript"
                      :isValidScriptData="isValidScriptData"
                      @update:isValidScriptData="(val) => (isValidScriptData = val)"
                      @generateImage="(val) => generateImage(val)"
                      @generateAudio="(val) => generateAudio(val)"
                      @formatAndPushHistoryMulmoScript="formatAndPushHistoryMulmoScript"
                      :audioFiles="audioFiles"
                      :mulmoError="mulmoError"
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        </div>

        <ConcurrentTaskStatus :projectId="projectId" />
      </div>
    </TooltipProvider>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { isNull } from "graphai/lib/utils/utils";
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
  Columns,
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
import BeatsViewer from "./components/beats_viewer.vue";
import ProductTabs from "./components/product_tabs.vue";
import ConcurrentTaskStatus from "./components/concurrent_task_status.vue";
import dayjs from "dayjs";

import type { MulmoScript } from "mulmocast";
import { mulmoScriptSchema } from "mulmocast/browser";

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
import { ChatMessage, MulmoError } from "@/types";
import { notifySuccess } from "@/lib/notification";

import { zodError2MulmoError } from "../../lib/error";

// State
const route = useRoute();
const router = useRouter();

const store = useStore();

const projectId = computed(() => route.params.id as string);
const project = ref<ProjectMetadata | null>(null);

const hasProjectData = computed(() => true); // Todo

const isDevMode = ref(false);
const isSplitView = ref(false);

const validationMessage = ref("");

const currentBeatIndex = ref(0);
const timelinePosition = ref(0);
const isPreviewAreaVisible = ref(false);

// Load project data on mount
onMounted(async () => {
  try {
    project.value = await projectApi.getProjectMetadata(projectId.value);
    store.initMulmoScript(await projectApi.getProjectMulmoScript(projectId.value));
  } catch (error) {
    console.error("Failed to load project:", error);
    router.push("/");
  }
});

const handleUpdateScript = (script: MulmoScript) => {
  store.updateMulmoScript(script);
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

const saveMulmo = async (data) => {
  console.log("saved", data);
  await projectApi.saveProjectScript(projectId.value, store.currentMulmoScript);
  project.value.updatedAt = dayjs().toISOString();
  await projectApi.saveProjectMetadata(projectId.value, project.value);
};
const saveMulmoScript = useDebounceFn(saveMulmo, 1000);

watch(
  () => store.currentMulmoScript,
  () => {
    // Be careful not to save a page just by opening it.
    saveMulmoScript(store.currentMulmoScript);
  },
  { deep: true },
);

const beatsData = computed(() => store.currentMulmoScript?.beats ?? []);

const mulmoError = computed<MulmoError>(() => {
  const zodError = mulmoScriptSchema.safeParse(store.currentMulmoScript);
  if (!zodError.success) {
    return zodError2MulmoError(zodError.error);
  }
  return null;
});

const formatAndPushHistoryMulmoScript = () => {
  const data = mulmoScriptSchema.safeParse(store.currentMulmoScript);
  if (data.success) {
    data.data.beats.map((beat) => {
      if (isNull(beat.id)) {
        beat.id = crypto.randomUUID();
      }
      return beat;
    });
    store.updateMulmoScriptAndPushToHistory(data.data);
    // push store //
  }
  console.log(data);
};

const generateMovie = async () => {
  console.log("generateMovie");
  await window.electronAPI.mulmoHandler("mulmoActionRunner", projectId.value, "movie");
};

const generatePodcast = async () => {
  console.log("generateMovie");
  await window.electronAPI.mulmoHandler("mulmoActionRunner", projectId.value, "audio");
};

const generateImage = async (index) => {
  await saveMulmo(store.currentMulmoScript);
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
  // mulmoScriptSchema.parse(store.currentMulmoScript)
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
