<template>
<div class="template-dropdown-container flex items-center gap-4">
  <Select v-model="internalValue">
    <SelectTrigger class="w-auto">
      <SelectValue :placeholder="t('presentationStyle.styleTemplate.placeholder')" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem :value="-1">
        {{ t("project.chat.templates.none") }}
      </SelectItem>
      <SelectItem v-for="(template, k) in isPro ? promptTemplates : simpleTemplate" :key="k" :value="k">
        {{ t("project.chat.templates." + template.filename) }}
      </SelectItem>
    </SelectContent>
  </Select>
</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { promptTemplates } from "mulmocast/data";

const { t } = useI18n();

const props = defineProps<{
  isPro: boolean;
  modelValue: number | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: number | null];
}>();

const internalValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const simpleTemplate = promptTemplates.filter((temp) => {
  return ["ani", "ghibli_comic", "image_prompt"].includes(temp.filename);
});

const templates = computed(() => {
  return props.isPro ? promptTemplates : simpleTemplate;
});

const selectedTemplateIndex = computed(() => props.modelValue);

const currentTemplate = computed(() => {
  if (selectedTemplateIndex.value === null || selectedTemplateIndex.value === -1) return null;
  return templates.value[selectedTemplateIndex.value];
});

defineExpose({
  selectedTemplateIndex,
  currentTemplate,
});

</script>
