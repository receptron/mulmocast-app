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
          <Select v-model="selectedTemplateIndex">
            <SelectTrigger class="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="(template, k) in isPro ? promptTemplates : simpleTemplate" :key="k" :value="k">
                {{ t("project.chat.templates." + template.filename) }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" @click="applyStyle">
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
  isPro: boolean;
}>();

const selectedTemplateIndex = ref(0);

const simpleTemplate = promptTemplates.filter((temp) => {
  console.log(temp.filename);
  return ["ani", "ghibli_comic", "image_prompt"].includes(temp.filename);
});

// console.log(simpleTemplate);

const emit = defineEmits<{
  updateMulmoScript: [value: MulmoScript];
}>();

const applyStyle = () => {
  const style = (props.isPro ? promptTemplates : simpleTemplate)[selectedTemplateIndex.value].presentationStyle;
  const script = { ...props.mulmoScript, ...style };
  emit("updateMulmoScript", script);
  notifySuccess(t("settings.notifications.createSuccess"));
};
</script>
