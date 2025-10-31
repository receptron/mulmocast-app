<template>
  <Card class="p-4">
    <h4 class="font-medium">{{ t("presentationStyle.styleTemplate.title") }}</h4>
    <div class="space-y-3">
      <div>
        <Label class="mb-2 block">
          {{ t("presentationStyle.styleTemplate.description") }}
        </Label>
        <!-- Template selection section -->
        <div class="template-section flex items-center gap-2">
          <StyleTemplateSelect ref="styleTemplateRef" v-model="selectedTemplateIndex" :is-pro="isPro" />
          <Button size="sm" @click="applyStyle">
            {{ t("project.chat.applyStyle") }}
          </Button>
          <img
            :src="templateImageDataSet[currentTemplate?.filename]"
            class="w-20"
            v-if="currentTemplate && templateImageDataSet[currentTemplate.filename]"
          />
        </div>
        <!-- Note after template selection -->
        <div class="mt-2 ml-2 text-xs text-gray-600">
          {{ t("presentationStyle.styleTemplate.note", { applyButton: t("project.chat.applyStyle") }) }}
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { Card, Label, Button } from "@/components/ui";
import type { MulmoScript } from "mulmocast/browser";
import { templateImageDataSet } from "mulmocast/data";
import { notifySuccess } from "@/lib/notification";
import StyleTemplateSelect from "../../chat/style_template.vue";

const { t } = useI18n();

const props = defineProps<{
  mulmoScript: MulmoScript;
  isPro: boolean;
}>();

const emit = defineEmits<{
  updateMulmoScript: [value: MulmoScript];
}>();

const selectedTemplateIndex = ref<number | null>(null);
const styleTemplateRef = ref<InstanceType<typeof StyleTemplateSelect> | null>(null);

const currentTemplate = computed(() => {
  return styleTemplateRef.value?.currentTemplate;
});

const applyStyle = () => {
  const template = currentTemplate.value;
  if (!template) return;
  const style = template.presentationStyle;
  const script = { ...props.mulmoScript, ...style };
  emit("updateMulmoScript", script);
  notifySuccess(t("settings.notifications.createSuccess"));
  selectedTemplateIndex.value = null;
};
</script>
