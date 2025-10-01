<template>
  <Card class="p-4">
    <h4 class="font-medium">{{ t("parameters.audioParams.title") }}</h4>
    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-4" v-if="globalStore.userIsPro">
        <div>
          <Label>{{ t("parameters.audioParams.padding") }}</Label>
          <p class="text-muted-foreground mt-1 text-xs">
            {{ t("parameters.audioParams.paddingDescription") }}
          </p>
          <Input
            :model-value="audioParams?.padding ?? AUDIO_PARAMS_DEFAULT_VALUES.padding"
            @update:model-value="(value) => handleUpdate('padding', Number(value))"
            type="number"
            step="0.1"
          />
        </div>
        <div>
          <Label>{{ t("parameters.audioParams.introPadding") }}</Label>
          <p class="text-muted-foreground mt-1 text-xs">
            {{ t("parameters.audioParams.introPaddingDescription") }}
          </p>
          <Input
            :model-value="audioParams?.introPadding ?? AUDIO_PARAMS_DEFAULT_VALUES.introPadding"
            @update:model-value="(value) => handleUpdate('introPadding', Number(value))"
            type="number"
            step="0.1"
          />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4" v-if="globalStore.userIsPro">
        <div>
          <Label>{{ t("parameters.audioParams.closingPadding") }}</Label>
          <p class="text-muted-foreground mt-1 text-xs">
            {{ t("parameters.audioParams.closingPaddingDescription") }}
          </p>
          <Input
            :model-value="audioParams?.closingPadding ?? AUDIO_PARAMS_DEFAULT_VALUES.closingPadding"
            @update:model-value="(value) => handleUpdate('closingPadding', Number(value))"
            type="number"
            step="0.1"
          />
        </div>
        <div>
          <Label>{{ t("parameters.audioParams.outroPadding") }}</Label>
          <p class="text-muted-foreground mt-1 text-xs">
            {{ t("parameters.audioParams.outroPaddingDescription") }}
          </p>
          <Input
            :model-value="audioParams?.outroPadding ?? AUDIO_PARAMS_DEFAULT_VALUES.outroPadding"
            @update:model-value="(value) => handleUpdate('outroPadding', Number(value))"
            type="number"
            step="0.1"
          />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label>{{ t("parameters.audioParams.bgmVolume") }}</Label>
          <p class="text-muted-foreground mt-1 text-xs">
            {{ t("parameters.audioParams.bgmVolumeDescription") }}
          </p>
          <Input
            :model-value="audioParams?.bgmVolume ?? AUDIO_PARAMS_DEFAULT_VALUES.bgmVolume"
            @update:model-value="(value) => handleUpdate('bgmVolume', Number(value))"
            type="number"
            step="0.05"
            min="0"
            max="1"
          />
        </div>
        <div>
          <Label>{{ t("parameters.audioParams.audioVolume") }}</Label>
          <p class="text-muted-foreground mt-1 text-xs">
            {{ t("parameters.audioParams.audioVolumeDescription") }}
          </p>
          <Input
            :model-value="audioParams?.audioVolume ?? AUDIO_PARAMS_DEFAULT_VALUES.audioVolume"
            @update:model-value="(value) => handleUpdate('audioVolume', Number(value))"
            type="number"
            step="0.05"
            min="0"
            max="1"
          />
        </div>
      </div>
      <div>
        <Label>{{ t("parameters.audioParams.bgm") }}</Label>
        <Select :model-value="currentBgmSelection" @update:model-value="handleBgmSelection">
          <SelectTrigger>
            <SelectValue :placeholder="t('parameters.audioParams.bgmSelect')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="bgm in bgmAssets.bgms" :key="bgm.name" :value="bgm.url">
              {{ bgm.title }}
            </SelectItem>
            <SelectItem value="custom">
              {{ t("parameters.audioParams.customAudio") }}
            </SelectItem>
            <SelectItem value="silent">
              {{ t("parameters.audioParams.noBgm") }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div v-if="bgmState.type === 'custom'" class="space-y-2">
        <div
          @dragover.prevent
          @drop.prevent="handleDrop"
          @click="handleFileClick"
          :class="[
            'border-border bg-card relative cursor-pointer rounded-md border-2 border-dashed p-3 text-center shadow-sm transition-colors',
            isUploading ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted/50',
          ]"
        >
          <template v-if="isUploading">
            <div class="text-muted-foreground">
              {{ t("ui.status.loading") }}
            </div>
          </template>
          <template v-else-if="bgmState.filename">
            <div class="flex items-center justify-center gap-2">
              <Music class="text-muted-foreground h-4 w-4" />
              <span class="text-foreground text-sm font-medium">{{ bgmState.filename }}</span>
            </div>
            <div class="text-muted-foreground mt-1 text-xs">
              {{ t("parameters.audioParams.clickToReplace") }}
            </div>
          </template>
          <template v-else>
            <div class="text-muted-foreground">
              {{ t("parameters.audioParams.dropAudioHere") }}
            </div>
            <div class="text-muted-foreground/80 mt-1 text-xs">
              {{ t("parameters.audioParams.clickToSelect") }}
            </div>
          </template>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
          @change="handleFileSelect"
          class="hidden"
          :disabled="isUploading"
        />
      </div>

      <!-- Audio Player -->
      <div v-if="audioPreviewUrl" class="mt-3">
        <audio :src="audioPreviewUrl" controls />
      </div>

      <MulmoError :mulmoError="mulmoError" />
    </div>
  </Card>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { computed, ref, watch, onUnmounted } from "vue";
import { Music } from "lucide-vue-next";
import { Card, Label, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import type { MulmoPresentationStyle } from "mulmocast/browser";
import { bgmAssets } from "mulmocast/data";
import MulmoError from "./mulmo_error.vue";
import { AUDIO_PARAMS_DEFAULT_VALUES, SILENT_BGM } from "@/../shared/constants";

import { useMulmoGlobalStore } from "@/store";

type AudioParams = MulmoPresentationStyle["audioParams"];

const { t } = useI18n();

const props = defineProps<{
  projectId: string;
  audioParams?: AudioParams;
  mulmoError: string[];
}>();

const globalStore = useMulmoGlobalStore();

const emit = defineEmits<{
  update: [audioParams: AudioParams];
}>();

const bgmState = ref<{
  type: "preset" | "custom" | "silent";
  url?: string;
  filename?: string;
  previewUrl?: string;
}>({ type: "preset" });

const isUploading = ref(false);
const fileInput = ref<HTMLInputElement>();

const currentBgmSelection = computed(() => {
  if (bgmState.value.type === "silent") return "silent";
  if (bgmState.value.type === "custom") return "custom";

  const bgm = props.audioParams?.bgm;
  if (!bgm) return AUDIO_PARAMS_DEFAULT_VALUES.bgm.url;
  if (bgm.kind === "url" && bgm.url === SILENT_BGM.url) return "silent";
  if (bgm.kind === "path") return "custom";
  if (bgm.kind === "url") return bgm.url;
  return AUDIO_PARAMS_DEFAULT_VALUES.bgm.url;
});

const audioPreviewUrl = computed(() => {
  if (bgmState.value.type === "custom" && bgmState.value.previewUrl) {
    return bgmState.value.previewUrl;
  }
  if (bgmState.value.type === "custom") {
    return null;
  }
  if (bgmState.value.type === "silent") {
    return null;
  }
  if (props.audioParams?.bgm?.kind === "url") {
    return props.audioParams.bgm.url;
  }
  return AUDIO_PARAMS_DEFAULT_VALUES.bgm.url;
});

const initializeBgmState = async () => {
  const bgm = props.audioParams?.bgm;
  if (!bgm) {
    bgmState.value = { type: "preset" };
    return;
  }

  if (bgm.kind === "url" && bgm.url === SILENT_BGM.url) {
    bgmState.value = { type: "silent" };
    return;
  }
  if (bgm.kind === "path") {
    const filename = typeof bgm.path === "string" ? bgm.path.split("/").pop() || bgm.path : String(bgm.path);
    bgmState.value = { type: "custom", filename };

    try {
      const audioData = await window.electronAPI.mulmoHandler("mulmoAudioBgmGet", props.projectId, bgm.path);
      if (audioData) {
        const blob = new Blob([new Uint8Array(audioData as ArrayBuffer)], { type: "audio/mpeg" });
        bgmState.value.previewUrl = URL.createObjectURL(blob);
      }
    } catch (error) {
      console.error("Failed to load custom BGM:", error);
    }
    return;
  }
  if (bgm.kind === "url") {
    bgmState.value = { type: "preset", url: bgm.url };
    return;
  }
  bgmState.value = { type: "preset" };
};

watch(() => props.audioParams?.bgm, initializeBgmState, { immediate: true });

onUnmounted(() => {
  if (bgmState.value.type === "custom" && bgmState.value.previewUrl) {
    URL.revokeObjectURL(bgmState.value.previewUrl);
  }
});

const handleUpdate = (field: keyof typeof AUDIO_PARAMS_DEFAULT_VALUES, value: number) => {
  const currentParams = props.audioParams || ({} as AudioParams);
  emit("update", {
    ...AUDIO_PARAMS_DEFAULT_VALUES,
    ...currentParams,
    [field]: value,
  });
};

const handleBgmSelection = (selection: string) => {
  const currentParams = props.audioParams || ({} as AudioParams);

  if (selection === "silent") {
    bgmState.value = { type: "silent" };
    emit("update", {
      ...AUDIO_PARAMS_DEFAULT_VALUES,
      ...currentParams,
      bgm: SILENT_BGM,
    });
    return;
  }
  if (selection === "custom") {
    bgmState.value = { type: "custom" };
    return;
  }
  bgmState.value = { type: "preset", url: selection };
  emit("update", {
    ...AUDIO_PARAMS_DEFAULT_VALUES,
    ...currentParams,
    bgm: {
      kind: "url",
      url: selection,
    },
  });
};

const handleFileClick = () => {
  if (!isUploading.value) {
    fileInput.value?.click();
  }
};

const handleAudioFileUpload = async (file: File) => {
  isUploading.value = true;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const uint8Array = new Uint8Array(reader.result as ArrayBuffer);
      const path = (await window.electronAPI.mulmoHandler("mulmoAudioBgmUpload", props.projectId, file.name, [
        ...uint8Array,
      ])) as string;

      const currentParams = props.audioParams || ({} as AudioParams);

      if (bgmState.value.previewUrl) {
        URL.revokeObjectURL(bgmState.value.previewUrl);
      }
      const previewUrl = URL.createObjectURL(file);

      bgmState.value = {
        type: "custom",
        filename: file.name,
        previewUrl,
      };

      emit("update", {
        ...AUDIO_PARAMS_DEFAULT_VALUES,
        ...currentParams,
        bgm: {
          kind: "path",
          path: `./${path}`,
        },
      });
    } catch (error) {
      console.error("Failed to upload audio file:", error);
    } finally {
      isUploading.value = false;
    }
  };

  reader.onerror = (error) => {
    console.error("FileReader error:", error);
    isUploading.value = false;
  };

  reader.readAsArrayBuffer(file);
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    handleAudioFileUpload(files[0]);
  }
};

const handleDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    handleAudioFileUpload(files[0]);
  }
};
</script>
