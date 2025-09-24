<template>
  <Card class="p-4">
    <h4 class="font-medium">{{ t("parameters.canvasSizeParams.title") }}</h4>
    <div class="space-y-3">
      <div>
        <Label>{{ t("parameters.canvasSizeParams.sizePreset") }}</Label>
        <Select :model-value="selectedPreset" @update:model-value="handlePresetChange">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="(size, key) in PRESET_CANVAS_SIZE" :key="key" :value="key">
              {{ size.width }}{{ t("ui.common.by") }}{{ size.height }}
            </SelectItem>
            <SelectItem value="custom">{{ t("parameters.canvasSizeParams.custom") }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div v-if="showCustom" class="grid grid-cols-2 gap-4">
        <div>
          <Label>{{ t("parameters.canvasSizeParams.width") }}</Label>
          <Input
            :model-value="canvasSize?.width || 1280"
            @update:model-value="(value) => handleCustomChange(value, 'width')"
            type="number"
          />
        </div>
        <div>
          <Label>{{ t("parameters.canvasSizeParams.height") }}</Label>
          <Input
            :model-value="canvasSize?.height || 720"
            @update:model-value="(value) => handleCustomChange(value, 'height')"
            type="number"
          />
        </div>
      </div>
      <MulmoError :mulmoError="mulmoError" />
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Card, Label, Input } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MulmoError from "./mulmo_error.vue";
import type { MulmoPresentationStyle } from "mulmocast/browser";
import { PRESET_CANVAS_SIZE_DEFAULT_VALUE, PRESET_CANVAS_SIZE } from "@/../shared/constants";

const { t } = useI18n();

const props = defineProps<{
  canvasSize?: MulmoPresentationStyle["canvasSize"];
  mulmoError: string[];
}>();

const showCustom = ref(false);
const selectedPreset = ref<keyof typeof PRESET_CANVAS_SIZE | "custom">(PRESET_CANVAS_SIZE_DEFAULT_VALUE);

const emit = defineEmits<{
  update: [value: { width: number; height: number }];
}>();

const handlePresetChange = (value: keyof typeof PRESET_CANVAS_SIZE | "custom") => {
  selectedPreset.value = value;
  if (value !== "custom" && value in PRESET_CANVAS_SIZE) {
    showCustom.value = false;
    const preset = PRESET_CANVAS_SIZE[value];
    emit("update", { width: preset.width, height: preset.height });
  } else {
    showCustom.value = true;
  }
};

const handleCustomChange = (value: string | number, key: "width" | "height") => {
  const currentSize = props.canvasSize;
  emit("update", { ...currentSize, [key]: Number(value) });
};

watch(
  () => props.canvasSize,
  (newSize) => {
    if (!newSize) return;
    if (
      Object.values(PRESET_CANVAS_SIZE).some(
        (preset) => preset.width === newSize.width && preset.height === newSize.height,
      )
    ) {
      showCustom.value = false;
      selectedPreset.value = `${newSize.width}x${newSize.height}` as keyof typeof PRESET_CANVAS_SIZE;
    } else {
      showCustom.value = true;
      selectedPreset.value = "custom";
    }
  },
  { immediate: true },
);
</script>
