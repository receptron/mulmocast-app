<template>
  <Tabs class="w-full" :model-value="currentTab" @update:model-value="handleUpdateScriptEditorActiveTab">
    <TabsList class="grid w-full grid-cols-5" v-if="globalStore.userIsPro">
      <TabsTrigger
        :value="SCRIPT_EDITOR_TABS.MEDIA"
        data-testid="script-editor-tab-media"
        :class="mulmoScriptHistoryStore.hasBeatSchemaError ? 'border-2 border-red-400' : ''"
        >{{ t("project.scriptEditor.media.tabLabel", { beats: countOfBeats }) }}</TabsTrigger
      >
      <TabsTrigger
        :value="SCRIPT_EDITOR_TABS.REFERENCE"
        data-testid="script-editor-tab-reference"
        :class="mulmoScriptHistoryStore.hasImageParamsSchemaError ? 'border-2 border-red-400' : ''"
        >{{
          t(
            globalStore.userIsPro
              ? "project.scriptEditor.reference.tabLabelShort"
              : "project.scriptEditor.reference.tabLabel",
          )
        }}</TabsTrigger
      >
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.STYLE" data-testid="script-editor-tab-style">{{
        t(globalStore.userIsPro ? "project.scriptEditor.style.tabLabelShort" : "project.scriptEditor.style.tabLabel")
      }}</TabsTrigger>
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.TEXT" data-testid="script-editor-tab-text">{{
        t("project.scriptEditor.text.tabLabel")
      }}</TabsTrigger>
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.YAML" data-testid="script-editor-tab-yaml" v-if="false">{{
        t("project.scriptEditor.yaml.tabLabel")
      }}</TabsTrigger>
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.JSON" data-testid="script-editor-tab-json">{{
        t("project.scriptEditor.json.tabLabel")
      }}</TabsTrigger>
    </TabsList>

    <!-- Style Info Display -->
    <StyleInfoDisplay v-if="globalStore.userIsPro" :mulmoScript="mulmoScript" />

    <TabsList class="grid w-full grid-cols-3" v-if="!globalStore.userIsPro">
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.MEDIA" data-testid="script-editor-tab-media">{{
        t("project.scriptEditor.media.tabLabel", { beats: countOfBeats })
      }}</TabsTrigger>
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.REFERENCE" data-testid="script-editor-tab-reference">{{
        t("project.scriptEditor.reference.tabLabel")
      }}</TabsTrigger>
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.STYLE" data-testid="script-editor-tab-style">{{
        t("project.scriptEditor.style.tabLabel")
      }}</TabsTrigger>
    </TabsList>
    <div
      v-if="(mulmoError?.script && hasScriptError) || hasZodError"
      class="border-destructive bg-destructive/10 text-destructive mt-2 w-full rounded border p-2 text-sm"
    >
      <div v-for="(message, key) in Object.values(mulmoError?.script ?? {}).flat()" :key="key">
        {{ message }}
      </div>

      <div v-for="objectKey in Object.keys(zodErrors ?? {})" :key="objectKey">
        <div v-if="zodErrors[objectKey].length > 0">
          <div v-for="(error, index) in zodErrors[objectKey]" key="${objectKey}_${index}">
            {{ objectKey }}:{{ zodErrors[objectKey]?.[index] }}
          </div>
        </div>
      </div>
    </div>

    <TabsContent :value="SCRIPT_EDITOR_TABS.TEXT" class="mt-2">
      <div
        class="border-border bg-muted/50 max-h-[calc(100vh-340px)] min-h-[400px] space-y-6 overflow-y-auto rounded-lg border p-4 font-mono text-sm"
      >
        <p class="text-muted-foreground mb-2 text-sm">
          {{ t("project.scriptEditor.text.mode") }} - {{ t("project.scriptEditor.text.modeDescription") }}
        </p>
        <div class="mx-auto space-y-2">
          <div class="px-2 py-1">
            <BeatSelector
              @emitBeat="(beat, beatType) => addBeat(beat, -1, beatType)"
              buttonKey="insert"
              :isPro="globalStore.userIsPro"
              :defaultBeatType="lastSelectedBeatType"
            />
          </div>

          <TransitionGroup
            name="beat-list"
            tag="div"
            class="space-y-2"
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-2 scale-95"
            leave-active-class="transition-all duration-300 ease-in"
            leave-to-class="opacity-0 translate-y-2 scale-95"
            move-class="transition-all duration-300 ease-in-out"
          >
            <div v-for="(beat, index) in mulmoScript?.beats ?? []" :key="beat?.id ?? index" class="relative">
              <Card class="gap-2 space-y-1 p-4" :class="isValidBeats[index] ? '' : 'border-2 border-red-400'">
                <TextEditor
                  :index="index"
                  :beat="beat"
                  :audioFile="audioFiles[beat.id]"
                  :projectId="projectId"
                  :mulmoScript="mulmoScript"
                  :lang="mulmoScript.lang ?? globalStore.settings.APP_LANGUAGE"
                  :mulmoMultiLingual="mulmoMultiLinguals?.[beatId(beat?.id, index)]?.multiLingualTexts"
                  :speakers="mulmoScript?.speechParams?.speakers ?? {}"
                  :isValidBeat="isValidBeats[index]"
                  :isArtifactGenerating="isArtifactGenerating"
                  @update="update"
                  @updateMultiLingual="updateMultiLingual"
                  @justSaveAndPushToHistory="justSaveAndPushToHistory"
                />
              </Card>
              <div
                class="border-border bg-card absolute -top-5 right-0 z-10 flex items-center gap-3 rounded border px-2 py-1 shadow-sm"
              >
                <ArrowUp
                  v-if="index !== 0"
                  @click="() => positionUp(index)"
                  class="text-muted-foreground hover:text-primary h-5 w-5 cursor-pointer transition"
                />
                <ArrowDown
                  v-if="(mulmoScript?.beats ?? []).length !== index + 1"
                  @click="() => positionUp(index + 1)"
                  class="text-muted-foreground hover:text-primary h-5 w-5 cursor-pointer transition"
                />
                <Copy
                  @click="copyBeat(index)"
                  class="text-muted-foreground hover:text-primary h-5 w-5 cursor-pointer transition"
                  :data-testid="`script-editor-text-tab-copy-beat-${index}`"
                />
                <Trash
                  @click="deleteBeat(index)"
                  class="text-muted-foreground hover:text-destructive h-5 w-5 cursor-pointer transition"
                  :data-testid="`script-editor-text-tab-delete-beat-${index}`"
                />
              </div>
              <div class="px-4 pt-2">
                <BeatSelector
                  @emitBeat="(beat, beatType) => addBeat(beat, index, beatType)"
                  buttonKey="insert"
                  :isPro="globalStore.userIsPro"
                  :defaultBeatType="lastSelectedBeatType"
                />
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </TabsContent>
    <TabsContent :value="SCRIPT_EDITOR_TABS.YAML" class="mt-4">
      <div
        :class="[
          'border-border bg-muted/50 mb-[2px] flex h-[calc(100vh-340px)] flex-col rounded-lg border p-4',
          { 'outline outline-2 outline-red-400': !isValidScriptData },
        ]"
      >
        <p class="text-muted-foreground mb-2 text-sm">
          {{ t("project.scriptEditor.yaml.mode") }} - {{ t("project.scriptEditor.yaml.modeDescription") }}
        </p>
        <div class="min-h-0 flex-1" style="height: 0">
          <CodeEditor
            v-model="yamlText"
            language="yaml"
            :jsonSchema="mulmoJsonSchema"
            @update:modelValue="onYamlInput"
            minHeight="100%"
          />
        </div>
      </div>
    </TabsContent>

    <TabsContent :value="SCRIPT_EDITOR_TABS.JSON" class="mt-4">
      <div
        :class="[
          'border-border bg-muted/50 mb-[2px] flex h-[calc(100vh-340px)] flex-col rounded-lg border p-4',
          { 'outline outline-2 outline-red-400': !isValidScriptData },
        ]"
      >
        <p class="text-muted-foreground mb-2 text-sm">
          {{ t("project.scriptEditor.json.mode") }} - {{ t("project.scriptEditor.json.modeDescription") }}
        </p>
        <div class="min-h-0 flex-1" style="height: 0">
          <CodeEditor
            v-model="jsonText"
            language="json"
            :jsonSchema="mulmoJsonSchema"
            @update:modelValue="onJsonInput"
            minHeight="100%"
          />
        </div>
      </div>
    </TabsContent>

    <TabsContent :value="SCRIPT_EDITOR_TABS.MEDIA" class="mt-4">
      <div
        class="border-border bg-muted/50 max-h-[calc(100vh-340px)] min-h-[400px] overflow-y-auto rounded-lg border p-4"
      >
        <p class="text-muted-foreground mb-2 text-sm">
          {{ t("project.scriptEditor.media.mode") }} - {{ t("project.scriptEditor.media.modeDescription") }}
        </p>

        <div class="mx-auto space-y-2">
          <div class="px-2 py-1">
            <BeatSelector
              @emitBeat="(beat, beatType) => addBeat(beat, -1, beatType)"
              buttonKey="insert"
              :isPro="globalStore.userIsPro"
              :defaultBeatType="lastSelectedBeatType"
            />
          </div>

          <TransitionGroup
            name="beat-list"
            tag="div"
            class="space-y-2"
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-2 scale-95"
            leave-active-class="transition-all duration-300 ease-in"
            leave-to-class="opacity-0 translate-y-2 scale-95"
            move-class="transition-all duration-300 ease-in-out"
          >
            <div v-for="(beat, index) in mulmoScript?.beats ?? []" :key="beat?.id ?? index" class="relative">
              <Card class="p-4" :class="isValidBeats[index] ? '' : 'border-2 border-red-400'">
                <BeatEditor
                  :beat="beat"
                  :mulmoScript="mulmoScript"
                  :index="index"
                  :isEnd="(mulmoScript?.beats ?? []).length === index + 1"
                  :isPro="globalStore.userIsPro"
                  :isBeginner="globalStore.userIsBeginner"
                  :isValidBeat="isValidBeats[index]"
                  :isArtifactGenerating="isArtifactGenerating"
                  :lang="mulmoScript.lang ?? globalStore.settings.APP_LANGUAGE"
                  :audioFile="audioFiles[beat.id]"
                  :imageFile="imageFiles[beat.id]"
                  :movieFile="movieFiles[beat.id]"
                  :lipSyncFiles="lipSyncFiles[beat.id]"
                  :imageFiles="imageFiles"
                  :movieFiles="movieFiles"
                  :mulmoError="mulmoError?.['beats']?.[index] ?? []"
                  :settingPresence="settingPresence"
                  @update="update"
                  @updateImageData="(data, callback) => updateImageData(index)(data, callback)"
                  @generateImage="generateImage"
                  @changeBeat="changeBeat"
                  @justSaveAndPushToHistory="justSaveAndPushToHistory"
                  @imageRestored="handleImageRestored"
                  @movieRestored="handleMovieRestored"
                  @audioUploaded="(index, beatId) => emit('audioUploaded', index, beatId)"
                  @audioRemoved="(index, beatId) => emit('audioRemoved', index, beatId)"
                  @audioGenerated="(index, beatId) => emit('audioGenerated', index, beatId)"
                />
              </Card>
              <div
                class="border-border bg-card absolute -top-5 right-0 z-10 flex items-center gap-3 rounded border px-2 py-1 shadow-sm"
              >
                <ArrowUp
                  v-if="index !== 0"
                  @click="() => positionUp(index)"
                  class="text-muted-foreground hover:text-primary h-5 w-5 cursor-pointer transition"
                />
                <ArrowDown
                  v-if="(mulmoScript?.beats ?? []).length !== index + 1"
                  @click="() => positionUp(index + 1)"
                  class="text-muted-foreground hover:text-primary h-5 w-5 cursor-pointer transition"
                />
                <Copy
                  @click="copyBeat(index)"
                  class="text-muted-foreground hover:text-primary h-5 w-5 cursor-pointer transition"
                  :data-testid="`script-editor-media-tab-copy-beat-${index}`"
                />
                <Trash
                  @click="deleteBeat(index)"
                  class="text-muted-foreground hover:text-destructive h-5 w-5 cursor-pointer transition"
                  :data-testid="`script-editor-media-tab-delete-beat-${index}`"
                />
              </div>
              <div class="px-4 pt-2">
                <BeatSelector
                  @emitBeat="(beat, beatType) => addBeat(beat, index, beatType)"
                  buttonKey="insert"
                  :isPro="globalStore.userIsPro"
                  :defaultBeatType="lastSelectedBeatType"
                />
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </TabsContent>
    <TabsContent :value="SCRIPT_EDITOR_TABS.STYLE" class="mt-4">
      <div
        class="border-border bg-muted/50 max-h-[calc(100vh-340px)] min-h-[400px] overflow-y-auto rounded-lg border p-4"
      >
        <p class="text-muted-foreground mb-2 text-sm">
          {{ t("project.scriptEditor.style.mode") }} - {{ t("project.scriptEditor.style.modeDescription") }}
        </p>
        <PresentationStyle
          :projectId="projectId"
          :presentationStyle="mulmoScript"
          @update:presentationStyle="updatePresentationStyle"
          :mulmoError="mulmoError"
          :settingPresence="settingPresence"
          :mulmoScript="mulmoScript"
        />
      </div>
    </TabsContent>
    <TabsContent :value="SCRIPT_EDITOR_TABS.REFERENCE" class="mt-4">
      <div
        class="border-border bg-muted/50 max-h-[calc(100vh-340px)] min-h-[400px] overflow-y-auto rounded-lg border p-4"
      >
        <p class="text-muted-foreground mb-2 text-sm">
          {{ t("project.scriptEditor.reference.mode") }} -
          {{ t("project.scriptEditor.reference.modeDescription") }}
        </p>
        <p class="text-muted-foreground text-sm whitespace-pre-line">
          {{
            t("project.scriptEditor.reference.description", {
              key: t("beat.imageReference.keyField"),
              imageParamsImages: t("parameters.imageParams.images"),
            })
          }}
        </p>
        <Charactor
          :projectId="projectId"
          :images="props.mulmoScript?.imageParams?.images ?? {}"
          :mulmoScript="mulmoScript"
          :isArtifactGenerating="isArtifactGenerating"
          :isValidScriptData="isValidScriptData"
          @updateImage="updateImage"
          @updateImagePath="updateImagePath"
          @addReferenceImage="addReferenceImage"
          @deleteReferenceImage="deleteReferenceImage"
        />
      </div>
    </TabsContent>
  </Tabs>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { ArrowUp, ArrowDown, Trash, Copy } from "lucide-vue-next";
import YAML from "yaml";
import {
  MulmoPresentationStyleMethods,
  mulmoScriptSchema,
  mulmoBeatSchema,
  beatId,
  defaultSpeaker,
  type MulmoScript,
  type MulmoBeat,
  type MulmoPresentationStyle,
  type MulmoImagePromptMedia,
  type MulmoImageMedia,
  type MulmoImageAsset,
  type MultiLingualTexts,
} from "mulmocast/browser";
import { z } from "zod";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui";
import CodeEditor from "@/components/code_editor.vue";

import BeatEditor from "./script_editor/beat_editor.vue";
import BeatSelector from "./script_editor/beat_selector.vue";
import PresentationStyle from "./script_editor/presentation_style.vue";
import Charactor from "./script_editor/charactor.vue";
import TextEditor from "./script_editor/text_editor.vue";
import StyleInfoDisplay from "./script_editor/style_info_display.vue";

import { MulmoError } from "../../../types";
import { arrayPositionUp, arrayInsertAfter } from "@/lib/array";
import { SCRIPT_EDITOR_TABS, type ScriptEditorTab } from "../../../shared/constants";

import { setRandomBeatId } from "@/lib/beat_util";
import { projectApi } from "@/lib/project_api";
import { useMulmoGlobalStore, useMulmoScriptHistoryStore } from "@/store";
import { notifySuccess } from "@/lib/notification";

const { t } = useI18n();

interface Props {
  mulmoScript: MulmoScript;
  isValidScriptData: boolean;
  isArtifactGenerating: boolean;
  imageFiles: Record<string, string | null>;
  movieFiles: Record<string, string | null>;
  audioFiles: Record<string, string | null>;
  lipSyncFiles: Record<string, string | null>;
  mulmoError: MulmoError | null;
  scriptEditorActiveTab?: ScriptEditorTab;
  mulmoMultiLinguals: MultiLingualTexts;
}

const props = defineProps<Props>();
const emit = defineEmits([
  "updateMulmoScript",
  "updateMulmoScriptAndPushToHistory",
  "formatAndPushHistoryMulmoScript",
  "generateImage",
  "update:scriptEditorActiveTab",
  "updateMultiLingual",
  "imageRestored",
  "movieRestored",
  "audioUploaded",
  "audioRemoved",
  "audioGenerated",
  "deleteBeat",
  "refreshBeatMedia",
]);

const route = useRoute();
const projectId = computed(() => route.params.id as string);
const globalStore = useMulmoGlobalStore();
const mulmoScriptHistoryStore = useMulmoScriptHistoryStore();

const currentTab = ref<ScriptEditorTab>(props.scriptEditorActiveTab || SCRIPT_EDITOR_TABS.TEXT);
const lastSelectedBeatType = ref<string | undefined>(undefined);

const handleUpdateScriptEditorActiveTab = (tab: ScriptEditorTab) => {
  /*
  if (!props.isValidScriptData) {
    return;
  }
  */
  emit("formatAndPushHistoryMulmoScript");
  emit("update:scriptEditorActiveTab", tab);
};

const settingPresence = computed(() => {
  return globalStore.settingPresence;
});

const updateMultiLingual = async () => {
  emit("updateMultiLingual");
};

const mulmoJsonSchema = z.toJSONSchema(mulmoScriptSchema);

const jsonText = ref("");
const yamlText = ref("");
const internalValue = ref({});
const syncTextFromInternal = () => {
  jsonText.value = JSON.stringify(internalValue.value, null, 2);
  yamlText.value = YAML.stringify(internalValue.value);
};

const hasScriptError = computed(() => {
  return Object.values(props.mulmoError?.script ?? {}).flat().length;
});

const zodErrors = computed(() => {
  const { beats: ___, script: __, ...errors } = props.mulmoError ?? {};
  return errors;
});

const hasZodError = computed(() => {
  return Object.values(zodErrors.value ?? {}).flat().length > 0;
});

watch(
  () => props.mulmoScript,
  (newVal) => {
    internalValue.value = { ...newVal };
    syncTextFromInternal();
  },
  { deep: true, immediate: true },
);

watch(
  () => props.scriptEditorActiveTab,
  (newTab) => {
    if (newTab && newTab !== currentTab.value) {
      currentTab.value = newTab;
    }
  },
);

const onJsonInput = (value: string) => {
  jsonText.value = value;
  try {
    const parsed = JSON.parse(value);
    internalValue.value = parsed;
    yamlText.value = YAML.stringify(parsed);
    emit("updateMulmoScript", parsed);
  } catch (err) {
    console.log(err);
  }
};

const onYamlInput = (value: string) => {
  yamlText.value = value;
  try {
    const parsed = YAML.parse(value);
    internalValue.value = parsed;
    jsonText.value = JSON.stringify(parsed, null, 2);
    emit("updateMulmoScript", parsed);
  } catch (err) {
    console.log(err);
  }
};

const countOfBeats = computed(() => {
  return props.mulmoScript.beats?.length || 0;
});

const update = (index: number, path: string, value: unknown) => {
  const set = (obj: Record<string, unknown>, keys: string[], val: unknown): Record<string, unknown> => {
    if (keys.length === 1) {
      if (val === undefined) {
        const { [keys[0]]: __, ...rest } = obj;
        return rest;
      }
      return { ...obj, [keys[0]]: val };
    }
    return {
      ...obj,
      [keys[0]]: set(obj[keys[0]] as Record<string, unknown>, keys.slice(1), val),
    };
  };
  const newBeat = set(props.mulmoScript.beats[index], path.split("."), value);
  const newBeats = [...props.mulmoScript.beats.slice(0, index), newBeat, ...props.mulmoScript.beats.slice(index + 1)];

  emit("updateMulmoScript", {
    ...props.mulmoScript,
    beats: newBeats,
  });
};
const updateImageData = (index: number) => {
  return async (data: MulmoImageAsset, callback?: () => void) => {
    const newBeat = { ...props.mulmoScript.beats[index], image: data };
    const newBeats = [...props.mulmoScript.beats.slice(0, index), newBeat, ...props.mulmoScript.beats.slice(index + 1)];

    const mulmo = {
      ...props.mulmoScript,
      beats: newBeats,
    };
    await projectApi.saveProjectScript(projectId.value, mulmo);
    emit("updateMulmoScript", {
      ...props.mulmoScript,
      beats: newBeats,
    });
    if (callback) {
      callback();
    }
  };
};

// end of mulmo editor

const generateImage = (index: number, target: string) => {
  emit("generateImage", index, target);
};

const handleImageRestored = () => {
  emit("imageRestored");
};

const handleMovieRestored = () => {
  emit("movieRestored");
};

const deleteBeat = (index: number) => {
  emit("deleteBeat", index);
};

const copyBeat = async (index: number) => {
  if (index >= 0 && index < props.mulmoScript.beats.length) {
    const sourceBeat = props.mulmoScript.beats[index];
    const sourceBeatId = sourceBeat.id;

    const { id: __, ...beatWithoutId } = sourceBeat;
    const newBeat = setRandomBeatId(beatWithoutId);
    const targetBeatId = newBeat.id;

    const newBeats = arrayInsertAfter(props.mulmoScript.beats, index, newBeat);
    emit("updateMulmoScriptAndPushToHistory", {
      ...props.mulmoScript,
      beats: newBeats,
    });

    // Copy media files (images, audio, video) associated with the beat
    if (sourceBeatId && targetBeatId) {
      try {
        await projectApi.copyBeatMediaFiles(projectId.value, sourceBeatId, targetBeatId);
        // Refresh media files to show the copied beat's media immediately
        emit("refreshBeatMedia", targetBeatId, index + 1);
      } catch (error) {
        console.error("Failed to copy beat media files:", error);
      }
    }

    notifySuccess(t("project.scriptEditor.beatCopied"));
  }
};

const positionUp = (index: number) => {
  if (index <= 0 || index >= props.mulmoScript.beats.length) return;
  const newBeats = arrayPositionUp<MulmoBeat>(props.mulmoScript.beats, index);
  emit("updateMulmoScriptAndPushToHistory", {
    ...props.mulmoScript,
    beats: newBeats,
  });
};

const changeBeat = (beat: MulmoBeat, index: number) => {
  const newBeats = [...props.mulmoScript.beats];
  newBeats[index] = beat;
  emit("updateMulmoScriptAndPushToHistory", {
    ...props.mulmoScript,
    beats: newBeats,
  });
};

const addBeat = (beat: MulmoBeat, index: number, beatType?: string) => {
  if (beatType) {
    lastSelectedBeatType.value = beatType;
  }
  beat.speaker = props.mulmoScript?.speechParams?.speakers
    ? MulmoPresentationStyleMethods.getDefaultSpeaker(props.mulmoScript)
    : defaultSpeaker;
  const newBeats = arrayInsertAfter(props.mulmoScript.beats, index, setRandomBeatId(beat));
  emit("updateMulmoScriptAndPushToHistory", {
    ...props.mulmoScript,
    beats: newBeats,
  });
};

const updatePresentationStyle = (style: Partial<MulmoPresentationStyle>) => {
  emit("updateMulmoScript", { ...style });
};

const updateImage = (imageKey: string, prompt: string) => {
  const currentImages = props.mulmoScript?.imageParams?.images ?? {};

  const updatedImages = {
    ...currentImages,
    [imageKey]: {
      ...(currentImages[imageKey] ?? {}),
      prompt,
    },
  };

  const updatedImageParams = {
    ...props.mulmoScript?.imageParams,
    images: updatedImages,
  };

  emit("updateMulmoScriptAndPushToHistory", {
    ...props.mulmoScript,
    imageParams: updatedImageParams,
  });
};

const updateImagePath = (imageKey: string, path: string) => {
  const currentImages = props.mulmoScript?.imageParams?.images ?? {};
  const updatedImages = {
    ...currentImages,
    [imageKey]: {
      ...(currentImages[imageKey] ?? {}),
      source: {
        ...(currentImages[imageKey]?.source ?? {}),
        path,
      },
    },
  };
  const updatedImageParams = {
    ...props.mulmoScript?.imageParams,
    images: updatedImages,
  };

  emit("updateMulmoScriptAndPushToHistory", {
    ...props.mulmoScript,
    imageParams: updatedImageParams,
  });
};

const addReferenceImage = (imageKey: string, data: MulmoImageMedia | MulmoImagePromptMedia) => {
  const currentImages = props.mulmoScript?.imageParams?.images ?? {};
  const updatedImages = {
    ...currentImages,
    [imageKey]: data,
  };
  const updatedImageParams = {
    ...props.mulmoScript?.imageParams,
    images: updatedImages,
  };

  emit("updateMulmoScriptAndPushToHistory", {
    ...props.mulmoScript,
    imageParams: updatedImageParams,
  });
};

const deleteReferenceImage = (imageKey: string) => {
  const currentImages = props.mulmoScript?.imageParams?.images ?? {};
  const { [imageKey]: __, ...updatedImages } = currentImages;

  const updatedImageParams = {
    ...props.mulmoScript?.imageParams,
    images: updatedImages,
  };

  emit("updateMulmoScriptAndPushToHistory", {
    ...props.mulmoScript,
    imageParams: updatedImageParams,
  });
};

const isValidBeat = (beat: MulmoBeat) => {
  const res = mulmoBeatSchema.safeParse(beat);
  return res?.success;
};

const isValidBeats = computed(() => {
  return props.mulmoScript?.beats.map(isValidBeat);
});

const justSaveAndPushToHistory = () => {
  emit("updateMulmoScriptAndPushToHistory", {
    ...props.mulmoScript,
  });
};
</script>
