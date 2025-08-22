<template>
  <Card class="p-4">
    <h4 class="mb-3 font-medium">{{ t("parameters.audioParams.title") }}</h4>
    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label>{{ t("parameters.audioParams.padding") }}</Label>
          <Input
            :model-value="audioParams?.padding ?? AUDIO_PARAMS_DEFAULT_VALUES.padding"
            @update:model-value="(value) => handleUpdate('padding', Number(value))"
            type="number"
            step="0.1"
          />
        </div>
        <div>
          <Label>{{ t("parameters.audioParams.introPadding") }}</Label>
          <Input
            :model-value="audioParams?.introPadding ?? AUDIO_PARAMS_DEFAULT_VALUES.introPadding"
            @update:model-value="(value) => handleUpdate('introPadding', Number(value))"
            type="number"
            step="0.1"
          />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label>{{ t("parameters.audioParams.closingPadding") }}</Label>
          <Input
            :model-value="audioParams?.closingPadding ?? AUDIO_PARAMS_DEFAULT_VALUES.closingPadding"
            @update:model-value="(value) => handleUpdate('closingPadding', Number(value))"
            type="number"
            step="0.1"
          />
        </div>
        <div>
          <Label>{{ t("parameters.audioParams.outroPadding") }}</Label>
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
        <Select :model-value="currentBgmUrl" @update:model-value="handleBgmUpdate">
          <SelectTrigger>
            <SelectValue :placeholder="t('parameters.audioParams.bgmSelect')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="bgm in bgmAssets.bgms" :key="bgm.name" :value="bgm.url">
              {{ bgm.title }}
            </SelectItem>
            <SelectItem value="__custom__">
              {{ t("parameters.audioParams.customAudio") }}
            </SelectItem>
            <SelectItem :value="SILENT_BGM.url">
              {{ t("parameters.audioParams.noBgm") }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div v-if="isShowingCustom" class="space-y-2">
        <div
          @dragover.prevent
          @drop.prevent="handleDrop"
          @click="handleFileClick"
          :class="[
            'relative cursor-pointer rounded-md border-2 border-dashed border-gray-300 bg-white p-3 text-center shadow-sm transition-colors',
            isUploading ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50',
          ]"
        >
          <template v-if="isUploading">
            <div class="text-gray-600">
              {{ t("ui.status.loading") }}
            </div>
          </template>
          <template v-else-if="customAudioFileName">
            <div class="flex items-center justify-center gap-2">
              <Music class="h-4 w-4 text-gray-500" />
              <span class="text-sm font-medium text-gray-700">{{ customAudioFileName }}</span>
            </div>
            <div class="mt-1 text-xs text-gray-500">
              {{ t("parameters.audioParams.clickToReplace") }}
            </div>
          </template>
          <template v-else>
            <div class="text-gray-600">
              {{ t("parameters.audioParams.dropAudioHere") }}
            </div>
            <div class="mt-1 text-xs text-gray-400">
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
      <div v-if="audioUrl && audioUrl !== SILENT_BGM.url" class="mt-3">
        <audio :src="audioUrl" controls />
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

type AudioParams = MulmoPresentationStyle["audioParams"];

const { t } = useI18n();

const props = defineProps<{
  projectId: string;
  audioParams?: AudioParams;
  mulmoError: string[];
}>();

const emit = defineEmits<{
  update: [audioParams: AudioParams];
}>();

const audioUrl = ref<string>("");
const customAudioFileName = ref<string>("");
const customAudioBlob = ref<Blob | null>(null);
const isShowingCustom = ref(false);
const isUploading = ref(false);
const fileInput = ref<HTMLInputElement>();

const revokeAudioUrlIfExists = () => {
  if (audioUrl.value && audioUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(audioUrl.value);
  }
};

const initializeCustomAudioDisplay = async () => {
  if (props.audioParams?.bgm) {
    if (props.audioParams.bgm.kind === "path") {
      const path = props.audioParams.bgm.path;
      if (typeof path === "string") {
        customAudioFileName.value = path.split("/").pop() || path;
        try {
          const audioData = await window.electronAPI.mulmoHandler("mulmoAudioBgmGet", props.projectId, path);
          if (audioData) {
            const blob = new Blob([new Uint8Array(audioData as ArrayBuffer)], { type: "audio/mpeg" });
            customAudioBlob.value = blob;
            revokeAudioUrlIfExists();
            audioUrl.value = URL.createObjectURL(blob);
          }
        } catch (error) {
          console.error("Failed to load custom BGM:", error);
        }
      }
    } else if (props.audioParams.bgm.kind === "url") {
      audioUrl.value = props.audioParams.bgm.url;
    }
  }
};

watch(
  () => props.audioParams?.bgm,
  async () => {
    await initializeCustomAudioDisplay();
  },
  { immediate: true },
);

onUnmounted(() => {
  revokeAudioUrlIfExists();
});

const handleUpdate = (field: keyof typeof AUDIO_PARAMS_DEFAULT_VALUES, value: number) => {
  const currentParams = props.audioParams || ({} as AudioParams);
  emit("update", {
    ...AUDIO_PARAMS_DEFAULT_VALUES,
    ...currentParams,
    [field]: value,
  });
};

const currentBgmUrl = computed(() => {
  if (isShowingCustom.value) {
    return "__custom__";
  }

  if (props.audioParams?.bgm) {
    if (props.audioParams.bgm.kind === "url" && props.audioParams.bgm.url === SILENT_BGM.url) {
      return SILENT_BGM.url;
    }

    if (props.audioParams.bgm.kind === "url") {
      const url = props.audioParams.bgm.url;
      const isPreset = bgmAssets.bgms.some((bgm) => bgm.url === url);
      if (!isPreset && url !== "") {
        customAudioFileName.value = url;
        isShowingCustom.value = true;
        return "__custom__";
      }
      return url;
    } else if (props.audioParams.bgm.kind === "path") {
      const path = props.audioParams.bgm.path;
      const filename = typeof path === "string" ? path.split("/").pop() || path : String(path);
      customAudioFileName.value = filename;
      isShowingCustom.value = true;
      return "__custom__";
    }
  }
  return "__none__";
});

const handleBgmUpdate = (bgmUrl: string) => {
  const currentParams = props.audioParams || ({} as AudioParams);

  if (bgmUrl === "__none__") {
    customAudioFileName.value = "";
    isShowingCustom.value = false;
    audioUrl.value = SILENT_BGM.url;
    revokeAudioUrlIfExists();
    emit("update", {
      ...AUDIO_PARAMS_DEFAULT_VALUES,
      ...currentParams,
      bgm: SILENT_BGM,
    });
  } else if (bgmUrl === "__custom__") {
    isShowingCustom.value = true;
    audioUrl.value = "";
    if (!customAudioFileName.value && !props.audioParams?.bgm) {
      const { bgm: __bgm, ...paramsWithoutBgm } = currentParams;
      emit("update", {
        ...AUDIO_PARAMS_DEFAULT_VALUES,
        ...paramsWithoutBgm,
      });
    }
  } else {
    customAudioFileName.value = "";
    isShowingCustom.value = false;
    audioUrl.value = bgmUrl;
    revokeAudioUrlIfExists();
    emit("update", {
      ...AUDIO_PARAMS_DEFAULT_VALUES,
      ...currentParams,
      bgm: {
        kind: "url",
        url: bgmUrl,
      },
    });
  }
};

const handleFileClick = () => {
  if (!isUploading.value) {
    fileInput.value?.click();
  }
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    processAudioFile(files[0]);
  }
};

const processAudioFile = async (file: File) => {
  isUploading.value = true;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const uint8Array = new Uint8Array(reader.result as ArrayBuffer);

      const path = (await window.electronAPI.mulmoHandler("mulmoAudioBgmUpload", props.projectId, file.name, [
        ...uint8Array,
      ])) as string;

      const currentParams = props.audioParams || ({} as AudioParams);
      customAudioFileName.value = file.name;

      revokeAudioUrlIfExists();
      audioUrl.value = URL.createObjectURL(file);

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

const handleDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    processAudioFile(files[0]);
  }
};
</script>
