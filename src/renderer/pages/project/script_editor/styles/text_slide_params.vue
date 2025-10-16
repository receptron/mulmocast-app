<template>
  <Card class="p-4">
    <h4 class="font-medium">{{ t("parameters.textSlideParams.title") }}</h4>
    <div class="space-y-3">
      <div>
        <Label>{{ t("parameters.textSlideParams.css") }}</Label>
        <div class="text-muted-foreground mb-2 text-xs">{{ t("parameters.textSlideParams.cssDescription") }}</div>
        <Textarea
          :model-value="cssStylesText"
          @update:model-value="handleCssStylesInput"
          :placeholder="`${t('ui.common.example')}\n${t('parameters.textSlideParams.cssPlaceholder')}`"
          class="font-mono"
          rows="6"
        />
      </div>
      <MulmoError :mulmoError="mulmoError" />
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Card, Label, Textarea } from "@/components/ui";
import MulmoError from "./mulmo_error.vue";
import type { MulmoPresentationStyle } from "mulmocast/browser";

const { t } = useI18n();

const props = defineProps<{
  textSlideParams?: MulmoPresentationStyle["textSlideParams"];
  mulmoError: string[];
}>();

const emit = defineEmits<{
  update: [value: string | string[]];
}>();

const cssStylesText = computed(() => {
  const styles = props.textSlideParams?.cssStyles;
  if (!styles) return "";
  if (typeof styles === "string") return styles;
  if (Array.isArray(styles)) return styles.join("\n");
  return "";
});

const handleCssStylesInput = (value: string | number) => {
  const stringValue = String(value);
  if (stringValue.includes("\n")) {
    const lines = stringValue.split("\n").filter((line) => line.trim() !== "");
    emit("update", lines);
  } else {
    emit("update", stringValue);
  }
};
</script>
