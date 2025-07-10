<template>
  <Tabs class="w-full h-full flex flex-col" v-model="currentTab">
    <TabsList class="grid w-full grid-cols-5">
      <TabsTrigger value="text">Text</TabsTrigger>
      <TabsTrigger value="yaml">YAML</TabsTrigger>
      <TabsTrigger value="json">JSON</TabsTrigger>
      <TabsTrigger value="media">Media</TabsTrigger>
      <TabsTrigger value="style">Style</TabsTrigger>
    </TabsList>

    <div
      v-if="mulmoError?.script && hasScriptError"
      class="w-full p-2 border border-red-500 bg-red-100 text-red-800 rounded text-sm mt-2"
    >
      <div v-for="(message, key) in Object.values(mulmoError?.script ?? {}).flat()" :key="key">
        {{ message }}
      </div>
    </div>

    <TabsContent value="text" class="mt-2">
      <div
        class="border rounded-lg p-4 bg-gray-50 min-h-[400px] max-h-[calc(100vh-400px)] overflow-y-auto font-mono text-sm space-y-6"
      >
        <p class="text-sm text-gray-500 mb-2">Text Mode - Speaker and dialogue editing only</p>
        <div class="space-y-6 mx-auto">
          <Card v-for="(beat, index) in mulmoValue?.beats ?? []" :key="index" class="p-4 space-y-1 gap-2">
            <div class="font-bold text-gray-700">Beat {{ index + 1 }}</div>
            <div>
              <Label>Speaker</Label>
              <Input
                :model-value="beat.speaker"
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
            <span v-if="store.sessionState?.[projectId]?.['beat']?.['audio']?.[index]">generating</span>
            <audio :src="audioFiles[index]" v-if="!!audioFiles[index]" controls />
          </Card>
        </div>
      </div>
    </TabsContent>
    <TabsContent value="yaml" class="mt-4 flex-1 overflow-hidden">
      <div
        :class="[
          'border rounded-lg p-4 bg-gray-50 h-full flex flex-col mb-[2px]',
          { 'outline-red-400 outline-2 outline': !isValidScriptData },
        ]"
      >
        <p class="text-sm text-gray-500 mb-2">YAML Mode - Complete MulmoScript editing</p>
        <CodeEditor
          v-model="yamlText"
          language="yaml"
          :jsonSchema="mulmoJsonSchema"
          @update:modelValue="onYamlInput"
          @focus="onFocus"
          @blur="onBlur"
          class="flex-1"
          minHeight="100%"
        />
      </div>
    </TabsContent>

    <TabsContent value="json" class="mt-4 flex-1 overflow-hidden">
      <div
        :class="[
          'border rounded-lg p-4 bg-gray-50 h-full flex flex-col mb-[2px]',
          { 'outline-red-400 outline-2 outline': !isValidScriptData },
        ]"
      >
        <p class="text-sm text-gray-500 mb-2">JSON Mode - Complete MulmoScript editing</p>
        <CodeEditor
          v-model="jsonText"
          language="json"
          :jsonSchema="mulmoJsonSchema"
          @update:modelValue="onJsonInput"
          @focus="onFocus"
          @blur="onBlur"
          class="flex-1"
          minHeight="100%"
        />
      </div>
    </TabsContent>

    <TabsContent value="media" class="mt-4">
      <div class="border rounded-lg p-4 bg-gray-50 min-h-[400px] max-h-[calc(100vh-400px)] overflow-y-auto">
        <p class="text-sm text-gray-500 mb-2">Media Mode - Beat-by-beat media editing and preview</p>

        <div class="space-y-4">
          <BeatAdd @addBeat="addBeatHead" />
          <Card v-for="(beat, index) in mulmoValue?.beats ?? []" :key="index" class="p-4">
            <BeatEditor
              :beat="beat"
              :index="index"
              :isEnd="(mulmoValue?.beats ?? []).length === index + 1"
              :imageFile="imageFiles[index]"
              :mulmoError="mulmoError?.['beats']?.[index] ?? []"
              @update="update"
              @generateImage="generateImage"
              @deleteBeat="deleteBeat"
              @positionUp="positionUp"
            />
          </Card>
          <BeatAdd @addBeat="addBeatTail" v-if="mulmoValue?.beats && mulmoValue?.beats.length > 0" />
        </div>
      </div>
    </TabsContent>
    <TabsContent value="style" class="mt-4">
      <div class="border rounded-lg p-4 bg-gray-50 min-h-[400px] max-h-[calc(100vh-400px)] overflow-y-auto">
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import BeatEditor from "./script_editor/beat_editor.vue";
import BeatAdd from "./script_editor/beat_add.vue";
import PresentationStyleEditor from "./script_editor/presentation_style_editor.vue";
import CodeEditor from "@/components/code_editor.vue";

import YAML from "yaml";
import type { MulmoScript, MulmoBeat, MulmoPresentationStyle } from "mulmocast";
import { mulmoScriptSchema } from "mulmocast/browser";
import { zodToJsonSchema } from "zod-to-json-schema";
import { useStore } from "../../../store";
import { useRoute } from "vue-router";

import { MulmoError } from "../../../../types";
import { removeEmptyValues } from "@/lib/utils";

interface Props {
  mulmoValue: MulmoScript;
  isValidScriptData: boolean;
  imageFiles: (ArrayBuffer | null)[];
  audioFiles: (ArrayBuffer | null)[];
  mulmoError: MulmoError | null;
}

const props = defineProps<Props>();
const emit = defineEmits([
  "update:mulmoValue",
  "update:isValidScriptData",
  "generateImage",
  "generateAudio",
  "formatAndPushHistoryMulmoScript",
]);

const route = useRoute();
const store = useStore();
const projectId = computed(() => route.params.id as string);

const currentTab = ref("text");

const mulmoJsonSchema = zodToJsonSchema(mulmoScriptSchema);

watch(currentTab, () => {
  console.log(currentTab.value);
  emit("formatAndPushHistoryMulmoScript");
});

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
  return Object.values(props.mulmoError.script ?? {}).flat().length;
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

const generateImage = (index: number) => {
  emit("generateImage", index);
  console.log(index);
};
const generateAudio = (index: number) => {
  emit("generateAudio", index);
  console.log(index);
};
const deleteBeat = (index: number) => {
  if (index >= 0 && index < props.mulmoValue.beats.length) {
    const newBeats = [...props.mulmoValue.beats];
    newBeats.splice(index, 1);
    emit("update:mulmoValue", {
      ...props.mulmoValue,
      beats: newBeats,
    });
  }
};
const positionUp = (index: number) => {
  if (index <= 0 || index >= props.mulmoValue.beats.length) return;
  const newBeats = [...props.mulmoValue.beats];
  const temp = newBeats[index - 1];
  newBeats[index - 1] = newBeats[index];
  newBeats[index] = temp;
  emit("update:mulmoValue", {
    ...props.mulmoValue,
    beats: newBeats,
  });
};

const addBeatHead = (beat: MulmoBeat) => {
  const newBeats = [...(props.mulmoValue.beats ?? [])];
  newBeats.unshift(beat);
  emit("update:mulmoValue", {
    ...props.mulmoValue,
    beats: newBeats,
  });
};

const addBeatTail = (beat: MulmoBeat) => {
  const newBeats = [...(props.mulmoValue.beats ?? [])];
  newBeats.push(beat);
  emit("update:mulmoValue", {
    ...props.mulmoValue,
    beats: newBeats,
  });
};

const updatePresentationStyle = (style: Partial<MulmoPresentationStyle>) => {
  console.log("updatePresentationStyle", style);

  emit("update:mulmoValue", {
    ...props.mulmoValue,
    ...removeEmptyValues(style),
  });
};
</script>
