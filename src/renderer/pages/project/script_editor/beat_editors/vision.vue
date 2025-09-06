<template>
  <Label class="mb-1 block">{{ t("beat.vision.label") }}</Label>
  <VisionSelect
    class="mb-2"
    :model-value="beat.image?.style"
    @update:model-value="(value) => update('image.style', String(value))"
  />
  <Textarea
    :placeholder="t('beat.vision.placeholder')"
    :model-value="JSON.stringify(beat.image?.data, null, 2)"
    @update:model-value="
      (value) => {
        try {
          update('image.data', JSON.parse(String(value)));
        } catch (_) {}
      }
    "
    @blur="save"
    class="font-mono"
    rows="8"
  />
</template>

<script setup lang="ts">
import { Label, Textarea } from "@/components/ui";
import type { MulmoBeat } from "mulmocast/browser";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

import VisionSelect from "./vision_select.vue";

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
