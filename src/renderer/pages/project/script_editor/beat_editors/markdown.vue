<template>
  <Label class="mb-1 block">{{ t("beat.markdown.label") }}</Label>
  <Textarea
    :placeholder="t('beat.markdown.placeholder')"
    :model-value="Array.isArray(beat.image?.markdown) ? beat.image?.markdown.join('\n') : beat.image?.markdown"
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
import { useI18n } from "vue-i18n";
const { t } = useI18n();

interface Props {
  beat: MulmoBeat;
  isBeginner: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits(["update", "save"]);

const update = (path: string, value: unknown) => {
  emit("update", path, value);
};

const isEmpty = computed(() => {
  const text =
    (Array.isArray(props.beat.image?.markdown) ? props.beat.image?.markdown.join("\n") : props.beat.image?.markdown) ??
    "";
  return !text?.trim();
});

const save = () => {
  emit("save");
};
</script>
