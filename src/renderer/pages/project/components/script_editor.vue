<template>
  <Tabs class="w-full" v-model="currentTab">
    <TabsList class="grid w-full grid-cols-5">
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.TEXT">Text</TabsTrigger>
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.YAML">YAML</TabsTrigger>
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.JSON">JSON</TabsTrigger>
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.MEDIA">Media</TabsTrigger>
      <TabsTrigger :value="SCRIPT_EDITOR_TABS.STYLE">Style</TabsTrigger>
    </TabsList>

    <div
      v-if="mulmoError?.script && hasScriptError"
      class="w-full p-2 border border-red-500 bg-red-100 text-red-800 rounded text-sm mt-2"
    >
      <div v-for="(message, key) in Object.values(mulmoError?.script ?? {}).flat()" :key="key">
        {{ message }}
      </div>
    </div>

    <TabsContent :value="SCRIPT_EDITOR_TABS.TEXT" class="mt-2">
      <div
        class="border rounded-lg p-4 bg-gray-50 min-h-[400px] max-h-[calc(100vh-340px)] overflow-y-auto font-mono text-sm space-y-6"
      >
        <p class="text-sm text-gray-500 mb-2">Text Mode - Speaker and dialogue editing only</p>
        <div class="space-y-6 mx-auto">
          <Card class="px-4 py-0 border-0 bg-transparent shadow-none">
            <BeatAdd @addBeat="(beat) => addBeat(beat, -1)" />
          </Card>

          <template v-for="(beat, index) in safeBeats ?? []" :key="index">
            <div class="relative">
              <div class="absolute -top-5 right-0 z-10 flex items-center gap-1 px-2 py-1 rounded border border-gray-300 bg-white shadow-sm">
                <ArrowUp
                  v-if="index !== 0"
                  @click="positionUp(index)"
                  class="w-5 h-5 text-gray-500 hover:text-blue-500 cursor-pointer transition"
                />
                <ArrowDown
                  v-if="index !== (mulmoValue?.beats ?? []).length - 1"
                  @click="positionUp(index + 1)"
                  class="w-5 h-5 text-gray-500 hover:text-blue-500 cursor-pointer transition"
                />
                <Trash @click="deleteBeat(index)" class="w-5 h-5 text-gray-500 hover:text-red-500 cursor-pointer transition" />
              </div>
              <Card class="p-4 space-y-1 gap-2">
                <div class="font-bold text-gray-700 flex justify-between items-center">
                  <span>Beat {{ index + 1 }}</span>
                  <Badge variant="outline">{{ getBadge(beat) }}</Badge>
                </div>
                <div>
                  <Label>Speaker</Label>
                  <Input
                    :model-value="beat?.speaker"
                    @update:model-value="(value) => update(index, 'speaker', String(value))"
                    placeholder="e.g. Alice"
                    class="h-8"
                  />
                </div>
                <div>
                  <Label>Text</Label>
                  <Input
                    :model-value="beat.text"
                    @update:model-value="(value) => update(index, 'text', String(value))"
                    placeholder="e.g. What is AI?"
                    class="h-8"
                  />
                </div>
                <Button variant="outline" size="sm" @click="generateAudio(index)" class="w-fit">generate audio</Button>
                <span v-if="mulmoEventStore.sessionState?.[projectId]?.['beat']?.['audio']?.[index]">generating</span>
                <audio :src="audioFiles[index]" v-if="!!audioFiles[index]" controls />
              </Card>
            </div>
            <Card class="px-4 py-0 border-0 bg-transparent shadow-none">
              <BeatAdd @addBeat="(beat) => addBeat(beat, index)" />
            </Card>
          </template>
        </div>
      </div>
    </TabsContent>
    <TabsContent :value="SCRIPT_EDITOR_TABS.YAML" class="mt-4">
      <div
        :class="[
          'border rounded-lg p-4 bg-gray-50 h-[calc(100vh-340px)] flex flex-col mb-[2px]',
          { 'outline-red-400 outline-2 outline': !isValidScriptData },
        ]"
      >
        <p class="text-sm text-gray-500 mb-2">YAML Mode - Complete MulmoScript editing</p>
        <div class="flex-1 min-h-0" style="height: 0">
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
          'border rounded-lg p-4 bg-gray-50 h-[calc(100vh-340px)] flex flex-col mb-[2px]',
          { 'outline-red-400 outline-2 outline': !isValidScriptData },
        ]"
      >
        <p class="text-sm text-gray-500 mb-2">JSON Mode - Complete MulmoScript editing</p>
        <div class="flex-1 min-h-0" style="height: 0">
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
      <div class="border rounded-lg p-4 bg-gray-50 min-h-[400px] max-h-[calc(100vh-340px)] overflow-y-auto">
        <p class="text-sm text-gray-500 mb-2">Media Mode - Beat-by-beat media editing and preview</p>

        <div class="space-y-4">
          <Card class="px-4 py-0 border-0 bg-transparent shadow-none">
            <BeatAdd @addBeat="(beat) => addBeat(beat, -1)" />
          </Card>

          <template v-for="(beat, index) in safeBeats" :key="beat?.id ?? index">
            <div class="relative">
              <div class="absolute -top-5 right-0 z-10 flex items-center gap-1 px-2 py-1 rounded border border-gray-300 bg-white shadow-sm">
                <ArrowUp
                  v-if="index !== 0"
                  @click="positionUp(index)"
                  class="w-5 h-5 text-gray-500 hover:text-blue-500 cursor-pointer transition"
                />
                <ArrowDown
                  v-if="index !== (mulmoValue?.beats ?? []).length - 1"
                  @click="positionUp(index + 1)"
                  class="w-5 h-5 text-gray-500 hover:text-blue-500 cursor-pointer transition"
                />
                <Trash @click="deleteBeat(index)" class="w-5 h-5 text-gray-500 hover:text-red-500 cursor-pointer transition" />
              </div>
              <Card class="p-4">
                <BeatEditor
                  :beat="beat"
                  :index="index"
                  :isEnd="(mulmoValue?.beats ?? []).length === index + 1"
                  :imageFile="imageFiles[index]"
                  :movieFile="movieFiles[index]"
                  :mulmoError="mulmoError?.['beats']?.[index] ?? []"
                  @update="update"
                  @generateImage="generateImage"
                  @deleteBeat="deleteBeat"
                  @positionUp="positionUp"
                  @addBeat="addBeat"
                />
              </Card>
            </div>
            <Card class="px-4 py-0 border-0 bg-transparent shadow-none">
              <BeatAdd @addBeat="(beat) => addBeat(beat, index)" />
            </Card>
          </template>
        </div>
      </div>
    </TabsContent>
    <TabsContent :value="SCRIPT_EDITOR_TABS.STYLE" class="mt-4">
      <div class="border rounded-lg p-4 bg-gray-50 min-h-[400px] max-h-[calc(100vh-340px)] overflow-y-auto">
        <p class="text-sm text-gray-500 mb-2">Style - Presentation style editing</p>
        <PresentationStyleEditor
          :presentationStyle="mulmoValue"
          @update:presentationStyle="updatePresentationStyle"
          :mulmoError="mulmoError"
        />
      </div>
    </TabsContent>
  </Tabs>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowUp, ArrowDown, Trash } from "lucide-vue-next";
import BeatEditor from "./script_editor/beat_editor.vue";
import BeatAdd from "./script_editor/beat_add.vue";
import PresentationStyleEditor from "./script_editor/presentation_style_editor.vue";
import CodeEditor from "@/components/code_editor.vue";

import YAML from "yaml";
import { mulmoScriptSchema, type MulmoScript, type MulmoBeat, type MulmoPresentationStyle } from "mulmocast/browser";
import { zodToJsonSchema } from "zod-to-json-schema";
import { useMulmoEventStore } from "../../../store";
import { useRoute } from "vue-router";

import { MulmoError } from "../../../../types";
import { removeEmptyValues } from "@/lib/utils";
import { arrayPositionUp, arrayInsertAfter, arrayRemoveAt } from "@/lib/array";
import { SCRIPT_EDITOR_TABS, type ScriptEditorTab } from "../../../../shared/constants";

import { getBadge } from "@/lib/beat_util.js";

interface Props {
  mulmoValue: MulmoScript;
  isValidScriptData: boolean;
  imageFiles: (ArrayBuffer | null)[];
  movieFiles: (ArrayBuffer | null)[];
  audioFiles: (ArrayBuffer | null)[];
  mulmoError: MulmoError | null;
  scriptEditorActiveTab?: ScriptEditorTab;
}

const props = defineProps<Props>();
const emit = defineEmits([
  "update:mulmoValue",
  "update:isValidScriptData",
  "generateImage",
  "generateAudio",
  "formatAndPushHistoryMulmoScript",
  "addBeat",
  "deleteBeat",
  "positionUp",
  "update:scriptEditorActiveTab",
]);

const route = useRoute();
const mulmoEventStore = useMulmoEventStore();
const projectId = computed(() => route.params.id as string);

const currentTab = ref<ScriptEditorTab>(props.scriptEditorActiveTab || SCRIPT_EDITOR_TABS.TEXT);
const lastTab = ref<ScriptEditorTab>(props.scriptEditorActiveTab || SCRIPT_EDITOR_TABS.TEXT);

const safeBeats = computed(() => {
  return (props.mulmoValue?.beats ?? []).map((beat) => {
    return beat || {};
  });
});

watch(currentTab, () => {
  if (!props.isValidScriptData && ![SCRIPT_EDITOR_TABS.JSON, SCRIPT_EDITOR_TABS.YAML].includes(currentTab.value)) {
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
  console.log(index);
};
const generateAudio = (index: number) => {
  emit("generateAudio", index);
  console.log(index);
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

const addBeat = (beat: MulmoBeat, index: number) => {
  const newBeats = arrayInsertAfter(props.mulmoValue.beats, index, beat);
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
</script>
