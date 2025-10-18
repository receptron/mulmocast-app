<template>
  <Label class="mb-1 block">{{ t("beat.mermaid.label") }}</Label>
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
    rows="6"
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
