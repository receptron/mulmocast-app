<template>
  <div>
    <div class="mb-2 flex items-center justify-between">
      <div class="flex items-center gap-3 font-medium">
        <span class="text-base">{{ t("ui.common.beat") }} {{ index + 1 }}</span>
        <Badge v-if="beat.speaker" variant="outline">{{ beat.speaker }}</Badge>
      </div>
      <Badge variant="outline" @click="toggleTypeMode = !toggleTypeMode" class="cursor-pointer" v-if="!toggleTypeMode">
        {{ t("beat." + getBadge(beat) + ".badge") }}</Badge
      >
      <div v-if="toggleTypeMode">
        <BeatSelector @emitBeat="(beat) => changeBeat(beat)" buttonKey="change" :currentBeatType="beatType">
          <Button size="sm" @click="toggleTypeMode = !toggleTypeMode"> {{ t("ui.actions.cancel") }} </Button>
        </BeatSelector>
      </div>
    </div>
    <p class="text-muted-foreground mb-2 text-sm">{{ beat.text }}</p>

    <div class="grid grid-cols-2 gap-4">
      <!-- left: Edit area -->
      <div class="flex flex-col gap-4">
        <div v-if="beat.image && beat.image.type">
          <!-- image/movie: URL or  path -->
          <template v-if="isMediaBeat(beat) && isLocalSourceMediaBeat(beat)">
            <Label class="mb-1 block">{{ t("beat.mediaFile.label") }}</Label>
            <div
              v-if="isLocalSourceMediaBeat(beat)"
              @dragenter.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @dragover.prevent
              @drop.prevent="
                (e) => {
                  isDragging = false;
                  handleDrop(e);
                }
              "
              draggable="true"
              class="border-border bg-card text-muted-foreground mt-4 cursor-pointer rounded-md border-2 border-dashed p-6 text-center shadow-sm"
              :class="
                isDragging
                  ? 'border-primary bg-primary/5 text-primary scale-[1.02] shadow-lg'
                  : 'border-border bg-card text-muted-foreground'
              "
            >
              {{ t("ui.common.drophere") }}
            </div>
            {{ t("ui.common.or") }}
            <div class="flex">
              <Input
                :placeholder="t('beat.mediaFile.placeholder')"
                v-model="mediaUrl"
                :invalid="!validateURL"
                @blur="justSaveAndPushToHistory"
              /><Button @click="submitUrlImage" :disabled="!fetchEnable">
                {{ t("ui.actions.fetch") }}
              </Button>
            </div>
          </template>

          <!-- image/movie: URL or  path -->
          <template v-else-if="isMediaBeat(beat)">
            <Label class="mb-1 block">{{ t("beat.mediaFile.remoteLabel") }}</Label>
            <div v-if="isURLSourceMediaBeat(beat)" class="break-words whitespace-pre-wrap">
              {{ beat.image.source.url }}
            </div>
          </template>

          <!-- textSlide: title & bullets -->
          <template v-else-if="beat.image.type === 'textSlide'">
            <Label class="mb-1 block">{{ t("beat.textSlide.label") }}</Label>
            <Input
              :placeholder="t('ui.common.title')"
              :model-value="beat.image?.slide?.title"
              @update:model-value="(value) => update('image.slide.title', String(value))"
              @blur="justSaveAndPushToHistory"
              class="mb-2"
            />
            <Textarea
              :placeholder="t('beat.textSlide.placeholder')"
              :model-value="beat.image?.slide?.bullets?.join('\n')"
              @update:model-value="
                (value) => update('image.slide.bullets', value === '' ? [] : String(value).split('\n'))
              "
              @blur="justSaveAndPushToHistory"
              rows="4"
            />
          </template>

          <!-- markdown -->
          <template v-else-if="beat.image.type === 'markdown'">
            <Markdown :beat="beat" @update="update" @save="justSaveAndPushToHistory" />
          </template>

          <!-- chart -->
          <template v-else-if="beat.image.type === 'chart'">
            <Chart :beat="beat" @update="update" @save="justSaveAndPushToHistory" />
          </template>

          <!-- mermaid -->
          <template v-else-if="beat.image.type === 'mermaid'">
            <Mermaid :beat="beat" @update="update" @save="justSaveAndPushToHistory" />
          </template>

          <!-- html_tailwind -->
          <template v-else-if="beat.image.type === 'html_tailwind'">
            <Label class="mb-1 block">{{ t("beat.html_tailwind.label") }}</Label>
            <Textarea
              :placeholder="t('beat.html_tailwind.placeholder')"
              :model-value="Array.isArray(beat.image?.html) ? beat.image?.html?.join('\n') : beat.image?.html"
              @update:model-value="(value) => update('image.html', String(value).split('\n'))"
              @blur="justSaveAndPushToHistory"
              class="font-mono"
              rows="10"
            />
          </template>
          <!-- vision -->
          <template v-else-if="beat.image.type === 'vision'">
            <Vision :beat="beat" @update="update" @save="justSaveAndPushToHistory" />
          </template>
          <!-- reference -->
          <template v-else-if="beat.image.type === 'beat'">
            <Label class="mb-1 block">{{ t("beat.beat.label") }}</Label>
            <Input
              :placeholder="t('beat.beat.placeholder')"
              :model-value="beat.image.id"
              @update:model-value="(value) => update('image.id', String(value))"
              @blur="justSaveAndPushToHistory"
              type="text"
            />
          </template>
          <!-- Other -->
          <template v-else>
            <div class="text-destructive text-sm">
              {{ t("ui.validation.unsupportedType", { type: beat.image.type }) }}
            </div>
          </template>
        </div>
        <!-- end of beat.image -->
        <div v-else>
          <template v-if="beat.htmlPrompt">
            <Label class="mb-1 block">{{ t("beat.htmlPrompt.label") }}: </Label>
            <Textarea
              :placeholder="t('beat.htmlPrompt.placeholder')"
              :model-value="beat.htmlPrompt?.prompt"
              @update:model-value="(value) => update('htmlPrompt.prompt', String(value))"
              @blur="justSaveAndPushToHistory"
              class="mt-2 font-mono"
              rows="6"
            />
          </template>
          <template v-else>
            <Label class="mb-1 block">{{ t("beat.imagePrompt.label") }}: </Label>
            <Textarea
              :placeholder="t('beat.imagePrompt.placeholder')"
              :model-value="beat.imagePrompt"
              @update:model-value="(value) => update('imagePrompt', String(value))"
              @blur="justSaveAndPushToHistory"
              class="my-2 h-20 overflow-y-auto"
            />
          </template>
        </div>
      </div>

      <!-- right: image preview -->
      <div class="flex flex-col gap-4">
        <BeatPreviewImage
          :beat="beat"
          :index="index"
          :isImageGenerating="isImageGenerating"
          :isHtmlGenerating="isHtmlGenerating"
          :imageFile="imageFile"
          :toggleTypeMode="toggleTypeMode"
          :disabled="disabledImageGenearte"
          @openModal="openModal"
          @generateImage="generateImageOnlyImage"
        />
      </div>

      <!-- left: movie edit -->
      <div class="flex flex-col gap-4" v-if="beatType === 'imagePrompt'">
        <!-- movie edit -->
        <div>
          <Label class="mb-1 block">{{ t("beat.moviePrompt.label") }}: </Label>
          <Textarea
            :placeholder="t('beat.moviePrompt.placeholder')"
            :model-value="beat.moviePrompt"
            @update:model-value="(value) => update('moviePrompt', String(value))"
            @blur="justSaveAndPushToHistory"
            class="mb-2 h-20 overflow-y-auto"
            :disabled="beat.enableLipSync"
          />
        </div>
      </div>
      <!-- right: movie preview -->
      <div class="flex flex-col gap-4" v-if="beatType === 'imagePrompt'">
        <BeatPreviewMovie
          :beat="beat"
          :index="index"
          :isMovieGenerating="isMovieGenerating"
          :enableMovieGenerate="enableMovieGenerate"
          :movieFile="movieFile"
          :toggleTypeMode="toggleTypeMode"
          @openModal="openModal"
          @generateMovie="generateImageOnlyMovie"
          :disabled="beat.enableLipSync"
        />
      </div>

      <!-- left: lipSync edit -->
      <div class="flex flex-col gap-4" v-if="beatType === 'imagePrompt'">
        <!-- movie edit -->
        <div class="mb-2 flex gap-2">
          <Checkbox
            variant="ghost"
            size="icon"
            :modelValue="beat.enableLipSync"
            @update:model-value="(value) => update('enableLipSync', value)"
          />
          <Label class="mb-2 block">{{ t("beat.lipSync.label") }} </Label>
        </div>
      </div>
      <!-- right: lipSync preview -->
      <div class="flex flex-col gap-4" v-if="beatType === 'imagePrompt'">
        <BeatPreviewMovie
          :beat="beat"
          :index="index"
          :isMovieGenerating="isLipSyncGenerating"
          :enableMovieGenerate="enableLipSyncGenerate"
          :movieFile="lipSyncFiles"
          :toggleTypeMode="toggleTypeMode"
          @openModal="openModal"
          @generateMovie="generateLipSyncMovie"
        />
      </div>
    </div>

    <BeatStyle
      :beat="beat"
      @update="update"
      :imageParams="mulmoScript.imageParams"
      :settingPresence="settingPresence"
      @updateImageNames="updateImageNames"
      @justSaveAndPushToHistory="justSaveAndPushToHistory"
      v-if="beatType === 'imagePrompt'"
    />

    <div
      v-if="mulmoError && mulmoError.length > 0"
      class="border-destructive bg-destructive/10 text-destructive mt-2 w-full rounded border p-2 text-sm"
    >
      <div v-for="(error, key) in mulmoError" :key="key">
        {{ error }}
      </div>
    </div>

    <MediaModal v-model:open="modalOpen" :type="modalType" :src="modalSrc" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import type { MulmoBeat, MulmoScript, MulmoImageAsset } from "mulmocast/browser";
import { useI18n } from "vue-i18n";
import { z } from "zod";

// components
import MediaModal from "@/components/media_modal.vue";
import { Badge, Button, Label, Input, Textarea, Checkbox } from "@/components/ui";
import BeatPreviewImage from "./beat_preview_image.vue";
import BeatPreviewMovie from "./beat_preview_movie.vue";
import BeatSelector from "./beat_selector.vue";
import BeatStyle from "./beat_style.vue";

// lib
import { useMulmoEventStore } from "../../../store";
import { getBadge, getBeatType, isMediaBeat, isURLSourceMediaBeat, isLocalSourceMediaBeat } from "@/lib/beat_util.js";
import { mediaUri } from "@/lib/utils";

import Markdown from "./beat_editors/markdown.vue";
import Chart from "./beat_editors/chart.vue";
import Mermaid from "./beat_editors/mermaid.vue";
import Vision from "./beat_editors/vision.vue";

type FileData = ArrayBuffer | string | null;

interface Props {
  beat: MulmoBeat;
  mulmoScript: MulmoScript;
  index: number;
  imageFile: FileData;
  movieFile: FileData;
  lipSyncFiles: FileData;
  isEnd: boolean;
  mulmoError: string[];
  settingPresence: Record<string, boolean>;
}

const props = defineProps<Props>();
const emit = defineEmits([
  "update",
  "updateImageData",
  "generateImage",
  "changeBeat",
  "updateImageNames",
  "justSaveAndPushToHistory",
]);

const route = useRoute();
const { t } = useI18n();
const mulmoEventStore = useMulmoEventStore();
const projectId = computed(() => route.params.id as string);

const modalOpen = ref(false);
const modalType = ref<"image" | "video" | "audio" | "other">("image");
const modalSrc = ref("");
const mediaUrl = ref("");

const toggleTypeMode = ref(false);

const isDragging = ref(false);

const beatType = computed(() => {
  return getBeatType(props.beat);
});

const enableMovieGenerate = computed(() => {
  return !!props.beat.moviePrompt && !props.beat.enableLipSync;
});
const enableLipSyncGenerate = computed(() => {
  return !!props.beat.enableLipSync;
});
const beatId = computed(() => {
  return props.beat.id;
});

const isImageGenerating = computed(() => {
  return mulmoEventStore.sessionState?.[projectId.value]?.["beat"]["image"]?.[beatId.value] ?? false;
});
const isMovieGenerating = computed(() => {
  return mulmoEventStore.sessionState?.[projectId.value]?.["beat"]["movie"]?.[beatId.value] ?? false;
});
const isLipSyncGenerating = computed(() => {
  return mulmoEventStore.sessionState?.[projectId.value]?.["beat"]["lipSync"]?.[beatId.value] ?? false;
});
const isHtmlGenerating = computed(() => {
  return mulmoEventStore.sessionState?.[projectId.value]?.["beat"]["html"]?.[beatId.value] ?? false;
});
const disabledImageGenearte = computed(() => {
  return beatType.value === "imagePrompt" && (props.beat.text || "") === "" && (props.beat.imagePrompt || "") === "";
});

const videoSubtypeToExtensions = {
  mp4: "mp4",
  quicktime: "mov",
  webm: "webm",
  ogg: "ogv",
  mpeg: "mpeg",
  mp2t: "ts",
  mov: "mov",
  mpg: "mpg",
};

const handleDrop = (event: DragEvent) => {
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    // console.log("File dropped:", file.name);
    const fileExtension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const mimeType = file.type.split("/")[1] ?? "";
    console.log(file.type, mimeType);
    const fileType = mimeType || fileExtension;

    const imageType = (() => {
      if (["jpg", "jpeg", "png"].includes(fileType)) {
        return "image";
      }
      if (["mp4", "quicktime", "webm", "ogg", "mpeg", "mp2t", "mov", "mpg"].includes(fileType)) {
        return "movie";
      }
    })();
    if (!imageType) {
      console.warn(`Unsupported file type: ${fileType}`);
      // TODO: Consider showing a toast notification or alert
      return;
    }
    update("image.type", imageType);
    const extension = fileType === "jpeg" ? "jpg" : videoSubtypeToExtensions[fileType];

    const reader = new FileReader();
    reader.onload = async () => {
      const uint8Array = new Uint8Array(reader.result as ArrayBuffer);
      const path = await window.electronAPI.mulmoHandler(
        "mulmoImageUpload",
        projectId.value,
        props.index,
        [...uint8Array],
        extension,
      );
      const imageData = {
        type: imageType,
        source: {
          kind: "path",
          path: "./" + path,
        },
      };
      updateImageData(imageData, () => {
        generateImageOnlyImage();
      });
    };
    reader.readAsArrayBuffer(file);
  }
};

// image fetch
const imageFetching = ref(false);
const validateURL = computed(() => {
  const urlSchema = z.string().url();
  return mediaUrl.value === "" || urlSchema.safeParse(mediaUrl.value).success;
});
const fetchEnable = computed(() => {
  return mediaUrl.value !== "" && validateURL.value && !imageFetching.value;
});

const submitUrlImage = async () => {
  try {
    imageFetching.value = true;
    const res = (await window.electronAPI.mulmoHandler(
      "mulmoImageFetchURL",
      projectId.value,
      props.index,
      mediaUrl.value,
    )) as { result: boolean; imageType: string; path: string };
    if (res.result) {
      const imageData = {
        type: res.imageType,
        source: {
          kind: "path",
          path: "./" + res.path,
        },
      };
      updateImageData(imageData, () => {
        generateImageOnlyImage();
      });
      mediaUrl.value = "";
    }
  } catch (error) {
    console.log(error);
  }
  imageFetching.value = false;
};

const changeBeat = (beat: MulmoBeat) => {
  const { id, speaker, text } = props.beat;
  emit("changeBeat", { ...beat, id, speaker, text }, props.index);
  toggleTypeMode.value = !toggleTypeMode.value;
};

const generateImageOnlyImage = () => {
  emit("generateImage", props.index, "image");
};
const generateImageOnlyMovie = () => {
  emit("generateImage", props.index, "movie");
};

const generateLipSyncMovie = async () => {
  await window.electronAPI.mulmoHandler("mulmoGenerateBeatAudio", projectId.value, props.index);
  emit("generateImage", props.index, "lipSync");
};

const update = (path: string, value: unknown) => {
  emit("update", props.index, path, value);
};

const updateImageNames = (value: string[]) => {
  emit("update", props.index, "imageNames", value);
};
const updateImageData = (data: MulmoImageAsset, callback?: () => void) => {
  emit("updateImageData", data, callback);
};
const justSaveAndPushToHistory = () => {
  emit("justSaveAndPushToHistory");
};

const openModal = (type: "image" | "video" | "audio" | "other", src: ArrayBuffer | string | null) => {
  if (!src) return;
  modalType.value = type;
  modalSrc.value = mediaUri(src);
  modalOpen.value = true;
};
</script>
