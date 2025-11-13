<template>
  <Label class="mb-1 block">{{ t("beat.mermaid.label") }}</Label>
  <div class="mb-2 flex items-end gap-2">
    <Select v-model="selectedPreset" class="flex-1">
      <SelectTrigger class="w-full">
        <SelectValue :placeholder="t('beat.mermaid.selectDiagramType')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="(preset, key) in mermaid_presets" :value="key" :key="preset.name">
          {{ t("beat.mermaid.preset." + preset.name) }}
        </SelectItem>
      </SelectContent>
    </Select>
    <Button size="sm" @click="updatePreset" :disabled="selectedPreset === null">
      {{ t("ui.actions.set") }}
    </Button>
  </div>

  <Input
    :placeholder="t('beat.mermaid.titleField')"
    :model-value="beat?.image?.title"
    @update:model-value="(value) => update('image.title', String(value))"
    @blur="save"
    class="mb-2"
  />
  <Textarea
    :placeholder="t('beat.mermaid.placeholder')"
    :model-value="beat?.image?.code?.text"
    @update:model-value="(value) => update('image.code.text', String(value))"
    @blur="save"
    class="font-mono"
    rows="8"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Label, Input, Textarea, Button } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MulmoBeat } from "mulmocast/browser";
import { useI18n } from "vue-i18n";

import { mermaid_presets } from "./mermaid_data";

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

const selectedPreset = ref<number | null>(null);

const updatePreset = () => {
  if (selectedPreset.value === null) return;
  const data = mermaid_presets[selectedPreset.value].code.trim();
  update("image.code.text", data);
};
</script>
