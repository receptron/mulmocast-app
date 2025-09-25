<template>
  <Card class="p-4">
    <h4 class="font-medium">{{ t("parameters.captionParams.title") }}</h4>
    <div class="space-y-3">
      <div>
        <Label>{{ t("parameters.captionParams.language") }}</Label>
        <div class="text-muted-foreground mb-2 text-xs">{{ t("parameters.captionParams.languageDescription") }}</div>
        <Select :model-value="props.captionParams?.lang || ''" @update:model-value="handleLangInput">
          <SelectTrigger>
            <SelectValue :placeholder="t('parameters.captionParams.noLanguage')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__undefined__">{{ t("parameters.captionParams.noLanguage") }}</SelectItem>
            <SelectItem v-for="language in LANGUAGES" :key="language.id" :value="language.id">
              {{ t("languages." + language.id) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{{ t("parameters.captionParams.styles") }}</Label>
        <div class="text-muted-foreground mb-2 text-xs">{{ t("parameters.captionParams.stylesDescription") }}</div>
        <Textarea
          v-model="styles"
          :placeholder="`${t('ui.common.example')}\ncolor: #FF6B6B;\nfont-family: 'Arial Black', sans-serif;\ntext-shadow: 2px 2px 4px rgba(0,0,0,0.5);`"
          :class="['font-mono', { 'bg-muted text-muted-foreground cursor-not-allowed': !props.captionParams?.lang }]"
          rows="6"
          :disabled="!props.captionParams?.lang"
          @change="handleStylesInput"
        />
      </div>
      <MulmoError :mulmoError="mulmoError" />
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { Card, Label, Textarea } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MulmoPresentationStyle } from "mulmocast/browser";
import { LANGUAGES } from "../../../../../shared/constants";
import MulmoError from "./mulmo_error.vue";

const { t } = useI18n();

const props = defineProps<{
  captionParams?: MulmoPresentationStyle["captionParams"];
  mulmoError: string[];
}>();

const emit = defineEmits<{
  update: [value: Partial<MulmoPresentationStyle["captionParams"]>];
}>();

const styles = ref("");

const handleLangInput = (value: string) => {
  if (value && value !== "__undefined__") {
    emit("update", {
      ...props.captionParams,
      lang: value,
    });
  } else {
    emit("update", undefined);
  }
};

const handleStylesInput = () => {
  emit("update", {
    ...props.captionParams,
    styles: styles.value.split("\n").filter((line) => line.trim() !== ""),
  });
};

watch(
  () => props.captionParams,
  (newVal) => {
    // Only set styles if first time
    if (styles.value) return;
    styles.value = newVal?.styles?.join("\n") || "";
  },
  { immediate: true },
);
</script>
