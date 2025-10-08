<template>
  <div>
    <div class="mb-2 flex items-center justify-between">
      <div class="flex items-center gap-3 font-medium">
        <span class="text-base">{{ t("ui.common.beat") }} {{ index + 1 }}</span>
        <Badge
          v-if="beat.speaker && !toggleSpeakerMode"
          variant="outline"
          @click="showSpeakerSelector"
          class="cursor-pointer"
          >{{ beat.speaker }}</Badge
        >
        <div v-if="toggleSpeakerMode">
          <SpeakerSelector
            @emitSpeaker="(speaker) => changeSpeaker(speaker)"
            :currentSpeaker="beat.speaker"
            :speakers="mulmoScript.speechParams?.speakers"
            @cancel="toggleSpeakerMode = false"
          />
        </div>
      </div>
      <Badge variant="outline" @click="showTypeSelector" class="cursor-pointer" v-if="!toggleTypeMode">
        {{ t("beat." + getBadge(beat) + ".badge") }}</Badge
      >
      <div v-if="toggleTypeMode">
        <BeatSelector
          @emitBeat="(beat) => changeBeat(beat)"
          buttonKey="change"
          :currentBeatType="beatType"
          :isPro="isPro"
        >
          <Button size="sm" @click="toggleTypeMode = !toggleTypeMode"> {{ t("ui.actions.cancel") }} </Button>
        </BeatSelector>
      </div>
    </div>
    <div class="mb-4">
      <!-- beat.text -->
      <Textarea
        :model-value="beat.text"
        @update:model-value="(value) => update('text', String(value))"
        @blur="justSaveAndPushToHistory"
        :placeholder="
          t('beat.speaker.placeholder', {
            speaker: beat?.speaker || t('ui.common.speaker'),
            language: t('languages.' + lang),
          })
        "
        class="mb-2 min-h-8 resize-y"
        :class="isBeginner && !beat.text ? 'border-2 border-red-600' : ''"
        rows="2"
      />
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          @click="generateAudio()"
          class="w-fit"
          :disabled="beat?.text?.length === 0 || !isValidBeat"
          >{{ t("ui.actions.generateAudio") }}</Button
        >
        <!-- Error messages for disabled Generate Audio button -->
        <div v-if="beat?.text?.length === 0 || !isValidBeat" class="ml-2 text-xs text-red-600">
          <span v-if="beat?.text?.length === 0">{{
            t("beat.speaker.generateAudioNeedsText", { action: t("ui.actions.generateAudio").toLowerCase() })
          }}</span>
          <span v-else-if="!isValidBeat">{{
            t("beat.speaker.generateAudioNeedsMedia", { action: t("ui.actions.generateAudio").toLowerCase() })
          }}</span>
        </div>
        <audio
          :src="audioFile"
          v-if="!!audioFile"
          controlslist="nodownload noplaybackrate noremoteplayback"
          class="h-7 flex-1"
          controls
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <!-- left: Edit area -->
      <div class="flex flex-col gap-4">
        <div v-if="beat.image && beat.image.type">
          <!-- image/movie: URL or  path -->
          <template v-if="isMediaBeat(beat) && isLocalSourceMediaBeat(beat)">
            <Media
              :beat="beat"
              :index="index"
              :isBeginner="isBeginner"
              @update="update"
              @save="justSaveAndPushToHistory"
              @updateImageData="updateImageData"
              @generateImageOnlyImage="generateImageOnlyImage"
            />
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
            <Markdown :beat="beat" @update="update" @save="justSaveAndPushToHistory" :isBeginner="isBeginner" />
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
            <!-- html prompt beat -->
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
            <!-- image prompt beat -->
            <Label class="mb-1 block">{{ t("beat.imagePrompt.label") }}: </Label>
            <Textarea
              :placeholder="t('beat.imagePrompt.placeholder')"
              :model-value="beat.imagePrompt"
              @update:model-value="(value) => update('imagePrompt', String(value))"
              @blur="justSaveAndPushToHistory"
              class="my-2 h-20 overflow-y-auto"
              :class="isBeginner && !beat.imagePrompt ? 'border-2 border-red-600' : ''"
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
          :movieFile="movieFile"
          :toggleTypeMode="toggleTypeMode"
          :disabled="disabledImageGenearte"
          @openModal="openModal"
          @generateImage="generateImageOnlyImage"
        />
      </div>

      <!-- left: movie edit -->
      <div class="flex flex-col gap-4" v-if="beatType === 'imagePrompt' && enableMovie">
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
      <div class="flex flex-col gap-4" v-if="beatType === 'imagePrompt' && enableMovie">
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
      <div class="flex flex-col gap-4" v-if="beatType === 'imagePrompt' && enableLipSync">
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
      <div class="flex flex-col gap-4" v-if="beatType === 'imagePrompt' && enableLipSync">
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
      :isPro="isPro"
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
import {
  type MulmoBeat,
  type MulmoScript,
  type MulmoImageAsset,
  MulmoPresentationStyleMethods,
  MulmoStudioContextMethods,
  provider2TTSAgent,
} from "mulmocast/browser";
import { useI18n } from "vue-i18n";

// components
import MediaModal from "@/components/media_modal.vue";
import { Badge, Button, Label, Input, Textarea, Checkbox } from "@/components/ui";
import BeatPreviewImage from "./beat_preview_image.vue";
import BeatPreviewMovie from "./beat_preview_movie.vue";
import BeatSelector from "./beat_selector.vue";
import BeatStyle from "./beat_style.vue";
import SpeakerSelector from "./speaker_selector.vue";

// lib
import { useMulmoEventStore } from "../../../store";
import { getBadge, getBeatType, isMediaBeat, isURLSourceMediaBeat, isLocalSourceMediaBeat } from "@/lib/beat_util.js";
import { mediaUri } from "@/lib/utils";
import { notifyProgress, notifyError } from "@/lib/notification";

import Markdown from "./beat_editors/markdown.vue";
import Chart from "./beat_editors/chart.vue";
import Media from "./beat_editors/media.vue";
import Mermaid from "./beat_editors/mermaid.vue";
import Vision from "./beat_editors/vision.vue";
import { useApiErrorNotify } from "@/composables/notify";

type FileData = ArrayBuffer | string | null;

interface Props {
  beat: MulmoBeat;
  mulmoScript: MulmoScript;
  index: number;
  lang: string;
  audioFile?: string;
  imageFile: FileData;
  movieFile: FileData;
  lipSyncFiles: FileData;
  isEnd: boolean;
  isPro: boolean;
  isBeginner: boolean;
  isValidBeat: boolean;
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

const { apiErrorNotify, hasApiKey } = useApiErrorNotify();

const toggleTypeMode = ref(false);
const toggleSpeakerMode = ref(false);

const showSpeakerSelector = () => {
  toggleSpeakerMode.value = true;
  toggleTypeMode.value = false;
};

const showTypeSelector = () => {
  toggleTypeMode.value = true;
  toggleSpeakerMode.value = false;
};

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

const changeBeat = (beat: MulmoBeat) => {
  const { id, speaker, text } = props.beat;
  emit("changeBeat", { ...beat, id, speaker, text }, props.index);
  toggleTypeMode.value = !toggleTypeMode.value;
};

const changeSpeaker = (speaker: string) => {
  update("speaker", speaker);
  toggleSpeakerMode.value = false;
};

const generateImageOnlyImage = () => {
  const imageAgentInfo = MulmoPresentationStyleMethods.getImageAgentInfo(props.mulmoScript, props.beat);
  if (!hasApiKey(imageAgentInfo.keyName)) {
    apiErrorNotify(imageAgentInfo.keyName);
    return;
  }
  emit("generateImage", props.index, "image");
};

const enableMovie = computed(() => {
  try {
    const movieAgentInfo = MulmoPresentationStyleMethods.getMovieAgentInfo(props.mulmoScript, props.beat);
    return hasApiKey(movieAgentInfo.keyName);
  } catch (error) {
    console.error(error);
    return false;
  }
});

const generateImageOnlyMovie = () => {
  const movieAgentInfo = MulmoPresentationStyleMethods.getMovieAgentInfo(props.mulmoScript, props.beat);
  if (!enableMovie.value) {
    apiErrorNotify(movieAgentInfo.keyName);
    return;
  }
  emit("generateImage", props.index, "movie");
};

const enableLipSync = computed(() => {
  const lipSyncAgentInfo = MulmoPresentationStyleMethods.getLipSyncAgentInfo(props.mulmoScript, props.beat);
  return hasApiKey(lipSyncAgentInfo.keyName);
});

const generateLipSyncMovie = async () => {
  const lipSyncAgentInfo = MulmoPresentationStyleMethods.getLipSyncAgentInfo(props.mulmoScript, props.beat);
  if (!hasApiKey(lipSyncAgentInfo.keyName)) {
    apiErrorNotify(lipSyncAgentInfo.keyName);
    return;
  }
  await window.electronAPI.mulmoHandler("mulmoGenerateBeatAudio", projectId.value, props.index);
  emit("generateImage", props.index, "lipSync");
};

const generateAudio = async () => {
  try {
    const { provider } = MulmoStudioContextMethods.getAudioParam(
      { ...props.mulmoScript, presentationStyle: props.mulmoScript },
      props.beat,
      props.lang,
    );
    const { keyName } = provider2TTSAgent[provider];
    if (!hasApiKey(keyName)) {
      apiErrorNotify(keyName);
      return;
    }

    notifyProgress(window.electronAPI.mulmoHandler("mulmoGenerateBeatAudio", projectId.value, props.index), {
      successMessage: t("notify.audio.successMessage"),
      errorMessage: t("notify.audio.errorMessage"),
      errorDescription: t("notify.error.noContext"),
    });
  } catch (error) {
    notifyError(
      t("ui.common.error"),
      t("notify.error.audio.generateAudioSpeechParam", { speechParams: t("parameters.speechParams.title") }),
    );
    console.log(error);
  }
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
