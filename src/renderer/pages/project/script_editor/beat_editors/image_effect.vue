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
      <Select v-model="selectedMaterialKey">
        <SelectTrigger class="w-full">
          <SelectValue :placeholder="t('beat.html_tailwind.sourceImagePlaceholder')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="key in materialKeys" :key="key" :value="key">
            {{ key }}
          </SelectItem>
        </SelectContent>
      </Select>
      <p v-if="materialKeys.length === 0" class="text-muted-foreground mt-1 text-xs">
        {{ t("beat.html_tailwind.noMaterials") }}
      </p>
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
      <Button size="sm" @click="applyEffect" :disabled="!selectedEffect || !selectedMaterialKey">
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
}

const props = defineProps<Props>();
const emit = defineEmits(["update", "save"]);

const selectedEffect = ref<EffectType | null>(null);
const selectedMaterialKey = ref<string | null>(null);
const durationSec = ref<number>(effectDefaults.duration);
const zoomPercent = ref<number>(effectDefaults.zoom);

// Last applied values for custom detection
const lastAppliedEffect = ref<EffectType | null>(null);
const lastAppliedMaterialKey = ref<string | null>(null);
const lastAppliedZoom = ref<number>(effectDefaults.zoom);

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
  );
});

const update = (path: string, value: unknown) => {
  emit("update", path, value);
};

const applyEffect = () => {
  if (!selectedEffect.value || !selectedMaterialKey.value) return;

  const imageSrc = `image:${selectedMaterialKey.value}`;
  const template = generateEffectTemplate(selectedEffect.value, imageSrc, zoomPercent.value);

  update("image.html", template.html);
  update("image.script", template.script);
  update("image.animation", true);
  update("duration", durationSec.value);

  // Track last applied for custom detection
  lastAppliedEffect.value = selectedEffect.value;
  lastAppliedMaterialKey.value = selectedMaterialKey.value;
  lastAppliedZoom.value = zoomPercent.value;

  emit("save");
};

// Reset custom detection when effect selection changes
watch(selectedEffect, () => {
  lastAppliedEffect.value = null;
});
</script>
