<template>
  <div class="template-dropdown-container flex items-center gap-4">
    <Select :model-value="modelValue" @update:modelValue="updateValue">
      <SelectTrigger class="w-auto">
        <SelectValue :placeholder="t('beat.vision.stylePlaceholder')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="name in names" :key="name" :value="name">
          {{ name }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<script setup lang="ts">
import { toolsToTemplateNames, tools } from "mulmocast-vision/lib/browser";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const updateValue = (val: string) => {
  emit("update:modelValue", val);
};

const names = toolsToTemplateNames(tools);
</script>
