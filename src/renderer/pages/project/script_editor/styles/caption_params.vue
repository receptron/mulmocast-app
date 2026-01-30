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
      </div>
      <div v-if="captionSplitEnabled">
        <Label>{{ t("parameters.captionParams.delimiters") }}</Label>
        <div class="text-muted-foreground mb-2 text-xs">
          {{ t("parameters.captionParams.delimitersDescription") }}
        </div>
        <Textarea v-model="delimiters" class="font-mono" rows="3" @change="handleDelimitersInput" />
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
const delimiters = ref("");

// Default delimiters that work across languages
const defaultDelimiters = ["。", "．", ".", "！", "!", "？", "?", "；", ";", "\n"];

const captionSplitEnabled = computed(() => {
  return props.captionParams?.captionSplit === "estimate";
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

const handleDelimitersInput = () => {
  const delimiterArray = delimiters.value
    .split("\n")
    .filter((d) => d !== "")
    .map((d) => (d === "\\n" ? "\n" : d)); // Convert escaped \\n back to actual newline
  emit("update", {
    ...props.captionParams,
    textSplit: {
      type: "delimiters",
      delimiters: delimiterArray,
    },
  });
};

const handleCaptionSplitToggle = (enabled: boolean) => {
  if (enabled) {
    delimiters.value = defaultDelimiters.map((d) => (d === "\n" ? "\\n" : d)).join("\n");
    emit("update", {
      ...props.captionParams,
      captionSplit: "estimate",
      textSplit: {
        type: "delimiters",
        delimiters: defaultDelimiters,
      },
    });
  } else {
    delimiters.value = "";
    // Remove captionSplit and textSplit
    const { captionSplit: __captionSplit, textSplit: __textSplit, ...rest } = props.captionParams ?? {};
    emit("update", Object.keys(rest).length > 0 ? rest : undefined);
  }
};

watch(
  () => props.captionParams,
  (newVal) => {
    // Sync styles from JSON to UI (only if not already set)
    if (!styles.value) {
      styles.value = newVal?.styles?.join("\n") || "";
    }
    // Sync delimiters from JSON to UI (only if not already set, escape actual newlines to \\n for display)
    if (!delimiters.value && newVal?.textSplit?.type === "delimiters" && newVal.textSplit.delimiters) {
      delimiters.value = newVal.textSplit.delimiters.map((d: string) => (d === "\n" ? "\\n" : d)).join("\n");
    }
  },
  { immediate: true },
);
</script>
