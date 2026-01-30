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
      <div class="flex items-center space-x-2">
        <Switch
          :model-value="captionSplitEnabled"
          :disabled="!props.captionParams?.lang"
          @update:model-value="handleCaptionSplitToggle"
        />
        <Label>{{ t("parameters.captionParams.captionSplit") }}</Label>
      </div>
      <div class="text-muted-foreground text-xs">
        {{ t("parameters.captionParams.captionSplitDescription") }}
        <div v-if="delimitersCategories.fullWidth.length" class="mt-1 font-mono">
          {{ t("parameters.captionParams.fullWidth") }}: {{ delimitersCategories.fullWidth.join(" ") }}
        </div>
        <div v-if="delimitersCategories.halfWidth.length" class="font-mono">
          {{ t("parameters.captionParams.halfWidth") }}: {{ delimitersCategories.halfWidth.join(" ") }}
        </div>
        <div v-if="delimitersCategories.other.length" class="font-mono">
          {{ delimitersCategories.other.join(" ") }}
        </div>
      </div>
      <MulmoError :mulmoError="mulmoError" />
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";

import { Card, Label, Textarea } from "@/components/ui";
import { Switch } from "@/components/ui/switch";
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

// All delimiters that work across languages
const universalDelimiters = ["。", "．", ".", "！", "!", "？", "?", "；", ";", "\n"];

const captionSplitEnabled = computed(() => {
  return props.captionParams?.captionSplit === "estimate";
});

// Check if character is half-width (ASCII range)
const isHalfWidth = (char: string) => {
  const code = char.charCodeAt(0);
  return code >= 0x0020 && code <= 0x007e;
};

const delimitersCategories = computed(() => {
  const delimiters =
    props.captionParams?.textSplit?.type === "delimiters"
      ? props.captionParams.textSplit.delimiters
      : universalDelimiters;

  const fullWidth: string[] = [];
  const halfWidth: string[] = [];
  const other: string[] = [];

  for (const delimiter of delimiters ?? []) {
    if (delimiter === "\n") {
      other.push(t("parameters.captionParams.newline"));
    } else if (isHalfWidth(delimiter)) {
      halfWidth.push(delimiter);
    } else {
      fullWidth.push(delimiter);
    }
  }

  return { fullWidth, halfWidth, other };
});

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

const handleCaptionSplitToggle = (enabled: boolean) => {
  if (enabled) {
    emit("update", {
      ...props.captionParams,
      captionSplit: "estimate",
      textSplit: {
        type: "delimiters",
        delimiters: universalDelimiters,
      },
    });
  } else {
    // Remove captionSplit and textSplit
    const { captionSplit: __captionSplit, textSplit: __textSplit, ...rest } = props.captionParams ?? {};
    emit("update", Object.keys(rest).length > 0 ? rest : undefined);
  }
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
