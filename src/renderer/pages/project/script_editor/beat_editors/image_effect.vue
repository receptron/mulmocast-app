<template>
  <div class="mb-3 rounded-md border p-3" data-testid="image-effect-panel">
    <Label class="mb-2 block font-medium">{{ t("beat.html_tailwind.effectLabel") }}</Label>

    <!-- Effect preset select -->
    <div class="mb-2">
      <Select v-model="selectedEffect">
        <SelectTrigger class="w-full" data-testid="image-effect-effect-select">
          <SelectValue :placeholder="t('beat.html_tailwind.effectPlaceholder')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="effect in EFFECT_TYPES" :key="effect" :value="effect">
            {{ t(`beat.html_tailwind.effect.${effect}`) }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Source image from materials -->
    <div class="mb-2">
      <Label class="mb-1 block text-sm">{{ t("beat.html_tailwind.sourceImage") }}</Label>
      <div class="flex items-center gap-2">
        <Button
          data-testid="image-effect-material-button"
          variant="outline"
          size="sm"
          @click="openMaterialsDialog"
          :disabled="!hasMaterials"
        >
          {{ selectedMaterialLabel }}
        </Button>
        <img
          v-if="selectedPreviewUrl"
          data-testid="image-effect-selected-preview"
          :src="selectedPreviewUrl"
          class="h-8 w-8 rounded object-cover"
        />
      </div>
      <p v-if="!hasMaterials" class="text-muted-foreground mt-1 text-xs">
        {{ t("beat.html_tailwind.noMaterials") }}
      </p>
      <MaterialsImageDialog
        ref="materialsDialogRef"
        :projectId="projectId"
        :materialKeys="materialKeys"
        @select="handleMaterialSelect"
      />
    </div>

    <!-- Parameters -->
    <div class="mb-2 flex gap-3">
      <div class="flex-1">
        <Label class="mb-1 block text-sm">{{ t("beat.html_tailwind.duration") }}</Label>
        <p class="text-muted-foreground mt-1 text-xs">
          {{ t("beat.html_tailwind.durationMin") }}
        </p>
        <p class="text-muted-foreground text-xs">
          {{ t("beat.html_tailwind.durationMax") }}
        </p>
        <Input v-model="durationSec" data-testid="image-effect-duration-input" type="number" min="1" />
      </div>
      <div class="flex-1">
        <Label class="mb-1 block text-sm">{{ t("beat.html_tailwind.zoom") }}</Label>
        <p class="text-muted-foreground mt-1 text-xs">
          {{ t("beat.html_tailwind.zoomMin") }}
        </p>
        <p class="text-muted-foreground text-xs">
          {{ t("beat.html_tailwind.zoomMax") }}
        </p>
        <Input v-model="zoomPercent" data-testid="image-effect-zoom-input" type="number" min="100" max="200" />
      </div>
    </div>
    <div v-if="isPan" class="mb-2 flex gap-3">
      <div class="flex-1">
        <Label class="mb-1 block text-sm">{{ t("beat.html_tailwind.panFrom") }}</Label>
        <p class="text-muted-foreground mt-1 text-xs">
          {{ t("beat.html_tailwind.panRangeMin") }}
        </p>
        <p class="text-muted-foreground text-xs">
          {{ t("beat.html_tailwind.panRangeMax") }}
        </p>
        <Input v-model="panFromPercent" data-testid="image-effect-pan-from-input" type="number" min="0" max="100" />
      </div>
      <div class="flex-1">
        <Label class="mb-1 block text-sm">{{ t("beat.html_tailwind.panTo") }}</Label>
        <p class="text-muted-foreground mt-1 text-xs">
          {{ t("beat.html_tailwind.panRangeMin") }}
        </p>
        <p class="text-muted-foreground text-xs">
          {{ t("beat.html_tailwind.panRangeMax") }}
        </p>
        <Input v-model="panToPercent" data-testid="image-effect-pan-to-input" type="number" min="0" max="100" />
      </div>
    </div>
    <p v-if="isPan" class="text-muted-foreground mb-2 text-xs">
      {{ panRangeNote }}
    </p>

    <!-- Set button + custom badge -->
    <div class="flex items-center justify-between">
      <div>
        <Badge v-if="isCustomEdited" variant="secondary" class="text-xs">
          {{ t("beat.html_tailwind.customEdited") }}
        </Badge>
      </div>
      <Button data-testid="image-effect-set-button" size="sm" @click="applyEffect" :disabled="!canApplyEffect">
        {{ t("ui.actions.set") }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { Label, Input, Button, Badge } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bufferToUrl } from "@/lib/utils";
import type { MulmoBeat, MulmoScript } from "mulmocast/browser";
import { useI18n } from "vue-i18n";
import {
  type EffectType,
  EFFECT_TYPES,
  effectDefaults,
  getDefaultPanRange,
  isPanEffect,
  generateEffectTemplate,
  isTemplateMatch,
} from "./image_effect_data";
import MaterialsImageDialog from "./materials_image_dialog.vue";
import type { MaterialsImageDialogExposed } from "./materials_image_dialog.vue";

const { t } = useI18n();

interface Props {
  beat: MulmoBeat;
  mulmoScript: MulmoScript;
  projectId: string;
}

const props = defineProps<Props>();
const emit = defineEmits(["applyImageEffect", "save"]);

const selectedEffect = ref<EffectType | null>(null);
const selectedMaterialKey = ref<string | null>(null);
const durationSec = ref<number>(effectDefaults.duration);
const zoomPercent = ref<number>(effectDefaults.zoom);
const panFromPercent = ref<number>(effectDefaults.panFrom);
const panToPercent = ref<number>(effectDefaults.panTo);

const isPan = computed(() => isPanEffect(selectedEffect.value));
const panRangeNote = computed(() => {
  if (selectedEffect.value === "moveToLeft" || selectedEffect.value === "moveToRight") {
    return t("beat.html_tailwind.panRangeNoteX");
  }
  return t("beat.html_tailwind.panRangeNoteY");
});

const selectedPreviewUrl = ref<string | null>(null);
const materialsDialogRef = ref<MaterialsImageDialogExposed | null>(null);
const openMaterialsDialog = () => {
  materialsDialogRef.value?.open();
};
const handleMaterialSelect = async (key: string) => {
  selectedMaterialKey.value = key;
  if (selectedPreviewUrl.value) {
    URL.revokeObjectURL(selectedPreviewUrl.value);
    selectedPreviewUrl.value = null;
  }
  try {
    const buffer = (await window.electronAPI.mulmoHandler(
      "mulmoReferenceImagesFile",
      props.projectId,
      key,
    )) as Uint8Array<ArrayBuffer> | null;
    if (buffer) {
      selectedPreviewUrl.value = bufferToUrl(buffer);
    }
  } catch {
    // preview is optional
  }
};
onBeforeUnmount(() => {
  if (selectedPreviewUrl.value) {
    URL.revokeObjectURL(selectedPreviewUrl.value);
  }
});

interface LastAppliedPayload {
  effectType: EffectType;
  materialKey: string;
  zoom: number;
  panFrom: number;
  panTo: number;
  duration: number;
  image: {
    type: "html_tailwind";
    animation: true;
  };
}

// Last applied values for custom detection
const lastAppliedPayload = ref<LastAppliedPayload | null>(null);

const materialKeys = computed(() => {
  const images = props.mulmoScript.imageParams?.images;
  if (!images) return [];
  return Object.keys(images).sort();
});

const hasMaterials = computed(() => materialKeys.value.length > 0);
const hasSelectedEffect = computed(() => selectedEffect.value !== null);
const hasSelectedMaterialKey = computed(() => selectedMaterialKey.value !== null);
const canApplyEffect = computed(() => hasSelectedEffect.value && hasSelectedMaterialKey.value);
const selectedMaterialLabel = computed(
  () => selectedMaterialKey.value ?? t("beat.html_tailwind.sourceImagePlaceholder"),
);

const getApplySelection = (): { effectType: EffectType; materialKey: string } | null => {
  if (!selectedEffect.value || !selectedMaterialKey.value) return null;
  return { effectType: selectedEffect.value, materialKey: selectedMaterialKey.value };
};

const isCustomEdited = computed(() => {
  const payload = lastAppliedPayload.value;
  if (!payload) return false;

  const imageSrc = `image:${payload.materialKey}`;
  const templateMatches = isTemplateMatch(
    props.beat.image?.html as string | string[] | undefined,
    props.beat.image?.script as string | string[] | undefined,
    payload.effectType,
    imageSrc,
    payload.zoom,
    payload.panFrom,
    payload.panTo,
  );

  const typeMatches = props.beat.image?.type === payload.image.type;
  const animationMatches = props.beat.image?.animation === payload.image.animation;
  const durationMatches = props.beat.duration === payload.duration;
  return !(templateMatches && typeMatches && animationMatches && durationMatches);
});

const normalizeNumber = (value: unknown, fallback: number, min: number, max: number): number => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
};

const normalizeDuration = (value: unknown): number => {
  const num = Number(value);
  if (!Number.isFinite(num)) return effectDefaults.duration;
  return Math.max(1, num);
};

const applyEffect = () => {
  const selection = getApplySelection();
  if (!selection) return;

  const duration = normalizeDuration(durationSec.value);
  const zoom = normalizeNumber(zoomPercent.value, effectDefaults.zoom, 100, 200);
  const panFrom = normalizeNumber(panFromPercent.value, effectDefaults.panFrom, 0, 100);
  const panTo = normalizeNumber(panToPercent.value, effectDefaults.panTo, 0, 100);

  durationSec.value = duration;
  zoomPercent.value = zoom;
  panFromPercent.value = panFrom;
  panToPercent.value = panTo;

  const imageSrc = `image:${selection.materialKey}`;
  const template = generateEffectTemplate(selection.effectType, imageSrc, zoom, panFrom, panTo);

  const appliedPayload: LastAppliedPayload = {
    effectType: selection.effectType,
    materialKey: selection.materialKey,
    zoom,
    panFrom,
    panTo,
    duration,
    image: {
      type: "html_tailwind",
      animation: true,
    },
  };

  emit("applyImageEffect", {
    image: {
      type: appliedPayload.image.type,
      html: template.html,
      script: template.script,
      animation: appliedPayload.image.animation,
    },
    duration: appliedPayload.duration,
  });

  // Track last applied for custom detection
  lastAppliedPayload.value = appliedPayload;
};

// Set presets and reset custom detection when effect selection changes
watch(selectedEffect, () => {
  lastAppliedPayload.value = null;
  durationSec.value = effectDefaults.duration;
  zoomPercent.value = effectDefaults.zoom;
  if (selectedEffect.value) {
    const panRange = getDefaultPanRange(selectedEffect.value);
    panFromPercent.value = panRange.from;
    panToPercent.value = panRange.to;
  } else {
    panFromPercent.value = effectDefaults.panFrom;
    panToPercent.value = effectDefaults.panTo;
  }
});
</script>
