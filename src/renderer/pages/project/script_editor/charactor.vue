<template>
  <CharactorSelector class="mt-4" @addReferenceImage="addReferenceImage" :referenceKeys="Object.keys(images) ?? []" />
  <div v-for="(imageKey, key) in Object.keys(images).sort()" :key="`${imageKey}_${key}`" class="relative">
    <Card class="mt-8 gap-2 space-y-1 p-4" :class="isValidData[imageKey] ? '' : 'border-2 border-red-400'">
      <div class="grid grid-cols-2 gap-4">
        <div>
          {{ t("ui.common.key") }} : {{ imageKey }}
          <template v-if="images[imageKey].type === 'imagePrompt'">
            <Label class="mb-1 block">{{ t("beat.imagePrompt.label") }} : </Label>

            <Textarea
              :placeholder="t('beat.imageReference.imagePromptPlaceholder')"
              :model-value="images[imageKey].prompt"
              @update:model-value="(value) => update('imagePrompt', imageKey, String(value))"
              class="mb-2 h-20 overflow-y-auto"
              :disabled="mulmoEventStore.sessionState?.[projectId]?.['beat']?.['imageReference'][imageKey]"
            />
          </template>
          <template v-if="images[imageKey].type === 'image' && images[imageKey].source.kind === 'path'">
            <Label class="mb-1 block">{{ t("beat.imageReference.label") }}</Label>

            <div
              @dragover.prevent
              @drop.prevent="(e) => handleDrop(e, imageKey)"
              @click="() => selectLocalImage(imageKey)"
              @keydown.enter.prevent="selectLocalImage(imageKey)"
              @keydown.space.prevent="selectLocalImage(imageKey)"
              draggable="true"
              class="border-border bg-card text-muted-foreground mt-4 cursor-pointer rounded-md border-2 border-dashed p-6 text-center whitespace-pre-line shadow-sm"
              role="button"
              tabindex="0"
            >
              {{ t("ui.common.drophere", { maxSizeMB }) }}
            </div>
            <div class="text-muted-foreground mt-2 ml-2 text-sm">{{ t("ui.common.or") }}</div>
            <div class="mt-2 flex flex-wrap gap-2">
              <Input
                :placeholder="t('beat.imageReference.placeholderUrl')"
                v-model="mediaUrl"
                :invalid="!validateURL"
                class="min-w-0 flex-1"
              />
              <Button @click="() => submitUrlImage(imageKey)" :disabled="!fetchEnable" class="shrink-0">
                {{ t("ui.actions.fetch") }}
              </Button>
            </div>
            <div class="text-muted-foreground mt-2 ml-2 text-sm">{{ t("ui.common.or") }}</div>
            <div class="mt-2">
              <Button @click="() => openMediaLibrary(imageKey)" type="button">
                {{ t("ui.actions.openImageLibrary") }}
              </Button>
            </div>
          </template>
          <div
            v-if="images[imageKey].type === 'image' && images[imageKey].source.kind === 'url'"
            class="break-words whitespace-pre-wrap"
          >
            {{ images[imageKey].source.url }}
          </div>
        </div>
        <div>
          <div class="border-border relative rounded-lg border-2 border-dashed p-4 text-center">
            <Button
              v-if="images[imageKey].type === 'imagePrompt'"
              variant="ghost"
              size="icon"
              class="border-border bg-card hover:bg-muted absolute -top-3 -left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow transition-colors"
              @click="() => generateReferenceImage(imageKey, key)"
              :disabled="
                isArtifactGenerating ||
                !isValidScriptData ||
                mulmoEventStore.sessionState?.[projectId]?.['beat']?.['imageReference'][imageKey]
              "
            >
              <Loader2
                v-if="mulmoEventStore.sessionState?.[projectId]?.['beat']?.['imageReference'][imageKey]"
                class="h-4 w-4 animate-spin"
              />
              <Sparkles v-else class="h-4 w-4" />
            </Button>
            <div v-if="imageRefs[imageKey]" class="flex items-center justify-center">
              <img :src="imageRefs[imageKey]" class="max-h-64" @click="openImage(imageKey)" />
            </div>
            <template v-else>
              <FileImage :size="32" class="text-muted-foreground mx-auto mb-2" />
              <p class="text-muted-foreground text-sm">
                {{ t("beat.imagePreview") }}
              </p>
              <template
                v-if="
                  images[imageKey].type === 'imagePrompt' &&
                  !mulmoEventStore.sessionState?.[projectId]?.['beat']?.['imageReference'][imageKey]
                "
              >
                <p v-if="!images[imageKey].prompt" class="mt-2 text-xs text-red-500">
                  {{
                    t("project.scriptEditor.reference.imageGenerationDisabled.needPrompt", {
                      imagePromptLabel: t("beat.imagePrompt.label"),
                    })
                  }}
                </p>
                <p v-else-if="!isValidScriptData" class="mt-2 text-xs text-red-500">
                  {{
                    t("project.scriptEditor.reference.imageGenerationDisabled.needValidScript", {
                      beatTabLabel: t("project.scriptEditor.media.tabLabel"),
                    })
                  }}
                </p>
              </template>
            </template>
          </div>
        </div>
      </div>
    </Card>
    <div
      class="border-border bg-card absolute -top-5 right-0 z-10 flex items-center gap-3 rounded border px-2 py-1 shadow-sm"
    >
      <Trash
        class="text-muted-foreground hover:text-destructive h-5 w-5 cursor-pointer transition"
        @click="deleteReference(imageKey)"
      />
    </div>
  </div>
  <MediaModal v-model:open="modalOpen" type="image" :src="modalSrc" />
  <MediaLibraryDialog
    ref="mediaLibraryRef"
    :project-id="props.projectId"
    :allowed-media-types="['image']"
    @select="selectScriptImage"
  />
</template>

<script setup lang="ts">
import { Trash, Sparkles, FileImage, Loader2 } from "lucide-vue-next";
import { ref, computed, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import { useMediaUrl } from "../composable/media_url";

import {
  type MulmoScript,
  type MulmoImageMedia,
  type MulmoImagePromptMedia,
  type MulmoImageParamsImages,
  MulmoPresentationStyleMethods,
  mulmoImageMediaSchema,
  mulmoImagePromptMediaSchema,
} from "mulmocast/browser";

import MediaModal from "@/components/media_modal.vue";
import { Card } from "@/components/ui/card";
import { Button, Label, Textarea, Input } from "@/components/ui";
import { bufferToUrl } from "@/lib/utils";
import { readFileAsArrayBuffer, type BinaryFileData } from "@/lib/file";

import CharactorSelector from "./charactor_selector.vue";
import MediaLibraryDialog, {
  type MediaLibraryDialogExposed,
  type ProjectScriptMedia,
} from "./beat_editors/media_library_dialog.vue";

import { notifySuccess, notifyProgress, notifyError } from "@/lib/notification";
import { useApiErrorNotify } from "@/composables/notify";
import { useMulmoEventStore } from "../../../store";

interface Props {
  projectId: string;
  images: MulmoImageParamsImages;
  isArtifactGenerating: boolean;
  isValidScriptData: boolean;
  mulmoScript: MulmoScript;
}

const { t } = useI18n();
const mulmoEventStore = useMulmoEventStore();

const props = defineProps<Props>();
const emit = defineEmits([
  "updateImage",
  "updateImagePath",
  "addReferenceImage",
  "deleteReferenceImage",
  "saveMulmo",
  "formatAndPushHistoryMulmoScript",
]);
const { apiErrorNotify, hasApiKey } = useApiErrorNotify();

const imageRefs = ref<Record<string, string>>({});
const maxSizeMB = 50;

const mediaLibraryRef = ref<MediaLibraryDialogExposed | null>(null);
const activeImageKey = ref<string | null>(null);

const loadReference = async () => {
  imageRefs.value = await window.electronAPI.mulmoHandler("mulmoReferenceImagesFiles", props.projectId);
  Object.keys(imageRefs.value).forEach((key) => {
    imageRefs.value[key] = bufferToUrl(imageRefs.value[key]);
  });
};
loadReference();

// modal
const modalOpen = ref(false);
const modalSrc = ref("");
const openImage = (imageKey: string) => {
  modalOpen.value = true;
  modalSrc.value = imageRefs.value[imageKey];
};

watch(
  () => props.isValidScriptData,
  () => {
    loadReference();
  },
);

const isValidData = computed(() => {
  const schema = z.union([mulmoImageMediaSchema, mulmoImagePromptMediaSchema]);
  return Object.keys(props.images).reduce((tmp: Record<string, boolean>, key) => {
    const value = props.images[key];
    tmp[key] = schema.safeParse(value).success;
    return tmp;
  }, {});
});

const update = (target: string, imageKey: string, prompt: string) => {
  emit("updateImage", imageKey, prompt);
};

// image fetch
const { imageFetching, mediaUrl, validateURL, fetchEnable } = useMediaUrl();

const loadImageAndSuccessMessage = async (imageKey: string) => {
  const res = await window.electronAPI.mulmoHandler("mulmoReferenceImagesFile", props.projectId, imageKey);
  imageRefs.value[imageKey] = res ? bufferToUrl(res) : null;
  notifySuccess(t("notify.imageReference.successMessage"));
};

const submitUrlImage = async (imageKey: string) => {
  try {
    imageFetching.value = true;
    const res = (await window.electronAPI.mulmoHandler(
      "mulmoReferenceImageFetchURL",
      props.projectId,
      imageKey,
      mediaUrl.value,
    )) as { result: boolean; imageType: string; path: string };
    if (res.result) {
      if (res.imageType === "image") {
        emit("updateImagePath", imageKey, "./" + res.path);
        emit("saveMulmo"); // TODO: not emited.
        emit("formatAndPushHistoryMulmoScript");
        mediaUrl.value = "";
        await nextTick();

        // await loadReference();
        await loadImageAndSuccessMessage(imageKey);
      } else {
        console.log("error");
        notifyError(t("notify.error.media.unsupportedMovie"));
      }
    }
  } catch (error) {
    console.log(error);
  }
  imageFetching.value = false;
};

const addReferenceImage = (key: string, data: MulmoImageMedia | MulmoImagePromptMedia) => {
  emit("addReferenceImage", key, data);
};
const deleteReference = (key: string) => {
  emit("deleteReferenceImage", key);
};

const openMediaLibrary = async (imageKey: string) => {
  activeImageKey.value = imageKey;
  if (mediaLibraryRef.value) {
    await mediaLibraryRef.value.open();
  }
};

const selectScriptImage = async (media: ProjectScriptMedia) => {
  if (!activeImageKey.value) {
    return;
  }
  if (media.mediaType !== "image") {
    notifyError(t("notify.error.media.unsupportedMovie"));
    activeImageKey.value = null;
    return;
  }

  const projectRelativePath = media.projectRelativePath.startsWith("./")
    ? media.projectRelativePath
    : `./${media.projectRelativePath.replace(/^\/+/u, "")}`;

  emit("updateImagePath", activeImageKey.value, projectRelativePath);
  emit("saveMulmo");
  emit("formatAndPushHistoryMulmoScript");
  await nextTick();
  await loadImageAndSuccessMessage(activeImageKey.value);
  // await loadReference();
  // notifySuccess(t("notify.imageReference.successMessage"));
  activeImageKey.value = null;
};

const processReferenceImage = async (fileData: BinaryFileData, imageKey: string) => {
  const maxSize = maxSizeMB * 1024 * 1024;
  if (fileData.size > maxSize) {
    notifyError(t("notify.error.media.tooLarge", { maxSizeMB }));
    return;
  }

  const fileExtension = fileData.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = fileData.type.split("/")[1] ?? "";
  const fileType = mimeType || fileExtension;

  if (!["jpg", "jpeg", "png"].includes(fileType)) {
    notifyError(t("notify.error.media.unsupportedType", { fileType }));
    return;
  }

  const extension = fileType === "jpeg" ? "jpg" : fileType;
  const uint8Array = fileData.buffer instanceof Uint8Array ? fileData.buffer : new Uint8Array(fileData.buffer);
  const path = await window.electronAPI.mulmoHandler(
    "mulmoReferenceImageUpload",
    props.projectId,
    imageKey,
    [...uint8Array],
    extension,
  );
  emit("updateImagePath", imageKey, "./" + path);
  // Workaround: wait for the script change
  await nextTick();

  const res = await window.electronAPI.mulmoHandler("mulmoReferenceImagesFile", props.projectId, imageKey);
  imageRefs.value[imageKey] = res ? bufferToUrl(res) : null;
  notifySuccess(t("notify.imageReference.successMessage"));
};

const handleDrop = async (eventOrFileData: DragEvent | BinaryFileData, imageKey: string) => {
  if ("dataTransfer" in eventOrFileData) {
    const files = eventOrFileData.dataTransfer?.files;
    if (files?.length) {
      const file = files[0];
      try {
        const buffer = await readFileAsArrayBuffer(file);
        await processReferenceImage(
          {
            name: file.name,
            size: file.size,
            type: file.type,
            buffer,
          },
          imageKey,
        );
      } catch (error) {
        console.error(error);
      }
    }
    return;
  }

  try {
    await processReferenceImage(eventOrFileData, imageKey);
  } catch (error) {
    console.error(error);
  }
};

const selectLocalImage = async (imageKey: string) => {
  try {
    const filePath = await window.electronAPI.dialog.openFile("image");
    if (!filePath) {
      return;
    }
    const fileData = await window.electronAPI.file.readBinary(filePath);
    if (!fileData) {
      return;
    }
    await handleDrop(fileData, imageKey);
  } catch (error) {
    console.error(error);
  }
};

const generateReferenceImage = async (imageKey: string, key: number) => {
  if (mulmoEventStore.sessionState?.[props.projectId]?.["beat"]?.["imageReference"][imageKey]) {
    return;
  }
  const imageAgentInfo = MulmoPresentationStyleMethods.getImageAgentInfo(props.mulmoScript);
  if (!hasApiKey(imageAgentInfo.keyName)) {
    apiErrorNotify(imageAgentInfo.keyName);
    return;
  }

  try {
    imageFetching.value = true;
    await notifyProgress(
      window.electronAPI.mulmoHandler("mulmoReferenceImage", props.projectId, key, imageKey, {
        type: "imagePrompt",
        prompt: props.images[imageKey].prompt,
      }),
      {
        successMessage: t("notify.imageReference.successMessage"),
        errorMessage: t("notify.imageReference.errorMessage"),
        errorDescription: t("notify.error.noContext"),
      },
    );

    const res = await window.electronAPI.mulmoHandler("mulmoReferenceImagesFile", props.projectId, imageKey);
    imageRefs.value[imageKey] = res ? bufferToUrl(res) : null;
  } catch (error) {
    console.log(error);
  }
  imageFetching.value = false;
};
</script>
