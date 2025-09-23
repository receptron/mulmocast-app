<template>
  <Card class="p-4">
    <h4 class="mb-3 font-medium">{{ t("presentationStyle.styleTemplate.title") }}</h4>
    <div class="space-y-3">
      <div>
        <Label class="block">
          {{ t("presentationStyle.styleTemplate.description") }}
        </Label>
        <!-- Template selection section -->
        <div class="template-section">
          <Select v-model="selectedTemplateIndex">
            <SelectTrigger class="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="(template, k) in promptTemplates" :key="k" :value="k">
                {{ t("project.chat.templates." + template.filename) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="mt-2">
          <Button size="sm" @click="applyStyle" class="mr-2">
            {{ t("project.chat.applyStyle") }}
          </Button>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { Card, Label, Button } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MulmoScript } from "mulmocast/browser";
import { promptTemplates } from "mulmocast/data";
import { notifySuccess } from "@/lib/notification";

const { t } = useI18n();

const props = defineProps<{
  mulmoScript: MulmoScript;
}>();

const selectedTemplateIndex = ref(0);

const emit = defineEmits<{
  updateMulmoScript: [value: MulmoScript];
}>();

const applyStyle = () => {
  const style = promptTemplates[selectedTemplateIndex.value].presentationStyle;
  const script = { ...props.mulmoScript, ...style };
  emit("updateMulmoScript", script);
  notifySuccess(t("settings.notifications.createSuccess"));

};
</script>
