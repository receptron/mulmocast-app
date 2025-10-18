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
    :model-value="JSON.stringify(beat.image?.chartData, null, 2)"
    @update:model-value="
      (value) => {
        try {
          update('image.chartData', JSON.parse(String(value)));
        } catch (_) {}
      }
    "
    @blur="save"
    class="font-mono"
    rows="8"
  />
</template>

<script setup lang="ts">
import { Label, Input, Textarea } from "@/components/ui";
import type { MulmoBeat } from "mulmocast/browser";
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
</script>
