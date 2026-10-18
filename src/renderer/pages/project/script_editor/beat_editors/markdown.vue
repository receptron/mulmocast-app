<template>
  <Label class="mb-1 block">{{ t("beat.markdown.label") }}</Label>
  <Textarea
    :placeholder="t('beat.markdown.placeholder')"
    :model-value="Array.isArray(markdownImage?.markdown) ? markdownImage?.markdown.join('\n') : markdownImage?.markdown"
    @update:model-value="(value) => update('image.markdown', String(value).split('\n'))"
    @blur="save"
    class="font-mono"
    rows="6"
    :class="isBeginner && isEmpty ? 'border-2 border-red-600' : ''"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Label, Textarea } from "@/components/ui";
import type { MulmoBeat } from "mulmocast/browser";
import { imageOfType } from "@/lib/beat_util";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

interface Props {
  beat: MulmoBeat;
  isBeginner: boolean;
}
const props = defineProps<Props>();
const markdownImage = computed(() => imageOfType(props.beat, "markdown"));
const emit = defineEmits(["update", "save"]);

const update = (path: string, value: unknown) => {
  emit("update", path, value);
};

const isEmpty = computed(() => {
  const text =
    (Array.isArray(markdownImage.value?.markdown)
      ? markdownImage.value?.markdown.join("\n")
      : markdownImage.value?.markdown) ?? "";
  return !text?.trim();
});

const save = () => {
  emit("save");
};
</script>
