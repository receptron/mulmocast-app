<template>
  <div>
    <div class="mb-2 flex items-center justify-between">
      <div class="flex items-center gap-3 font-medium">
        <span class="text-base">Beat: {{ index + 1 }}</span>
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
    <p class="mb-2 text-sm text-gray-600">{{ beat.text }}</p>

    <div class="grid grid-cols-2 gap-4">
      <!-- left: Edit area -->
      <div class="flex flex-col gap-4">
        <div v-if="beat.image && beat.image.type">
          <!-- image/movie: URL or  path -->
          <template v-if="isMediaBeat(beat) && isLocalSourceMediaBeat(beat)">
            <Label class="mb-1 block">{{ t("beat.mediaFile.label") }}</Label>
            <div
              v-if="isLocalSourceMediaBeat(beat)"
              @dragover.prevent
              @drop.prevent="(e) => handleDrop(e)"
              draggable="true"
              class="mt-4 cursor-pointer rounded-md border-2 border-dashed border-gray-300 bg-white p-6 text-center text-gray-600 shadow-sm"
            >
              {{ t("ui.common.drophere") }}
            </div>
            {{ t("ui.common.or") }}
            <div class="flex">
              <Input :placeholder="t('beat.mediaFile.placeholder')" v-model="mediaUrl" :invalid="!validateURL" /><Button
                @click="submitUrlImage"
                :disabled="!fetchEnable"
              >
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
              class="mb-2"
            />
            <Textarea
              :placeholder="t('beat.textSlide.placeholder')"
              :model-value="beat.image?.slide?.bullets?.join('\n')"
              @update:model-value="(value) => update('image.slide.bullets', String(value).split('\n'))"
              rows="4"
            />
          </template>

          <!-- markdown -->
          <template v-else-if="beat.image.type === 'markdown'">
            <Label class="mb-1 block">{{ t("beat.markdown.label") }}</Label>
            <Textarea
              :placeholder="t('beat.markdown.placeholder')"
              :model-value="
                Array.isArray(beat.image?.markdown) ? beat.image?.markdown.join('\n') : beat.image?.markdown
              "
              @update:model-value="(value) => update('image.markdown', String(value).split('\n'))"
              class="font-mono"
              rows="6"
            />
          </template>

          <!-- chart -->
          <template v-else-if="beat.image.type === 'chart'">
            <Label class="mb-1 block">{{ t("beat.chart.label") }}</Label>
            <Textarea
              :placeholder="t('beat.chart.placeholder')"
              :model-value="JSON.stringify(beat.image?.chartData, null, 2)"
              @update:model-value="
                (value) => {
                  try {
                    update('image.chartData', JSON.parse(String(value)));
                  } catch (_) {}
                }
              "
              class="font-mono"
              rows="8"
            />
          </template>

          <!-- mermaid -->
          <template v-else-if="beat.image.type === 'mermaid'">
            <Label class="mb-1 block">{{ t("beat.mermaid.label") }}</Label>
            <Textarea
              :placeholder="t('beat.mermaid.placeholder')"
              :model-value="beat?.image?.code?.text"
              @update:model-value="(value) => update('image.code.text', String(value))"
              class="font-mono"
              rows="6"
            />
          </template>

          <!-- html_tailwind -->
          <template v-else-if="beat.image.type === 'html_tailwind'">
            <Label class="mb-1 block">{{ t("beat.html_tailwind.label") }}</Label>
            <Textarea
              :placeholder="t('beat.html_tailwind.placeholder')"
              :model-value="Array.isArray(beat.image?.html) ? beat.image?.html?.join('\n') : beat.image?.html"
              @update:model-value="(value) => update('image.html', String(value).split('\n'))"
              class="font-mono"
              rows="10"
            />
          </template>
          <!-- reference -->
          <template v-else-if="beat.image.type === 'beat'">
            <Label class="mb-1 block">{{ t("beat.beat.label") }}</Label>
            <Input
              :placeholder="t('beat.beat.placeholder')"
              :model-value="beat.image.id"
              @update:model-value="(value) => update('image.id', String(value))"
              type="text"
            />
          </template>
          <!-- Other -->
          <template v-else>
            <div class="text-sm text-red-500">{{ t('ui.validation.unsupportedType', { type: beat.image.type }) }}</div>
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
        <div>
          <Label class="mb-1 block">{{ t("beat.lipSync.label") }}: </Label>
          <Checkbox
            variant="ghost"
            size="icon"
            :modelValue="beat.enableLipSync"
            @update:model-value="(value) => update('enableLipSync', value)"
          />: {{ t(beat.enableLipSync ? "ui.common.enable" : "ui.common.disable") }}
        </div>
      </div>
      <!-- right: lipSync preview -->
      <div class="flex flex-col gap-4" v-if="beatType === 'imagePrompt'">
        <BeatPreviewMovie
          :beat="beat"
          :index="index"
          :isMovieGenerating="isMovieGenerating"
          :enableMovieGenerate="enableLipSyncGenerate"
          :movieFile="movieFile"
          :toggleTypeMode="toggleTypeMode"
          @openModal="openModal"
          @generateMovie="generateImageOnlyMovie"
        />
      </div>
    </div>

    <BeatStyle
      :beat="beat"
      @update="update"
      :imageParams="mulmoScript.imageParams"
      @updateImageNames="updateImageNames"
      v-if="beatType === 'imagePrompt'"
    />

    <div
      v-if="mulmoError && mulmoError.length > 0"
      class="mt-2 w-full rounded border border-red-500 bg-red-100 p-2 text-sm text-red-800"
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
import type { MulmoBeat, MulmoScript } from "mulmocast/browser";
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

type FileData = ArrayBuffer | string | null;

interface Props {
  beat: MulmoBeat;
  mulmoScript: MulmoScript;
  index: number;
  imageFile: FileData;
  movieFile: FileData;
  isEnd: boolean;
  mulmoError: string[];
}

const props = defineProps<Props>();
const emit = defineEmits(["update", "generateImage", "changeBeat", "updateImageNames"]);

const route = useRoute();
const { t } = useI18n();
const mulmoEventStore = useMulmoEventStore();
const projectId = computed(() => route.params.id as string);

const modalOpen = ref(false);
const modalType = ref<"image" | "video" | "audio" | "other">("image");
const modalSrc = ref("");
const mediaUrl = ref("");

const toggleTypeMode = ref(false);

const beatType = computed(() => {
  return getBeatType(props.beat);
});

const enableMovieGenerate = computed(() => {
  return !!props.beat.moviePrompt && !props.beat.enableLipSync;
});
const enableLipSyncGenerate = computed(() => {
  return !!props.beat.enableLipSync;
  // return !!props.beat.moviePrompt;
});

const isImageGenerating = computed(() => {
  return mulmoEventStore.sessionState?.[projectId.value]?.["beat"]["image"]?.[props.index] ?? false;
});
const isMovieGenerating = computed(() => {
  return mulmoEventStore.sessionState?.[projectId.value]?.["beat"]["movie"]?.[props.index] ?? false;
});
const isHtmlGenerating = computed(() => {
  return mulmoEventStore.sessionState?.[projectId.value]?.["beat"]["html"]?.[props.index] ?? false;
});
const disabledImageGenearte = computed(() => {
  return beatType.value === "imagePrompt" && (props.beat.text || "") === "" && (props.beat.imagePrompt || "") === "";
});
const handleDrop = (event: DragEvent) => {
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    // console.log("File dropped:", file.name);
    const fileExtension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const mimeType = file.type.split("/")[1] ?? "";
    const fileType = mimeType || fileExtension;

    const imageType = (() => {
      if (["jpg", "jpeg", "png"].includes(fileType)) {
        return "image";
      }
      if (["mov", "mp4", "mpg"].includes(fileType)) {
        return "movie";
      }
    })();
    if (!imageType) {
      console.warn(`Unsupported file type: ${fileType}`);
      // TODO: Consider showing a toast notification or alert
      return;
    }
    update("image.type", imageType);
    const extension = fileType === "jpeg" ? "jpg" : fileType;

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
      update("image.source.path", "./" + path);
      generateImageOnlyImage();
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
      update("image.type", res.imageType);
      update("image.source.path", "./" + res.path);
      generateImageOnlyImage();
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

const update = (path: string, value: unknown) => {
  emit("update", props.index, path, value);
};

const updateImageNames = (value: string[]) => {
  emit("update", props.index, "imageNames", value);
};

const openModal = (type: "image" | "video" | "audio" | "other", src: ArrayBuffer | string | null) => {
  if (!src) return;
  modalType.value = type;
  modalSrc.value = mediaUri(src);
  modalOpen.value = true;
};
</script>
