<template>
  <Tabs class="w-full" v-model="currentTab">
    <TabsList class="grid w-full grid-cols-6">
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.TEXT">Text</TabsTrigger>
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.YAML">YAML</TabsTrigger>
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.JSON">JSON</TabsTrigger>
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.MEDIA">Media</TabsTrigger>
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.STYLE">Style</TabsTrigger>
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.REFERENCE">Ref</TabsTrigger>
    </TabsList>

    <div
      v-if="mulmoError?.script && hasScriptError"
      class="mt-2 w-full rounded border border-red-500 bg-red-100 p-2 text-sm text-red-800"
    >
      <div v-for="(message, key) in Object.values(mulmoError?.script ?? {}).flat()" :key="key">
        {{ message }}
      </div>
    </div>

    <TabsContent :value="SCRIPT_EDITOR_TABS.TEXT" class="mt-2">
      <div
        class="max-h-[calc(100vh-340px)] min-h-[400px] space-y-6 overflow-y-auto rounded-lg border bg-gray-50 p-4 font-mono text-sm"
      >
        <p class="mb-2 text-sm text-gray-500">Text Mode - Speaker and dialogue editing only</p>
        <div class="mx-auto space-y-2">
          <div class="px-2 py-1">
            <BeatSelector @emitBeat="(beat) => addBeat(beat, -1)" buttonKey="insert" />
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
            <div v-for="(beat, index) in safeBeats ?? []" :key="beat?.id ?? index" class="relative">
              <Card class="gap-2 space-y-1 p-4">
                <TextEditor
                  :index="index"
                  :beat="beat"
                  :audioFile="audioFiles[index]"
                  :projectId="projectId"
                  @update="update"
                />
              </Card>
              <div
                class="absolute -top-5 right-0 z-10 flex items-center gap-3 rounded border border-gray-300 bg-white px-2 py-1 shadow-sm"
              >
                <ArrowUp
                  v-if="index !== 0"
                  @click="() => positionUp(index)"
                  class="h-5 w-5 cursor-pointer text-gray-500 transition hover:text-blue-500"
                />
                <ArrowDown
                  v-if="(mulmoValue?.beats ?? []).length !== index + 1"
                  @click="() => positionUp(index + 1)"
                  class="h-5 w-5 cursor-pointer text-gray-500 transition hover:text-blue-500"
                />
                <Trash
                  @click="deleteBeat(index)"
                  class="h-5 w-5 cursor-pointer text-gray-500 transition hover:text-red-500"
                />
              </div>
              <div class="px-4 pt-2">
                <BeatSelector @emitBeat="(beat) => addBeat(beat, index)" buttonKey="insert" />
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </TabsContent>
    <TabsContent :value="SCRIPT_EDITOR_TABS.YAML" class="mt-4">
      <div
        :class="[
          'mb-[2px] flex h-[calc(100vh-340px)] flex-col rounded-lg border bg-gray-50 p-4',
          { 'outline outline-2 outline-red-400': !isValidScriptData },
        ]"
      >
        <p class="mb-2 text-sm text-gray-500">YAML Mode - Complete MulmoScript editing</p>
        <div class="min-h-0 flex-1" style="height: 0">
          <CodeEditor
            v-model="yamlText"
            language="yaml"
            :jsonSchema="mulmoJsonSchema"
            @update:modelValue="onYamlInput"
            @focus="onFocus"
            @blur="onBlur"
            minHeight="100%"
          />
        </div>
      </div>
    </TabsContent>

    <TabsContent :value="SCRIPT_EDITOR_TABS.JSON" class="mt-4">
      <div
        :class="[
          'mb-[2px] flex h-[calc(100vh-340px)] flex-col rounded-lg border bg-gray-50 p-4',
          { 'outline outline-2 outline-red-400': !isValidScriptData },
        ]"
      >
        <p class="mb-2 text-sm text-gray-500">JSON Mode - Complete MulmoScript editing</p>
        <div class="min-h-0 flex-1" style="height: 0">
          <CodeEditor
            v-model="jsonText"
            language="json"
            :jsonSchema="mulmoJsonSchema"
            @update:modelValue="onJsonInput"
            @focus="onFocus"
            @blur="onBlur"
            minHeight="100%"
          />
        </div>
      </div>
    </TabsContent>

    <TabsContent :value="SCRIPT_EDITOR_TABS.MEDIA" class="mt-4">
      <div class="max-h-[calc(100vh-340px)] min-h-[400px] overflow-y-auto rounded-lg border bg-gray-50 p-4">
        <p class="mb-2 text-sm text-gray-500">Media Mode - Beat-by-beat media editing and preview</p>

        <div class="mx-auto space-y-2">
          <div class="px-2 py-1">
            <BeatSelector @emitBeat="(beat) => addBeat(beat, -1)" buttonKey="insert" />
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
            <div v-for="(beat, index) in safeBeats" :key="beat?.id ?? index" class="relative">
              <Card class="p-4">
                <BeatEditor
                  :beat="beat"
                  :mulmoScript="mulmoValue"
                  :index="index"
                  :isEnd="(mulmoValue?.beats ?? []).length === index + 1"
                  :imageFile="imageFiles[index]"
                  :movieFile="movieFiles[index]"
                  :mulmoError="mulmoError?.['beats']?.[index] ?? []"
                  @update="update"
                  @generateImage="generateImage"
                  @changeBeat="changeBeat"
                />
              </Card>
              <div
                class="absolute -top-5 right-0 z-10 flex items-center gap-3 rounded border border-gray-300 bg-white px-2 py-1 shadow-sm"
              >
                <ArrowUp
                  v-if="index !== 0"
                  @click="() => positionUp(index)"
                  class="h-5 w-5 cursor-pointer text-gray-500 transition hover:text-blue-500"
                />
                <ArrowDown
                  v-if="(mulmoValue?.beats ?? []).length !== index + 1"
                  @click="() => positionUp(index + 1)"
                  class="h-5 w-5 cursor-pointer text-gray-500 transition hover:text-blue-500"
                />
                <Trash
                  @click="deleteBeat(index)"
                  class="h-5 w-5 cursor-pointer text-gray-500 transition hover:text-red-500"
                />
              </div>
              <div class="px-4 pt-2">
                <BeatSelector @emitBeat="(beat) => addBeat(beat, index)" buttonKey="insert" />
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </TabsContent>
    <TabsContent :value="SCRIPT_EDITOR_TABS.STYLE" class="mt-4">
      <div class="max-h-[calc(100vh-340px)] min-h-[400px] overflow-y-auto rounded-lg border bg-gray-50 p-4">
        <p class="mb-2 text-sm text-gray-500">Style - Presentation style editing</p>
        <PresentationStyleEditor
          :presentationStyle="mulmoValue"
          @update:presentationStyle="updatePresentationStyle"
          :mulmoError="mulmoError"
        />
      </div>
    </TabsContent>
    <TabsContent :value="SCRIPT_EDITOR_TABS.REFERENCE" class="mt-4">
      <div class="max-h-[calc(100vh-340px)] min-h-[400px] overflow-y-auto rounded-lg border bg-gray-50 p-4">
        <Reference
          :projectId="projectId"
          :images="props.mulmoValue?.imageParams?.images ?? {}"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui";
import CodeEditor from "@/components/code_editor.vue";

import BeatEditor from "./script_editor/beat_editor.vue";
import BeatSelector from "./script_editor/beat_selector.vue";
import PresentationStyleEditor from "./script_editor/presentation_style_editor.vue";
import Reference from "./script_editor/reference.vue";
import TextEditor from "./script_editor/text_editor.vue";

import { ArrowUp, ArrowDown, Trash } from "lucide-vue-next";

import YAML from "yaml";
import {
  mulmoScriptSchema,
  type MulmoScript,
  type MulmoBeat,
  type MulmoPresentationStyle,
  type MulmoImagePromptMedia,
  type MulmoImageMedia,
} from "mulmocast/browser";
import { zodToJsonSchema } from "zod-to-json-schema";
import { useRoute } from "vue-router";

import { MulmoError } from "../../../types";
import { removeEmptyValues } from "@/lib/utils";
import { arrayPositionUp, arrayInsertAfter, arrayRemoveAt } from "@/lib/array";
import { SCRIPT_EDITOR_TABS, type ScriptEditorTab } from "../../../shared/constants";

import { setRandomBeatId } from "@/lib/beat_util";

interface Props {
  mulmoValue: MulmoScript;
  isValidScriptData: boolean;
  imageFiles: (string | null)[];
  movieFiles: (string | null)[];
  audioFiles: (string | null)[];
  mulmoError: MulmoError | null;
  scriptEditorActiveTab?: ScriptEditorTab;
}

const props = defineProps<Props>();
const emit = defineEmits([
  "update:mulmoValue",
  "update:isValidScriptData",
  "generateImage",
  "formatAndPushHistoryMulmoScript",
  "addBeat",
  "deleteBeat",
  "positionUp",
  "update:scriptEditorActiveTab",
  "saveMulmo",
]);

const route = useRoute();
const projectId = computed(() => route.params.id as string);

const currentTab = ref<ScriptEditorTab>(props.scriptEditorActiveTab || SCRIPT_EDITOR_TABS.TEXT);
const lastTab = ref<ScriptEditorTab>(props.scriptEditorActiveTab || SCRIPT_EDITOR_TABS.TEXT);

const safeBeats = computed(() => {
  return props.mulmoValue?.beats ?? [];
});

watch(currentTab, () => {
  if (
    !props.isValidScriptData &&
    ![SCRIPT_EDITOR_TABS.JSON, SCRIPT_EDITOR_TABS.YAML].includes(currentTab.value as "yaml" | "json")
  ) {
    currentTab.value = lastTab.value;
  } else {
    lastTab.value = currentTab.value;
    emit("formatAndPushHistoryMulmoScript");
    emit("update:scriptEditorActiveTab", currentTab.value);
  }
});

const mulmoJsonSchema = zodToJsonSchema(mulmoScriptSchema);

const jsonText = ref("");
const yamlText = ref("");
const internalValue = ref({});
const syncTextFromInternal = () => {
  jsonText.value = JSON.stringify(internalValue.value, null, 2);
  yamlText.value = YAML.stringify(internalValue.value);
};

const isEditing = ref(false);
const onFocus = () => {
  isEditing.value = true;
};
const onBlur = () => {
  isEditing.value = false;
};
const hasScriptError = computed(() => {
  return Object.values(props.mulmoError?.script ?? {}).flat().length;
});

watch(isEditing, () => {
  if (isEditing.value) {
    syncTextFromInternal();
  }
});

watch(
  () => props.mulmoValue,
  (newVal) => {
    internalValue.value = { ...newVal };
    if (!isEditing.value) {
      syncTextFromInternal();
    }
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
    emit("update:mulmoValue", parsed);
    emit("update:isValidScriptData", true);
  } catch (err) {
    console.log(err);
    emit("update:isValidScriptData", false);
  }
};

const onYamlInput = (value: string) => {
  yamlText.value = value;
  try {
    const parsed = YAML.parse(value);
    internalValue.value = parsed;
    jsonText.value = JSON.stringify(parsed, null, 2);
    emit("update:mulmoValue", parsed);
    emit("update:isValidScriptData", true);
  } catch (err) {
    console.log(err);
    emit("update:isValidScriptData", false);
  }
};

const update = (index: number, path: string, value: unknown) => {
  const set = (obj: Record<string, unknown>, keys: string[], val: unknown): Record<string, unknown> =>
    keys.length === 1
      ? { ...obj, [keys[0]]: val }
      : {
          ...obj,
          [keys[0]]: set(obj[keys[0]] as Record<string, unknown>, keys.slice(1), val),
        };
  const newBeat = set(props.mulmoValue.beats[index], path.split("."), value);
  const newBeats = [...props.mulmoValue.beats.slice(0, index), newBeat, ...props.mulmoValue.beats.slice(index + 1)];

  emit("update:mulmoValue", {
    ...props.mulmoValue,
    beats: newBeats,
  });
};

// end of mulmo editor

const generateImage = (index: number, target: string) => {
  emit("generateImage", index, target);
};

const deleteBeat = (index: number) => {
  if (index >= 0 && index < props.mulmoValue.beats.length) {
    const newBeats = arrayRemoveAt(props.mulmoValue.beats, index);
    emit("update:mulmoValue", {
      ...props.mulmoValue,
      beats: newBeats,
    });
    emit("deleteBeat", index);
  }
};
const positionUp = (index: number) => {
  if (index <= 0 || index >= props.mulmoValue.beats.length) return;
  const newBeats = arrayPositionUp<MulmoBeat>(props.mulmoValue.beats, index);
  emit("update:mulmoValue", {
    ...props.mulmoValue,
    beats: newBeats,
  });
  emit("positionUp", index);
};

const changeBeat = (beat: MulmoBeat, index: number) => {
  const newBeats = [...props.mulmoValue.beats];
  newBeats[index] = beat;
  emit("update:mulmoValue", {
    ...props.mulmoValue,
    beats: newBeats,
  });
};

const addBeat = (beat: MulmoBeat, index: number) => {
  const newBeats = arrayInsertAfter(props.mulmoValue.beats, index, setRandomBeatId(beat));
  emit("update:mulmoValue", {
    ...props.mulmoValue,
    beats: newBeats,
  });
  emit("addBeat", index);
};

const updatePresentationStyle = (style: Partial<MulmoPresentationStyle>) => {
  emit("update:mulmoValue", {
    ...props.mulmoValue,
    ...removeEmptyValues(style),
  });
};

const updateImage = (imageKey: string, prompt: string) => {
  const currentImages = props.mulmoValue?.imageParams?.images ?? {};

  const updatedImages = {
    ...currentImages,
    [imageKey]: {
      ...(currentImages[imageKey] ?? {}),
      prompt,
    },
  };

  const updatedImageParams = {
    ...props.mulmoValue?.imageParams,
    images: updatedImages,
  };

  emit("update:mulmoValue", {
    ...props.mulmoValue,
    imageParams: updatedImageParams,
  });
};

const updateImagePath = (imageKey: string, path: string) => {
  const currentImages = props.mulmoValue?.imageParams?.images ?? {};
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
    ...props.mulmoValue?.imageParams,
    images: updatedImages,
  };

  emit("update:mulmoValue", {
    ...props.mulmoValue,
    imageParams: updatedImageParams,
  });
  emit("saveMulmo");
  emit("formatAndPushHistoryMulmoScript");
};

const addReferenceImage = (imageKey: string, data: MulmoImageMedia | MulmoImagePromptMedia) => {
  const currentImages = props.mulmoValue?.imageParams?.images ?? {};
  const updatedImages = {
    ...currentImages,
    [imageKey]: data,
  };
  const updatedImageParams = {
    ...props.mulmoValue?.imageParams,
    images: updatedImages,
  };

  emit("update:mulmoValue", {
    ...props.mulmoValue,
    imageParams: updatedImageParams,
  });
  emit("formatAndPushHistoryMulmoScript");
};

const deleteReferenceImage = (imageKey: string) => {
  const currentImages = props.mulmoValue?.imageParams?.images ?? {};
  const { [imageKey]: __, ...updatedImages } = currentImages;

  const updatedImageParams = {
    ...props.mulmoValue?.imageParams,
    images: updatedImages,
  };

  emit("update:mulmoValue", {
    ...props.mulmoValue,
    imageParams: updatedImageParams,
  });
  emit("formatAndPushHistoryMulmoScript");
};
</script>
