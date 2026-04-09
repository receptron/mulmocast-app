<template>
  <div class="flex items-center gap-1">
    <Languages :size="14" class="text-muted-foreground" />
    <Select :model-value="modelValue" @update:model-value="handleLanguageChange">
      <SelectTrigger class="border-border h-6! w-30 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="lang in languages" :key="lang" :value="lang">
          {{ t("languages." + lang) }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<script setup lang="ts">
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { Languages } from "@lucide/vue";

import { useI18n } from "vue-i18n";

interface Props {
  modelValue: string;
  languages: string[];
}

defineProps<Props>();

const emit = defineEmits(["update:modelValue"]);

const { t } = useI18n();

const handleLanguageChange = (value: string) => {
  emit("update:modelValue", value);
};
</script>
