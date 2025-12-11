<template>
  <div>
    <div class="mb-2 flex items-center justify-between">
      <div class="flex items-center gap-3 font-medium">
        <span class="text-base">{{ t("ui.common.beat") }} {{ index + 1 }}</span>
        <div class="flex items-center gap-1" v-if="false">
          <CircleUserRound class="size-4 opacity-50" />
          <div v-if="beat.speaker && !toggleSpeakerMode" class="group relative">
            <Badge variant="outline" @click="showSpeakerSelector" class="cursor-pointer">
              {{ beat.speaker }}<ChevronDown class="ml-1 size-4 opacity-50"
            /></Badge>
            <span
              class="bg-popover text-popover-foreground border-border pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded border px-2 py-1 text-xs whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            >
              <div>{{ t("beat.speaker.tooltipTitle", { speakerLabel: t("beat.speaker.label") }) }}</div>
              <div class="text-muted-foreground">
                {{ t("beat.speaker.tooltipDescription", { tab: "Style" }) }}
              </div>
              <div class="text-muted-foreground">
                {{ t("beat.speaker.tooltipNote") }}
              </div>
            </span>
          </div>
        </div>
        <div>
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

      <!-- Audio Source Selection -->
      <RadioGroup :model-value="audioSourceType" @update:model-value="handleAudioSourceChange" class="mb-2 flex gap-4">
        <div class="flex items-center space-x-2">
          <RadioGroupItem :id="`generate-${index}`" value="generate" />
          <Label :for="`generate-${index}`" class="cursor-pointer font-normal">{{
            t("beat.audio.generateFromText")
          }}</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem :id="`upload-${index}`" value="upload" />
          <Label :for="`upload-${index}`" class="cursor-pointer font-normal">{{ t("beat.audio.uploadFile") }}</Label>
        </div>
      </RadioGroup>

      <!-- Upload Audio Section -->
      <div v-if="audioSourceType === 'upload'" class="space-y-2">
        <div
          @dragover.prevent
          @drop.prevent="handleAudioDrop"
          @click="handleAudioFileClick"
          :class="[
            'border-border bg-card relative cursor-pointer rounded-md border-2 border-dashed p-3 text-center shadow-sm transition-colors',
            isAudioUploading ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted/50',
          ]"
        >
          <template v-if="isAudioUploading">
            <div class="text-muted-foreground">{{ t("ui.status.loading") }}</div>
          </template>
          <template v-else-if="uploadedAudioFilename">
            <div class="flex items-center justify-center gap-2">
              <Music class="text-muted-foreground h-4 w-4 flex-shrink-0" />
              <span class="text-foreground truncate text-sm font-medium" :title="uploadedAudioFilename">{{
                uploadedAudioFilename
              }}</span>
              <Button
                @click="handleAudioFileRemove"
                variant="ghost"
                size="icon"
                class="h-6 w-6 flex-shrink-0"
                :title="t('ui.actions.delete')"
              >
                <X class="h-4 w-4" />
              </Button>
            </div>
            <div class="text-muted-foreground mt-1 text-xs">{{ t("beat.audio.clickToReplace") }}</div>
          </template>
          <template v-else>
            <div class="text-muted-foreground">{{ t("beat.audio.dropAudioHere") }}</div>
            <div class="text-muted-foreground/80 mt-1 text-xs">{{ t("beat.audio.clickToSelect") }}</div>
          </template>
        </div>
        <input
          ref="audioFileInput"
          type="file"
          :accept="audioAccept"
          @change="handleAudioFileSelect"
          class="hidden"
          :disabled="isAudioUploading"
        />
      </div>

      <!-- Generate Audio Section -->
      <div v-if="audioSourceType === 'generate'" class="space-y-2">
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="generateAudio()"
            class="w-fit"
            :disabled="!isValidBeat || isArtifactGenerating || beat?.text?.length === 0"
            >{{ t("ui.actions.generateAudio") }}</Button
          >
          <!-- Audio Player for generate mode -->
          <audio
            ref="audioPlayerRef"
            :src="audioFile"
            v-if="!!audioFile"
            controlslist="nodownload noplaybackrate noremoteplayback"
            class="h-7 flex-1"
            controls
          />
        </div>
        <!-- Error messages for disabled Generate Audio button -->
        <div v-if="beat?.text?.length === 0 || !isValidBeat" class="text-xs text-red-600">
          <span v-if="beat?.text?.length === 0">{{
            t("beat.speaker.generateAudioNeedsText", { action: t("ui.actions.generateAudio").toLowerCase() })
          }}</span>
          <span v-else-if="!isValidBeat">{{
            t("beat.speaker.generateAudioNeedsMedia", { action: t("ui.actions.generateAudio").toLowerCase() })
          }}</span>
        </div>
      </div>

      <!-- Audio Player for upload mode -->
      <audio
        ref="audioPlayerRef"
        :src="audioFile"
        v-if="audioSourceType === 'upload' && !!audioFile"
        controlslist="nodownload noplaybackrate noremoteplayback"
        class="h-7 w-full"
        controls
      />
    </div>
    <hr class="mb-2" />

    <div class="group relative mb-4 flex items-center gap-2" v-if="isPro && !isVoiceOver">
      <Label class="mb-1 block">{{ t("beat.duration.label") }}</Label>

      <Input
        class="w-16"
        :placeholder="t('beat.duration.placeholder')"
        :model-value="beat?.duration"
        @update:model-value="(value) => update('duration', value === '' ? undefined : Number(value))"
        @blur="justSaveAndPushToHistory"
      />
      <span class="text-muted-foreground text-sm">{{ t("beat.duration.unit") }}</span>
      <div v-if="expectDuration && beat.moviePrompt" class="text-muted-foreground text-sm">
        <div>{{ t("beat.duration.supportedDurations", { durations: expectDuration.join(", ") }) }}</div>
        <div v-if="isVeo31Model" class="mt-1">
          {{ t("beat.duration.veo31ExtendedNote") }}
        </div>
      </div>
      <span
        class="bg-popover text-muted-foreground border-border pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded border px-2 py-1 text-xs whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      >
        <div>{{ t(durationTooltipKey + ".line1") }}</div>
        <div :class="durationTooltipKey === 'beat.duration.tooltipGeneratedVideo' ? 'ml-2' : ''">
          {{ t(durationTooltipKey + ".line2") }}
        </div>
        <div v-if="durationTooltipKey === 'beat.duration.tooltipGeneratedVideo'" class="ml-2">
          {{ t(durationTooltipKey + ".line3", { label: t("beat.duration.label") }) }}
        </div>
        <div v-if="durationTooltipKey === 'beat.duration.tooltipGeneratedVideo'">
          {{ t(durationTooltipKey + ".line4") }}
        </div>
      </span>
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
            <Select :model-value="beat.image.id" @update:model-value="(value) => update('image.id', value)">
              <SelectTrigger class="h-8" :class="!isReferencedBeatValid ? 'border-destructive' : ''">
                <SelectValue :placeholder="t('beat.beat.placeholder')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="refBeat in referenceBeats" :key="refBeat.id" :value="refBeat.id">
                  {{ refBeat.label }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="!isReferencedBeatValid" class="text-destructive mt-1 text-sm">
              {{ t("beat.beat.invalidReference") }}
            </p>
            <div v-else class="text-muted-foreground mt-2 text-sm">
              <p>{{ t("beat.beat.cannotReference", { beatLabel: t("beat.beat.label") }) }}</p>
              <p class="mt-1">{{ t("beat.beat.description") }}</p>
            </div>
          </template>
          <template v-else-if="beat.image.type === 'voice_over'">
            <Label class="mb-1 block">{{ t("beat.voice_over.label") }}</Label>
            <Input
              :placeholder="t('beat.startAt.placeholder')"
              :model-value="beat.image.startAt"
              @update:model-value="
                (value) =>
                  update('image.startAt', !value || !/^[0-9]+$/.test(String(value)) ? undefined : Number(value))
              "
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
          ref="beatPreviewImageRef"
          :beat="beat"
          :index="index"
          :isImageGenerating="isImageGenerating"
          :isHtmlGenerating="isHtmlGenerating"
          :imageFile="imageFile"
          :movieFile="movieFile"
          :referencedImageFile="referencedImageFile"
          :referencedMovieFile="referencedMovieFile"
          :toggleTypeMode="toggleTypeMode"
          :disabled="!isValidBeat || isArtifactGenerating || disabledImageGenearte"
          @openModal="openModal"
          @generateImage="generateImageOnlyImage"
          @imageRestored="handleImageRestored"
        />
      </div>

      <!-- left: movie edit -->
      <div class="flex flex-col gap-4" v-if="enableMovie && hasMovieApiKey && !isVoiceOver">
        <!-- movie edit -->
        <div>
          <Label class="mb-1 block">{{ t("beat.moviePrompt.label") }}: </Label>
          <Textarea
            :placeholder="t('beat.moviePrompt.placeholder')"
            :model-value="beat.moviePrompt"
            @update:model-value="(value) => update('moviePrompt', String(value))"
            @blur="justSaveAndPushToHistory"
            class="mb-2 h-20 overflow-y-auto"
            :disabled="lipSyncTargetInfo.supportsImage && beat.enableLipSync"
          />
        </div>
      </div>
      <!-- right: movie preview -->
      <div class="flex flex-col gap-4" v-if="enableMovie && hasMovieApiKey && !isVoiceOver">
        <BeatPreviewMovie
          ref="beatPreviewMovieRef"
          :beat="beat"
          :index="index"
          :isMovieGenerating="isMovieGenerating"
          :enableMovieGenerate="enableMovieGenerate"
          :enableMovie="enableMovie"
          :movieFile="movieFile"
          :toggleTypeMode="toggleTypeMode"
          @openModal="openModal"
          @generateMovie="generateImageOnlyMovie"
          @movieRestored="handleMovieRestored"
          :disabled="!isValidBeat || isArtifactGenerating"
        />
      </div>

      <!-- left: lipSync edit -->
      <div class="flex flex-col gap-1" v-if="enableLipSync && hasLipSyncKey && !isVoiceOver">
        <!-- movie edit -->
        <div class="flex items-center gap-2">
          <Checkbox
            variant="ghost"
            size="icon"
            :modelValue="beat.enableLipSync"
            @update:model-value="(value) => update('enableLipSync', value)"
            :disabled="!canEnableLipSync"
          />
          <Label class="block" :class="{ 'opacity-50': !canEnableLipSync }">{{ t("beat.lipSync.label") }} </Label>
        </div>
        <div v-if="lipSyncModelDescription" class="text-muted-foreground ml-6 text-sm">
          {{ lipSyncModelDescription }}
        </div>
        <div v-if="!canEnableLipSync" class="text-muted-foreground ml-6 text-sm">
          {{ lipSyncRequiresMediaMessage }}
        </div>
      </div>
      <!-- right: lipSync preview -->
      <div class="flex flex-col gap-4" v-if="enableLipSync && hasLipSyncKey && !isVoiceOver">
        <BeatPreviewMovie
          :beat="beat"
          :index="index"
          :isMovieGenerating="isLipSyncGenerating"
          :enableMovieGenerate="enableLipSyncGenerate"
          :enableMovie="enableLipSync"
          :movieFile="lipSyncFiles"
          :toggleTypeMode="toggleTypeMode"
          @openModal="openModal"
          @generateMovie="generateLipSyncMovie"
        />
      </div>
    </div>
    <!-- Character Images Selection (only for imagePrompt beats) -->
    <template v-if="beatType === 'imagePrompt'">
      <hr class="m-2" />
      <CharaParams :beat="beat" :images="mulmoScript.imageParams?.images" @updateImageNames="updateImageNames" />
    </template>

    <div class="border-border/40 bg-muted/10 mt-4 rounded-md border p-3" v-if="false">
      <div class="flex items-start gap-3">
        <Checkbox :modelValue="Boolean(beat.hidden)" @update:model-value="(value) => update('hidden', value)" />
        <div>
          <Label class="mb-1 block">{{ t("beat.visibility.label") }}</Label>
          <p class="text-muted-foreground text-xs leading-relaxed">
            {{ t("beat.visibility.description") }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="mulmoError && mulmoError.length > 0"
      class="border-destructive bg-destructive/10 text-destructive mt-2 w-full rounded border p-2 text-sm"
    >
      <div v-for="(error, key) in mulmoError" :key="key">
        {{ error }}
      </div>
    </div>

    <!-- Advanced Beat Settings -->
    <template v-if="beatType === 'imagePrompt' || index > 0">
      <hr class="m-2" />
      <Collapsible v-model:open="beatAdvancedSettingsOpen" class="mt-4">
        <CollapsibleTrigger as-child>
          <div class="mb-3 cursor-pointer">
            <div class="flex items-center gap-2">
              <ChevronDown :class="['h-4 w-4 transition-transform', beatAdvancedSettingsOpen && 'rotate-180']" />
              <h4 class="text-sm font-medium">{{ t("beat.advancedSettings.title") }}</h4>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent class="space-y-3">
          <!-- Image Generation Override Settings (only for imagePrompt beats) -->
          <template v-if="beatType === 'imagePrompt' && isPro">
            <BeatStyle
              :beat="beat"
              @update="update"
              :imageParams="mulmoScript.imageParams"
              :settingPresence="settingPresence"
              :isPro="isPro"
              @justSaveAndPushToHistory="justSaveAndPushToHistory"
            />
          </template>

          <!-- Transition Settings (only for beat 2 and onwards) -->
          <template v-if="index > 0">
            <div class="mb-3 flex items-center gap-2">
              <Checkbox
                variant="ghost"
                size="icon"
                :modelValue="!!beat.movieParams?.transition?.type"
                @update:model-value="handleTransitionToggle"
              />
              <Label class="cursor-pointer" :class="!beat.movieParams?.transition?.type ? 'text-muted-foreground' : ''">
                切り替え効果を設定する
              </Label>
            </div>
            <template v-if="beat.movieParams?.transition?.type">
              <div>
                <Label>{{ t("parameters.transitionParams.type") }}</Label>
                <Select :model-value="beatTransitionType" @update:model-value="handleBeatTransitionTypeChange">
                  <SelectTrigger>
                    <SelectValue :placeholder="t('parameters.transitionParams.typeNone')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="transitionType in TRANSITION_TYPES"
                      :key="transitionType.value"
                      :value="transitionType.value"
                    >
                      {{ t(`parameters.transitionParams.${transitionType.label}`) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{{ t("parameters.transitionParams.duration") }}</Label>
                <Input
                  :model-value="beatTransitionDuration"
                  @update:model-value="handleBeatTransitionDurationChange"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                />
              </div>
            </template>
          </template>
        </CollapsibleContent>
      </Collapsible>
    </template>

    <MediaModal v-model:open="modalOpen" :type="modalType" :src="modalSrc" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  type MulmoBeat,
  type MulmoScript,
  type MulmoImageAsset,
  MulmoPresentationStyleMethods,
  MulmoStudioContextMethods,
  provider2TTSAgent,
  // getModelDuration,
  provider2MovieAgent,
} from "mulmocast/browser";
import { useI18n } from "vue-i18n";
import { ChevronDown, CircleUserRound, Music, X } from "lucide-vue-next";
import { getLipSyncModelDescription, getLipSyncTargetInfo } from "./lip_sync_utils";
import {
  TRANSITION_TYPES,
  DEFAULT_TRANSITION_DURATION,
  MEDIA_FILE_EXTENSIONS,
  type AudioExtension,
} from "../../../../shared/constants";

// components
import MediaModal from "@/components/media_modal.vue";
import { Badge, Button, Label, Input, Textarea, Checkbox } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import BeatPreviewImage from "./beat_preview_image.vue";
import BeatPreviewMovie from "./beat_preview_movie.vue";
import BeatSelector from "./beat_selector.vue";
import BeatStyle from "./beat_style.vue";
import CharaParams from "./styles/chara_params.vue";
import SpeakerSelector from "./speaker_selector.vue";

// lib
import { useMulmoEventStore } from "../../../store";
import {
  getBadge,
  getBeatType,
  enableMovieType,
  enableLipSyncType,
  isMediaBeat,
  isURLSourceMediaBeat,
  isLocalSourceMediaBeat,
} from "@/lib/beat_util.js";
import { mediaUri } from "@/lib/utils";
import { notifyProgress, notifyError } from "@/lib/notification";
import type { MulmoTransition } from "@/types";

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
  imageFiles: Record<string, string | null>;
  movieFiles: Record<string, string | null>;
  isEnd: boolean;
  isPro: boolean;
  isBeginner: boolean;
  isValidBeat: boolean;
  isArtifactGenerating: boolean;
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
  "imageRestored",
  "movieRestored",
  "audioUploaded",
  "audioRemoved",
  "audioGenerated",
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

const audioSourceType = ref<"generate" | "upload">(
  props.beat.audio?.type === "audio" && props.beat.audio.source?.kind === "path" ? "upload" : "generate",
);
const isAudioUploading = ref(false);
const uploadedAudioFilename = ref<string>(
  props.beat.audio?.type === "audio" && props.beat.audio.source?.kind === "path"
    ? (props.beat.audio.source.path.split("/").pop() ?? "")
    : "",
);

const audioFileInput = ref<HTMLInputElement>();
const audioPlayerRef = ref<HTMLAudioElement>();

const beatAdvancedSettingsOpen = ref(false);

// Generate accept attribute from constants
const audioAccept = computed(() => {
  const extensions = MEDIA_FILE_EXTENSIONS.audio.map((ext) => `.${ext}`).join(",");
  return `audio/*,${extensions}`;
});

const beatTransitionType = computed(() => {
  return props.beat.movieParams?.transition?.type || "__undefined__";
});

const beatTransitionDuration = computed(() => {
  return props.beat.movieParams?.transition?.duration ?? DEFAULT_TRANSITION_DURATION;
});

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
  return !!props.beat.moviePrompt;
});
const enableLipSyncGenerate = computed(() => {
  return !!props.beat.enableLipSync;
});
const beatId = computed(() => {
  return props.beat.id;
});

const referenceBeats = computed(() => {
  return props.mulmoScript.beats
    .map((beat, index) => ({
      id: beat.id,
      index,
      label: `BEAT ${index + 1}`,
    }))
    .filter((_, index) => props.mulmoScript.beats[index]?.image?.type !== "beat");
});

const isReferencedBeatValid = computed(() => {
  if (props.beat.image?.type === "beat" && props.beat.image.id) {
    const beatIds = props.mulmoScript.beats.map((b) => b.id);
    return beatIds.includes(props.beat.image.id);
  }
  return true;
});

const referencedImageFile = computed(() => {
  if (props.beat.image?.type === "beat" && props.beat.image.id) {
    return props.imageFiles[props.beat.image.id] ?? null;
  }
  return null;
});

const referencedMovieFile = computed(() => {
  if (props.beat.image?.type === "beat" && props.beat.image.id) {
    return props.movieFiles[props.beat.image.id] ?? null;
  }
  return null;
});

const expectDuration = computed(() => {
  const movieParams = props.mulmoScript?.movieParams;
  if (!movieParams?.provider || !movieParams?.model) {
    return undefined;
  }
  const provider = movieParams.provider as keyof typeof provider2MovieAgent;
  const model = movieParams.model as string;
  const modelParams = provider2MovieAgent[provider]?.modelParams as Record<string, { durations?: number[] }>;
  return modelParams?.[model]?.durations;
});

const isVeo31Model = computed(() => {
  const movieParams = props.mulmoScript?.movieParams;
  if (!movieParams?.provider || !movieParams?.model) {
    return false;
  }
  return movieParams.provider === "google" && movieParams.model === "veo-3.1-generate-preview";
});

const durationTooltipKey = computed(() => {
  // moviePromptがある場合 → 生成動画
  if (props.beat.moviePrompt) {
    return "beat.duration.tooltipGeneratedVideo";
  }
  // image.typeが"movie"の場合 → アップロードした動画
  if (props.beat.image?.type === "movie") {
    return "beat.duration.tooltipUploadedVideo";
  }
  // それ以外 → 静止画
  return "beat.duration.tooltipStillImage";
});

const lipSyncTargetInfo = computed(() => {
  const lipSyncParams = props.mulmoScript?.lipSyncParams;
  return getLipSyncTargetInfo(lipSyncParams?.provider, lipSyncParams?.model);
});

const lipSyncModelDescription = computed(() => {
  const lipSyncParams = props.mulmoScript?.lipSyncParams;
  return getLipSyncModelDescription(lipSyncParams?.provider, lipSyncParams?.model, t);
});

const canEnableLipSync = computed(() => {
  const hasVideo = props.beat.moviePrompt || props.beat.image?.type === "movie";
  const hasImage = props.beat.imagePrompt || (props.beat.image?.type && props.beat.image.type !== "movie");

  return (lipSyncTargetInfo.value.supportsVideo && hasVideo) || (lipSyncTargetInfo.value.supportsImage && hasImage);
});

const lipSyncRequiresMediaMessage = computed(() => {
  const { supportsVideo, supportsImage } = lipSyncTargetInfo.value;
  const imagePromptLabel = t("beat.imagePrompt.label");
  const moviePromptLabel = t("beat.moviePrompt.label");

  if (supportsImage && !supportsVideo) {
    return t("beat.lipSync.requiresImage", { imagePromptLabel });
  }
  if (supportsVideo && !supportsImage) {
    return t("beat.lipSync.requiresVideo", { moviePromptLabel });
  }
  return t("beat.lipSync.requiresImageOrVideo", { imagePromptLabel, moviePromptLabel });
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
  return enableMovieType(props.beat);
});
const enableLipSync = computed(() => {
  return enableLipSyncType(props.beat);
});

const isVoiceOver = computed(() => {
  return props.beat.image?.type === "voice_over";
});

const hasMovieApiKey = computed(() => {
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
  if (!hasMovieApiKey.value) {
    apiErrorNotify(movieAgentInfo.keyName);
    return;
  }
  emit("generateImage", props.index, "movie");
};

const hasLipSyncKey = computed(() => {
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
  // Clear uploaded audio file when generating from text
  const hadUploadedAudio = props.beat.audio?.type === "audio" && props.beat.audio.source?.kind === "path";
  if (hadUploadedAudio) {
    // Set UI state first to prevent watcher from triggering save
    uploadedAudioFilename.value = "";
    // Notify parent to clear preview immediately
    emit("audioRemoved", props.index, props.beat.id);
    // Then update data (will be saved with debounce, but backend now uses mulmoGeneratedAudioFile)
    update("audio", undefined);
  }

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

    await notifyProgress(window.electronAPI.mulmoHandler("mulmoGenerateBeatAudio", projectId.value, props.index), {
      successMessage: t("notify.audio.successMessage"),
      errorMessage: t("notify.audio.errorMessage"),
      errorDescription: t("notify.error.noContext"),
    });
    emit("audioGenerated", props.index, props.beat.id);
  } catch (error) {
    notifyError(
      t("ui.common.error"),
      t("notify.error.audio.generateAudioSpeechParam", { speechParams: t("parameters.speechParams.title") }),
    );
    console.log(error);
  }
};

const handleAudioSourceChange = (type: "generate" | "upload") => {
  audioSourceType.value = type;
  // Don't clear data when switching modes - keep both options available
};

const handleAudioFileClick = () => {
  if (!isAudioUploading.value) {
    audioFileInput.value?.click();
  }
};

const handleAudioFileUpload = async (file: File) => {
  // Validate file type
  const fileExtension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = file.type.split("/")[1] ?? "";
  const fileType = mimeType || fileExtension;

  const isValidExtension = MEDIA_FILE_EXTENSIONS.audio.includes(fileType as AudioExtension);
  const isAudioMimeType = file.type.startsWith("audio/");

  if (!isValidExtension && !isAudioMimeType) {
    notifyError(t("notify.error.media.unsupportedType", { fileType }));
    return;
  }

  isAudioUploading.value = true;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const uint8Array = new Uint8Array(reader.result as ArrayBuffer);
      const path = (await window.electronAPI.mulmoHandler(
        "mulmoBeatAudioUpload",
        projectId.value,
        props.index,
        file.name,
        [...uint8Array],
      )) as string;

      uploadedAudioFilename.value = file.name;

      // Update beat.audio with the path
      update("audio", {
        type: "audio",
        source: {
          kind: "path",
          path: `./${path}`,
        },
      });

      // Notify parent to reload audio file for preview
      emit("audioUploaded", props.index, props.beat.id);
    } catch (error) {
      console.error("Failed to upload audio file:", error);
      notifyError(t("ui.common.error"), t("beat.audio.uploadFailed"));
    } finally {
      isAudioUploading.value = false;
    }
  };

  reader.onerror = (error) => {
    console.error("FileReader error:", error);
    isAudioUploading.value = false;
  };

  reader.readAsArrayBuffer(file);
};

const handleAudioFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    handleAudioFileUpload(files[0]);
  }
};

const handleAudioDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    handleAudioFileUpload(files[0]);
  }
};

const handleAudioFileRemove = (event: Event) => {
  event.stopPropagation();
  update("audio", undefined);
  uploadedAudioFilename.value = "";

  // Notify parent to clear the audio preview
  emit("audioRemoved", props.index, props.beat.id);
};

const handleTransitionToggle = async (checked: boolean) => {
  if (checked) {
    // Set default transition type to "fade" when enabled
    const movieParams = {
      ...props.beat.movieParams,
      transition: {
        type: "fade" as MulmoTransition["type"],
        duration: DEFAULT_TRANSITION_DURATION,
      },
    };
    update("movieParams", movieParams);
  } else {
    // Remove transition when disabled
    const movieParams = props.beat.movieParams ? { ...props.beat.movieParams } : {};
    delete movieParams.transition;
    update("movieParams", Object.keys(movieParams).length > 0 ? movieParams : undefined);
  }
  await nextTick();
  emit("justSaveAndPushToHistory");
};

const handleBeatTransitionTypeChange = (value: string) => {
  const type = value === "__undefined__" ? undefined : value;
  if (type === undefined) {
    // Remove transition entirely when set to "None"
    const movieParams = props.beat.movieParams ? { ...props.beat.movieParams } : {};
    delete movieParams.transition;
    update("movieParams", Object.keys(movieParams).length > 0 ? movieParams : undefined);
  } else {
    // Initialize movieParams with transition
    const movieParams = {
      ...props.beat.movieParams,
      transition: {
        type: type as MulmoTransition["type"],
        duration: props.beat.movieParams?.transition?.duration ?? DEFAULT_TRANSITION_DURATION,
      },
    };
    update("movieParams", movieParams);
  }
};

const handleBeatTransitionDurationChange = (value: string | number) => {
  let duration = typeof value === "string" ? parseFloat(value) : value;
  // Validate and clamp duration value
  if (isNaN(duration) || duration < 0) {
    duration = 0;
  } else if (duration > 2) {
    duration = 2;
  }
  const movieParams = {
    ...props.beat.movieParams,
    transition: {
      ...props.beat.movieParams?.transition,
      duration,
    },
  };
  update("movieParams", movieParams);
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

const handleImageRestored = () => {
  emit("imageRestored");
};

const openModal = (type: "image" | "video" | "audio" | "other", src: ArrayBuffer | string | null) => {
  if (!src) return;
  modalType.value = type;
  modalSrc.value = mediaUri(src);
  modalOpen.value = true;
};

const beatPreviewImageRef = ref<{ reloadBackupDialog: () => Promise<void> } | null>(null);
const beatPreviewMovieRef = ref<{ reloadBackupDialog: () => Promise<void> } | null>(null);

const reloadBackupDialog = async () => {
  if (beatPreviewImageRef.value) {
    await beatPreviewImageRef.value.reloadBackupDialog();
  }
};

const reloadMovieBackupDialog = async () => {
  if (beatPreviewMovieRef.value) {
    await beatPreviewMovieRef.value.reloadBackupDialog();
  }
};

const handleMovieRestored = () => {
  emit("movieRestored");
};

// Watch audioFile changes and force reload audio element
watch(
  () => props.audioFile,
  (newSrc, oldSrc) => {
    if (newSrc && newSrc !== oldSrc && audioPlayerRef.value) {
      audioPlayerRef.value.load();
    }
  },
);

// Watch for image generation completion and reload backup dialog
watch(
  () => mulmoEventStore.mulmoEvent,
  (event) => {
    if (
      event?.kind === "beatGenerate" &&
      event?.sessionType === "image" &&
      event?.inSession === false &&
      event?.index === props.index
    ) {
      // Image generation completed for this beat, reload backup dialog
      reloadBackupDialog();
    }
    if (
      event?.kind === "beatGenerate" &&
      event?.sessionType === "movie" &&
      event?.inSession === false &&
      event?.index === props.index
    ) {
      // Movie generation completed for this beat, reload backup dialog
      reloadMovieBackupDialog();
    }
  },
  { deep: true },
);

defineExpose({
  reloadBackupDialog,
  reloadMovieBackupDialog,
});
</script>
