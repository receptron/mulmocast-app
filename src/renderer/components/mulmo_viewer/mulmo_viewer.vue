<template>
  <div class="border-border text-center">
    <div v-if="beats.length === 0">
      <FileImage :size="64" class="text-muted-foreground mx-auto mb-4" />
      <p class="mb-2 text-lg font-medium">{{ t("project.productTabs.slide.title") }}</p>
      <p class="text-muted-foreground mb-4 text-sm">{{ t("project.productTabs.slide.description") }}</p>
    </div>
    <div v-else>
      <div class="flex w-full items-center justify-between" ref="boxRef" :style="{ height: boxHeight + 'px' }">
        <Button
          @click="decrease"
          variant="ghost"
          :disabled="currentPage === 0"
          :class="{ 'opacity-0!': currentPage === 0 }"
        >
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <MediaPlayer
          :videoWithAudioSource="lipSyncFiles?.[currentBeat?.id]"
          :videoSource="movieFiles?.[currentBeat?.id]"
          :imageSource="imageFiles?.[currentBeat?.id]"
          :audioSource="audioFiles[currentLanguage]?.[currentBeat?.id]"
          @play="handlePlay"
          @pause="handlePause"
          @ended="handleEnded"
          @generateAudio="generateLocalizeAudio"
          ref="mediaPlayer"
        />
        <audio :src="bgmFile" ref="bgmRef" v-if="bgmFile" />
        <Button
          @click="increase"
          variant="ghost"
          :disabled="currentPage === beats.length - 1"
          :class="{ 'opacity-0!': currentPage === beats.length - 1 }"
        >
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>

      <MediaPlayerDummy
        v-if="nextBeat"
        :videoWithAudioSource="lipSyncFiles?.[nextBeat?.id]"
        :videoSource="movieFiles?.[nextBeat?.id]"
        :imageSource="imageFiles?.[nextBeat?.id]"
        :audioSource="audioFiles[currentLanguage]?.[nextBeat?.id]"
        class="hidden"
      />

      <!-- text section -->
      <div class="bg-foreground/5 mt-2 rounded-lg p-2 text-sm">
        {{
          isScriptLang
            ? currentBeat?.text
            : (mulmoMultiLinguals?.[currentBeatId]?.["multiLingualTexts"]?.[textLanguage]?.text ??
              t("ui.common.noLang"))
        }}
        <Button
          variant="outline"
          @click="generateLocalizeText"
          v-if="!isScriptLang && !mulmoMultiLinguals?.[currentBeatId]?.['multiLingualTexts']?.[textLanguage]?.text"
          >{{ t("ui.actions.translate") }}</Button
        >
      </div>

      <!-- media manu -->
      <div class="text-muted-foreground mt-1 flex items-center justify-end gap-4 text-sm">
        {{ t("mulmoViewer.text") }} <SelectLanguage v-model="textLanguage" :languages="languages" />
        {{ t("mulmoViewer.audio") }} <SelectLanguage v-model="currentLanguage" :languages="languages" />
        <Button
          variant="outline"
          @click="generateLocalizeAudio"
          v-if="!audioFiles[currentLanguage]?.[currentBeat?.id]"
          >{{ t("ui.actions.generateAudio") }}</Button
        >
        <label class="flex items-center gap-2">
          <Checkbox v-model="autoPlay" />
          <span class="text-sm">{{ t("project.productTabs.slide.autoPlay") }}</span>
        </label>
        <div>
          {{ t("project.productTabs.slide.details", { pages: beats.length, current: currentPage + 1 }) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { FileImage, ChevronLeft, ChevronRight } from "lucide-vue-next";
import { type MultiLingualTexts, beatId } from "mulmocast/browser";
import { sleep } from "graphai";

import { bufferToUrl } from "@/lib/utils";
import { Button, Checkbox } from "@/components/ui";

import MediaPlayer from "./media_player.vue";
import MediaPlayerDummy from "./media_player_dummy.vue";

import { useImageFiles, useAudioFiles } from "@/pages/composable";
import { useMulmoEventStore, useMulmoGlobalStore } from "@/store";
import type { Project } from "@/lib/project_api";
import SelectLanguage from "./select_language.vue";
import { LANGUAGE_IDS } from "../../../shared/constants";

const { t } = useI18n();
const globalStore = useMulmoGlobalStore();
const mulmoEventStore = useMulmoEventStore();

interface Props {
  projectId: string;
  project: Project;
  mulmoMultiLinguals?: MultiLingualTexts;
}
const props = defineProps<Props>();

const emit = defineEmits(["updateMultiLingual"]);
const mediaPlayer = ref();
const bgmRef = ref();

const currentPage = ref(0);
const audioRef = ref();
const autoPlay = ref(true);

const boxRef = ref(null);
const boxHeight = ref(0);
const ratio = 0.5625; // 16:9（height = width * 9/16）

function updateHeight() {
  if (boxRef.value) {
    const width = boxRef.value.offsetWidth;
    boxHeight.value = width * ratio;
  }
}

onMounted(() => {
  window.addEventListener("resize", updateHeight);
  setTimeout(() => {
    updateHeight();
  }, 100);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateHeight);
});

const isPlaying = ref(false);

const handlePlay = () => {
  isPlaying.value = true;
  if (bgmRef.value) {
    bgmRef.value.play();
  }
};
const handlePause = () => {
  console.log("pause");
  isPlaying.value = false;
  if (bgmRef.value) {
    bgmRef.value.pause();
  }
};

const currentLanguage = ref("");
const textLanguage = ref("");

// initialize currentLanguage and textLanguage to the project lang
watch(
  () => props.project?.script?.lang,
  (v: (typeof LANGUAGE_IDS)[number]) => {
    if (v && currentLanguage.value === "") {
      currentLanguage.value = LANGUAGE_IDS.includes(v) ? v : globalStore.settings.APP_LANGUAGE;
    }
    if (v && textLanguage.value === "") {
      textLanguage.value = LANGUAGE_IDS.includes(v) ? v : globalStore.settings.APP_LANGUAGE;
    }
  },
  {
    immediate: true,
  },
);

const languages = computed(() => {
  const lang = props.project?.script?.lang ?? "en";
  if (globalStore.useLanguages.includes(lang)) {
    return globalStore.useLanguages;
  }
  return [lang, ...globalStore.useLanguages];
});

const isScriptLang = computed(() => {
  return props.project?.script?.lang === textLanguage.value;
});

const { imageFiles, movieFiles, lipSyncFiles, downloadImageFiles, downloadImageFile } = useImageFiles();
const { audioFiles, downloadAudioFiles, downloadAudioFile } = useAudioFiles();
const bgmFile = ref("");

const beats = computed(() => {
  return (props.project?.script?.beats ?? []).filter((beat) => !beat.hidden);
});

const currentBeat = computed(() => {
  return beats.value[currentPage.value];
});

const nextBeat = computed(() => {
  return beats.value[currentPage.value + 1];
});

const currentBeatId = computed(() => {
  return beatId(currentBeat.value?.id, currentPage.value);
});
const increase = () => {
  if (currentPage.value + 1 < beats.value.length) {
    currentPage.value = currentPage.value + 1;
    if (isPlaying.value && autoPlay.value) {
      waitAndPlay();
    }
    return true;
  }
  return false;
};
const decrease = () => {
  if (currentPage.value > 0) {
    currentPage.value = currentPage.value - 1;
    if (isPlaying.value && autoPlay.value) {
      waitAndPlay();
    }
  }
};

const waitAndPlay = async () => {
  await sleep(500);
  if (mediaPlayer.value) {
    mediaPlayer.value.play();
  }
  if (audioRef.value) {
    audioRef.value.play();
  }
};

const handleEnded = async () => {
  console.log("end");
  isPlaying.value = false;
  if (autoPlay.value && increase()) {
    waitAndPlay();
  } else if (bgmRef.value) {
    bgmRef.value.pause();
  }
};

const generateLocalizeText = async () => {
  // translate lang
  await window.electronAPI.mulmoHandler("mulmoTranslate", props.projectId, [textLanguage.value]);
  emit("updateMultiLingual");
};
const generateLocalizeAudio = async () => {
  // translate lang
  await window.electronAPI.mulmoHandler("mulmoTranslate", props.projectId, [currentLanguage.value]);
  emit("updateMultiLingual");

  // generate audio
  await window.electronAPI.mulmoHandler("mulmoActionRunner", props.projectId, ["audio"], currentLanguage.value);
  downloadAudioFiles(props.projectId, currentLanguage.value);
};
watch(currentLanguage, (v) => {
  downloadAudioFiles(props.projectId, v);
});

watch(
  () => props.projectId,
  async (newProjectId, oldProjectId) => {
    if (newProjectId && newProjectId !== oldProjectId) {
      downloadImageFiles(newProjectId);
      downloadAudioFiles(newProjectId, currentLanguage.value);
      const bgmRes = await window.electronAPI.mulmoHandler("mulmoBGM", newProjectId);
      bgmFile.value = bgmRes && (bgmRes?.result !== false) ? bufferToUrl(bgmRes) : null;
    }
  },
  { immediate: true },
);

watch(
  () => mulmoEventStore.mulmoEvent[props.projectId],
  async (mulmoEvent) => {
    if (mulmoEvent?.inSession) {
      return;
    }
    // generate image
    if (mulmoEvent && mulmoEvent.kind === "session") {
      if (mulmoEvent.sessionType === "image") {
        downloadImageFiles(props.projectId);
      }
      if (mulmoEvent.sessionType === "audio") {
        downloadAudioFiles(props.projectId, currentLanguage.value);
      }
    }

    // beats
    if (mulmoEvent?.kind === "beatGenerate" && ["image"].includes(mulmoEvent.sessionType)) {
      const index = props.project?.script?.beats?.findIndex((beat) => beat.id === mulmoEvent.id);
      if (index === -1 || index === undefined) {
        return;
      }
      downloadImageFile(props.projectId, index, mulmoEvent.id);
    }
    if (mulmoEvent?.kind === "beat") {
      if (mulmoEvent.sessionType === "audio") {
        const index = props.project?.script?.beats?.findIndex((beat) => beat.id === mulmoEvent.id);
        if (index === -1 || index === undefined) {
          return;
        }
        // Audio generation completed - always load generated TTS file
        downloadAudioFile(props.projectId, currentLanguage.value, index, mulmoEvent.id, {
          mode: "generated",
        });
      }
      if (mulmoEvent.sessionType === "multiLingual") {
        emit("updateMultiLingual");
      }
    }
    console.log(mulmoEvent);
  },
);
</script>
