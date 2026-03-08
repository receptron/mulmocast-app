<template>
  <div class="mb-3 rounded-md border p-3">
    <Label class="mb-2 block font-medium">{{ t("beat.html_tailwind.effectLabel") }}</Label>

    <!-- Effect preset select -->
    <div class="mb-2">
      <Select v-model="selectedEffect">
        <SelectTrigger class="w-full">
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
        <Button variant="outline" size="sm" @click="openMaterialsDialog" :disabled="materialKeys.length === 0">
          {{ selectedMaterialKey || t("beat.html_tailwind.sourceImagePlaceholder") }}
        </Button>
        <img v-if="selectedPreviewUrl" :src="selectedPreviewUrl" class="h-8 w-8 rounded object-cover" />
      </div>
      <p v-if="materialKeys.length === 0" class="text-muted-foreground mt-1 text-xs">
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
        <Input v-model="durationSec" type="number" min="1" max="30" />
      </div>
      <div class="flex-1">
        <Label class="mb-1 block text-sm">{{ t("beat.html_tailwind.zoom") }}</Label>
        <Input v-model="zoomPercent" type="number" min="100" max="200" />
      </div>
    </div>
    <div v-if="isPan" class="mb-2 flex gap-3">
      <div class="flex-1">
        <Label class="mb-1 block text-sm">{{ t("beat.html_tailwind.panDistance") }}</Label>
        <Input v-model="panDistancePercent" type="number" min="1" max="50" />
      </div>
    </div>

    <!-- Set button + custom badge -->
    <div class="flex items-center justify-between">
      <div>
        <Badge v-if="isCustomEdited" variant="secondary" class="text-xs">
          {{ t("beat.html_tailwind.customEdited") }}
        </Badge>
      </div>
      <Button size="sm" @click="applyEffect" :disabled="!selectedEffect || !selectedMaterialKey">
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
const panDistancePercent = ref<number>(effectDefaults.panDistance);

const isPan = computed(() => isPanEffect(selectedEffect.value));

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

// Last applied values for custom detection
const lastAppliedEffect = ref<EffectType | null>(null);
const lastAppliedMaterialKey = ref<string | null>(null);
const lastAppliedZoom = ref<number>(effectDefaults.zoom);
const lastAppliedPanDistance = ref<number>(effectDefaults.panDistance);

const materialKeys = computed(() => {
  const images = props.mulmoScript.imageParams?.images;
  if (!images) return [];
  return Object.keys(images).sort();
});

const isCustomEdited = computed(() => {
  if (!lastAppliedEffect.value || !lastAppliedMaterialKey.value) return false;
  const imageSrc = `image:${lastAppliedMaterialKey.value}`;
  return !isTemplateMatch(
    props.beat.image?.html as string | string[] | undefined,
    props.beat.image?.script as string | string[] | undefined,
    lastAppliedEffect.value,
    imageSrc,
    lastAppliedZoom.value,
    lastAppliedPanDistance.value,
  );
});

const applyEffect = () => {
  if (!selectedEffect.value || !selectedMaterialKey.value) return;

  const imageSrc = `image:${selectedMaterialKey.value}`;
  const template = generateEffectTemplate(selectedEffect.value, imageSrc, zoomPercent.value, panDistancePercent.value);

  emit("applyImageEffect", {
    image: {
      type: "html_tailwind" as const,
      html: template.html,
      script: template.script,
      animation: true,
    },
    duration: durationSec.value,
  });

  // Track last applied for custom detection
  lastAppliedEffect.value = selectedEffect.value;
  lastAppliedMaterialKey.value = selectedMaterialKey.value;
  lastAppliedZoom.value = zoomPercent.value;
  lastAppliedPanDistance.value = panDistancePercent.value;
};

// Set presets and reset custom detection when effect selection changes
watch(selectedEffect, () => {
  lastAppliedEffect.value = null;
  durationSec.value = effectDefaults.duration;
  zoomPercent.value = effectDefaults.zoom;
  panDistancePercent.value = effectDefaults.panDistance;
});
</script>
