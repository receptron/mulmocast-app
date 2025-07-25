<template>
  <div>
    <!-- Image section -->
    <div class="mb-4">
      <!-- Image preview -->
      <div
        class="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center"
        :key="`beat_editor_${beat.id ?? index}`"
      >
        <!-- Generate image button -->
        <template v-if="shouldShowGenerateButton">
          <Button
            variant="ghost"
            size="icon"
            class="absolute -left-3 -top-3 z-10 bg-white border border-gray-300 rounded-full shadow hover:bg-gray-100 transition-colors w-8 h-8 flex items-center justify-center"
            @click="generateImage"
            :disabled="isImageGenerating || isHtmlGenerating || props.toggleTypeMode"
            :title="t('form.' + imageGenerateButtonTitle)"
          >
            <Sparkles :class="isImageGenerating || isHtmlGenerating ? 'text-gray-400' : ''" class="w-4 h-4" />
          </Button>
        </template>
        <template v-if="beat?.image?.type === 'beat'"> Reference<!-- Todo --> </template>
        <template v-if="isImageGenerating || isHtmlGenerating">
          <!-- TODO update design -->
          <Loader2 class="w-4 h-4 mr-1 animate-spin" />{{ t("generating") }}
        </template>
        <!-- image pewview -->
        <template v-else-if="imageFile">
          <template v-if="beat?.image?.type === 'movie'">
            <video
              :size="64"
              class="mx-auto text-gray-400 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
              controls
              :src="mediaUri(imageFile)"
              @click="openModal('video', imageFile)"
            />
          </template>
          <template v-else>
            <img
              :src="mediaUri(imageFile)"
              class="cursor-pointer hover:opacity-80 transition-opacity"
              @click="openModal('image', imageFile)"
            />
          </template>
        </template>
        <template v-else>
          <Video v-if="beat?.image?.type === 'movie'" :size="32" class="mx-auto text-gray-400 mb-2" />
          <FileImage v-else :size="32" class="mx-auto text-gray-400 mb-2" />
          <p class="text-sm text-gray-500">
            {{ t("beat." + (beat?.image?.type === "movie" ? "videoPreview" : "imagePreview")) }}
          </p>
        </template>
      </div>
    </div>

    <!-- Movie section -->
    <div v-if="enableMovieGenerate">
      <!-- Movie preview -->
      <div class="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
        <!-- Generate movie button -->
        <template v-if="shouldShowGenerateButton && shouldBeGeneratedWithPrompt">
          <Button
            variant="ghost"
            size="icon"
            class="absolute -left-3 -top-3 z-10 bg-white border border-gray-300 rounded-full shadow hover:bg-gray-100 transition-colors w-8 h-8 flex items-center justify-center"
            @click="generateMovie"
            :disabled="!enableMovieGenerate || isMovieGenerating || props.toggleTypeMode"
            :title="t('form.' + movieGenerateButtonTitle)"
          >
            <Sparkles :class="isMovieGenerating ? 'text-gray-400' : ''" class="w-4 h-4" />
          </Button>
        </template>
        <template v-if="isMovieGenerating">
          <Loader2 class="w-4 h-4 mr-1 animate-spin" />{{ t("generating") }}</template
        >
        <div class="relative hover:opacity-80 transition-opacity cursor-pointer" v-else-if="movieFile">
          <video
            :size="64"
            class="mx-auto text-gray-400 cursor-pointer"
            :src="mediaUri(movieFile)"
            @click="openModal('video', movieFile)"
          />
          <Play
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2"
            :size="40"
            @click="openModal('video', movieFile)"
          />
        </div>
        <div v-else>
          <Video :size="32" class="mx-auto text-gray-400 mb-2" />
          <p class="text-sm text-gray-500">{{ t("beat.videoPreview") }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileImage, Video, Play, Loader2, Sparkles } from "lucide-vue-next";
import { computed } from "vue";
import type { MulmoBeat } from "mulmocast/browser";
import { useI18n } from "vue-i18n";

import { Button } from "@/components/ui/button";
import { mediaUri } from "@/lib/utils";
import { isLocalSourceMediaBeat } from "@/lib/beat_util";

interface Props {
  beat: MulmoBeat;
  index: number;
  imageFile: ArrayBuffer | string | null;
  movieFile: ArrayBuffer | string | null;
  isImageGenerating: boolean;
  isHtmlGenerating: boolean;
  isMovieGenerating: boolean;
  enableMovieGenerate: boolean;
  toggleTypeMode?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(["openModal", "generateImage", "generateMovie"]);

const { t } = useI18n();

// Computed properties for button visibility
const shouldShowGenerateButton = computed(() => {
  return (
    props.beat?.image?.type !== "beat" &&
    !(
      ["image", "movie"].includes(props.beat?.image?.type || "") &&
      props.beat?.image &&
      isLocalSourceMediaBeat(props.beat)
    )
  );
});

const shouldBeGeneratedWithPrompt = computed(() => {
  return !props.beat.htmlPrompt && !props.beat.image;
});

const openModal = (type: "image" | "video" | "audio" | "other", src: ArrayBuffer | string | null) => {
  emit("openModal", type, src);
};

const generateImage = () => {
  emit("generateImage");
};

const generateMovie = () => {
  emit("generateMovie");
};

const imageGenerateButtonTitle = computed(() => {
  return props.toggleTypeMode
    ? "changeBeatTypeFirst"
    : props.isImageGenerating || props.isHtmlGenerating
      ? "generating"
      : "generateImage";
});

const movieGenerateButtonTitle = computed(() => {
  return props.toggleTypeMode ? "changeBeatTypeFirst" : props.isMovieGenerating ? "generating" : "generateMovie";
});
</script>
