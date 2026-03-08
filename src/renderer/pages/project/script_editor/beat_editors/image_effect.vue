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

    <!-- Source beat select -->
    <div class="mb-2">
      <Label class="mb-1 block text-sm">{{ t("beat.html_tailwind.sourceBeat") }}</Label>
      <Select v-model="selectedBeatId">
        <SelectTrigger class="w-full">
          <SelectValue :placeholder="t('beat.html_tailwind.sourceBeatPlaceholder')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="refBeat in sourceBeats" :key="refBeat.id" :value="refBeat.id">
            {{ refBeat.label }}
          </SelectItem>
        </SelectContent>
      </Select>
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

    <!-- Set button + custom badge -->
    <div class="flex items-center justify-between">
      <div>
        <Badge v-if="isCustomEdited" variant="secondary" class="text-xs">
          {{ t("beat.html_tailwind.customEdited") }}
        </Badge>
      </div>
      <Button size="sm" @click="applyEffect" :disabled="!selectedEffect || !selectedBeatId">
        {{ t("ui.actions.set") }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Label, Input, Button, Badge } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MulmoBeat, MulmoScript } from "mulmocast/browser";
import { useI18n } from "vue-i18n";
import {
  type EffectType,
  EFFECT_TYPES,
  effectDefaults,
  generateEffectTemplate,
  isTemplateMatch,
} from "./image_effect_data";

const { t } = useI18n();

interface Props {
  beat: MulmoBeat;
  mulmoScript: MulmoScript;
  imageFiles: Record<string, string | null>;
  currentIndex: number;
}

const props = defineProps<Props>();
const emit = defineEmits(["update", "save"]);

const selectedEffect = ref<EffectType | null>(null);
const selectedBeatId = ref<string | null>(null);
const durationSec = ref<number>(effectDefaults.duration);
const zoomPercent = ref<number>(effectDefaults.zoom);

// Last applied values for custom detection
const lastAppliedEffect = ref<EffectType | null>(null);
const lastAppliedBeatId = ref<string | null>(null);
const lastAppliedZoom = ref<number>(effectDefaults.zoom);

const sourceBeats = computed(() => {
  return props.mulmoScript.beats
    .map((beat, index) => ({
      id: beat.id,
      index,
      label: `BEAT ${index + 1}`,
    }))
    .filter((_, index) => {
      const beat = props.mulmoScript.beats[index];
      // Exclude current beat and beat-reference types
      return index !== props.currentIndex && beat?.image?.type !== "beat" && beat?.image?.type !== "voice_over";
    });
});

const imageSrcForBeat = (beatId: string): string => {
  const imageData = props.imageFiles[beatId];
  if (imageData) {
    return imageData;
  }
  return "";
};

const isCustomEdited = computed(() => {
  if (!lastAppliedEffect.value || !lastAppliedBeatId.value) return false;
  const imageSrc = imageSrcForBeat(lastAppliedBeatId.value);
  return !isTemplateMatch(
    props.beat.image?.html as string | string[] | undefined,
    props.beat.image?.script as string | string[] | undefined,
    lastAppliedEffect.value,
    imageSrc,
    lastAppliedZoom.value,
  );
});

const update = (path: string, value: unknown) => {
  emit("update", path, value);
};

const applyEffect = () => {
  if (!selectedEffect.value || !selectedBeatId.value) return;

  const imageSrc = imageSrcForBeat(selectedBeatId.value);
  const template = generateEffectTemplate(selectedEffect.value, imageSrc, zoomPercent.value);

  update("image.html", template.html);
  update("image.script", template.script);
  update("image.animation", true);

  // Set duration on the beat
  update("duration", durationSec.value);

  // Track last applied for custom detection
  lastAppliedEffect.value = selectedEffect.value;
  lastAppliedBeatId.value = selectedBeatId.value;
  lastAppliedZoom.value = zoomPercent.value;

  emit("save");
};

// Reset custom detection when effect selection changes
watch(selectedEffect, () => {
  lastAppliedEffect.value = null;
});
</script>
