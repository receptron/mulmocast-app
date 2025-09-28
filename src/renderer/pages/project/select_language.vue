<template>
  <div class="flex items-center gap-1">
    <Languages :size="14" class="text-muted-foreground" />
    <Select :model-value="currentLanguage" @update:model-value="handleLanguageChange">
      <SelectTrigger class="border-border h-6! w-30 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="lang in LANGUAGES" :key="lang.id" :value="lang.id">
          {{ t("languages." + lang.id) }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { Languages } from "lucide-vue-next";
import { LANGUAGES } from "../../../shared/constants";

import type { MulmoScript } from "mulmocast/browser";
import { useI18n } from "vue-i18n";
import { useMulmoGlobalStore } from "@/store";

const props = defineProps<{
  mulmoScript: MulmoScript;
}>();

const emit = defineEmits<{
  updateMulmoScript: [script: MulmoScript];
}>();

const globalStore = useMulmoGlobalStore();

const currentLanguage = ref(props.mulmoScript?.lang || globalStore.settings.APP_LANGUAGE);

const { t } = useI18n();

watch(
  () => props.mulmoScript?.lang,
  (newLang) => {
    if (newLang) {
      currentLanguage.value = newLang;
    }
  },
);

const handleLanguageChange = (value: string) => {
  currentLanguage.value = value;
  emit("updateMulmoScript", {
    ...props.mulmoScript,
    lang: value,
  });
};
</script>
