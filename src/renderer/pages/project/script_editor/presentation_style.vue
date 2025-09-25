<template>
  <div class="space-y-6">
    <StyleTemplate
      @updateMulmoScript="updatePresentationStyle"
      :mulmoScript="mulmoScript"
      :isPro="globalStore.userIsPro"
    />
    <SpeechParams
      :speech-params="presentationStyle?.speechParams"
      @update="(value) => updateParam('speechParams', value)"
      :mulmoError="mulmoError?.speechParams ?? []"
      :settingPresence="settingPresence"
    />
    <ImageParams
      :image-params="presentationStyle?.imageParams"
      @update="(value) => updateParam('imageParams', value)"
      :mulmoError="mulmoError?.imageParams ?? []"
      :settingPresence="settingPresence"
    />
    <MovieParams
      :movie-params="presentationStyle?.movieParams"
      @update="(value) => updateParam('movieParams', value)"
      :mulmoError="mulmoError?.movieParams ?? []"
      :settingPresence="settingPresence"
    />
    <TextSlideParams
      v-if="globalStore.userIsPro"
      :text-slide-params="presentationStyle?.textSlideParams"
      @update="(value) => updateParam('textSlideParams.cssStyles', value)"
      :mulmoError="mulmoError?.textSlideParams ?? []"
    />
    <AudioParams
      :projectId="projectId"
      :audio-params="presentationStyle?.audioParams"
      @update="(value) => updateParam('audioParams', value)"
      :mulmoError="mulmoError?.audioParams ?? []"
    />
    <CaptionParams
      v-if="globalStore.userIsPro"
      :caption-params="presentationStyle?.captionParams"
      @update="(value) => updateParam('captionParams', value)"
      :mulmoError="mulmoError?.captionParams ?? []"
    />
    <CanvasSizeParams
      :canvas-size="presentationStyle?.canvasSize"
      @update="(value) => updateParam(`canvasSize`, value)"
      :mulmoError="mulmoError?.canvasSize ?? []"
    />
  </div>
</template>

<script setup lang="ts">
import type { MulmoPresentationStyle, MulmoScript } from "mulmocast/browser";
import StyleTemplate from "./styles/style_template.vue";
import CanvasSizeParams from "./styles/canvas_size_params.vue";
import ImageParams from "./styles/image_params.vue";
import SpeechParams from "./styles/speech_params.vue";
import AudioParams from "./styles/audio_params.vue";
import MovieParams from "./styles/movie_params.vue";
import TextSlideParams from "./styles/text_slide_params.vue";
import CaptionParams from "./styles/caption_params.vue";

import { removeEmptyValues } from "@/lib/utils";
import { MulmoError } from "../../../../../types";

import { useMulmoGlobalStore } from "@/store";

interface Props {
  projectId: string;
  presentationStyle?: Partial<MulmoPresentationStyle>;
  mulmoError: MulmoError | null;
  settingPresence: Record<string, boolean>;
  mulmoScript: MulmoScript;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:presentationStyle": [style: Partial<MulmoPresentationStyle>];
}>();
const globalStore = useMulmoGlobalStore();

const updateParam = (path: string, value: unknown) => {
  const keys = path.split(".");
  const set = (obj: Record<string, unknown>, keyPath: string[], val: unknown): Record<string, unknown> => {
    if (keyPath.length === 1) {
      return { ...obj, [keyPath[0]]: val };
    }
    const [head, ...tail] = keyPath;
    const currentValue = obj?.[head];
    const nextValue =
      currentValue !== null && typeof currentValue === "object" ? { ...(currentValue as Record<string, unknown>) } : {};

    return {
      ...obj,
      [head]: set(nextValue, tail, val),
    };
  };

  const updatedValue = set({ ...(props.presentationStyle || {}) } as Record<string, unknown>, keys, value);
  const data = {
    ...(props.presentationStyle || {}),
    [keys[0]]: removeEmptyValues(updatedValue[keys[0]]),
  };

  console.log(`Updating parameter: ${path} =`, data);
  emit("update:presentationStyle", data);
};

const updatePresentationStyle = (style: Partial<MulmoPresentationStyle>) => {
  emit("update:presentationStyle", style);
};
</script>
