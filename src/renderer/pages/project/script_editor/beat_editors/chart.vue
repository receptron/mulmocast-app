<template>
  <Label class="mb-1 block">{{ t("beat.chart.label") }}</Label>
  <Input
    :placeholder="t('beat.chart.titleField')"
    :model-value="beat?.chart?.title"
    @update:model-value="(value) => update('image.title', String(value))"
    @blur="save"
    class="mb-2"
  />
  <Textarea
    :placeholder="t('beat.chart.placeholder')"
    :model-value="
      isObject(beat.image?.chartData) ? JSON.stringify(beat.image?.chartData, null, 2) : beat.image?.chartData
    "
    @update:model-value="
      (value) => {
        try {
          const data = JSON.parse(String(value));
          update('image.chartData', isObject(data) ? data : value);
        } catch (_) {
          update('image.chartData', value);
        }
      }
    "
    @blur="save"
    class="font-mono"
    rows="8"
  />

  <div class="mt-2">
    <Select v-model="selectedPreset">
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="(preset, key) in presets" :value="key" :key="preset.name">
          {{ t("beat.chart.preset." + preset.name) }}
        </SelectItem>
      </SelectContent>
    </Select>
    <Button variant="outline" size="sm" @click="updatePreset">
      {{ t("ui.actions.set") }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Label, Input, Textarea, Button } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { MulmoBeat } from "mulmocast/browser";
import { isObject } from "graphai";

import {
  chart_bar,
  chart_line,
  chart_pie,
  chart_radar,
  chart_scatter,
  chart_stacked_bar,
  chart_doughnut,
  chart_mixed,
  chart_time_series,
} from "./chart_data";

import { useI18n } from "vue-i18n";
const { t } = useI18n();

interface Props {
  beat: MulmoBeat;
}
defineProps<Props>();
const emit = defineEmits(["update", "save"]);

const update = (path: string, value: unknown) => {
  emit("update", path, value);
};

const save = () => {
  emit("save");
};

const selectedPreset = ref(0);

const presets = [
  { name: "bar", data: chart_bar },
  { name: "line", data: chart_line },
  { name: "pie", data: chart_pie },
  { name: "radar", data: chart_radar },
  { name: "scatter", data: chart_scatter },
  { name: "stacked_bar", data: chart_stacked_bar },
  { name: "doughnut", data: chart_doughnut },
  { name: "mixed", data: chart_mixed },
  { name: "time_series", data: chart_time_series },
];

const updatePreset = () => {
  const data = presets[selectedPreset.value].data;
  update("image.chartData", data);
};
</script>
