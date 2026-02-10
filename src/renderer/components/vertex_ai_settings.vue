<template>
  <Card>
    <Collapsible v-model:open="isExpanded">
      <CardHeader>
        <CollapsibleTrigger class="w-full">
          <div class="flex items-center justify-between">
            <CardTitle class="cursor-pointer">{{ t("settings.vertexAI.title") }}</CardTitle>
            <ChevronDown :class="['h-4 w-4 transition-transform', isExpanded && 'rotate-180']" />
          </div>
          <CardDescription class="mt-2 text-left">
            {{ t("settings.vertexAI.description") }}
          </CardDescription>
        </CollapsibleTrigger>
      </CardHeader>
      <CollapsibleContent>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label>{{ t("settings.vertexAI.project") }}</Label>
            <Input v-model="localConfig.project" type="text" :placeholder="t('settings.vertexAI.projectPlaceholder')" />
          </div>
          <div class="space-y-2">
            <Label>{{ t("settings.vertexAI.location") }}</Label>
            <Input
              v-model="localConfig.location"
              type="text"
              :placeholder="t('settings.vertexAI.locationPlaceholder')"
            />
          </div>
        </CardContent>
      </CollapsibleContent>
    </Collapsible>
  </Card>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ChevronDown } from "lucide-vue-next";

import { Input, Label } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import type { VertexAIConfig } from "../../types/index";

type Props = {
  config: VertexAIConfig;
};

type Emits = {
  "update:config": [value: VertexAIConfig];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

const isExpanded = ref(false);

const localConfig = reactive<{ project: string; location: string }>({
  project: props.config?.project || "",
  location: props.config?.location || "",
});

// Watch for external config changes (prevent infinite loop)
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig) {
      const newProject = newConfig.project || "";
      const newLocation = newConfig.location || "";
      if (localConfig.project !== newProject) {
        localConfig.project = newProject;
      }
      if (localConfig.location !== newLocation) {
        localConfig.location = newLocation;
      }
    }
  },
  { deep: true },
);

// Emit changes to parent
watch(
  localConfig,
  (newConfig) => {
    emit("update:config", { ...newConfig });
  },
  { deep: true },
);
</script>
