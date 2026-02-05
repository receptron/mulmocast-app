<template>
  <Card>
    <Collapsible v-model:open="isExpanded">
      <CardHeader>
        <CollapsibleTrigger class="w-full">
          <div class="flex items-center justify-between">
            <CardTitle class="cursor-pointer">{{ t("settings.azureOpenAI.title") }}</CardTitle>
            <ChevronDown :class="['h-4 w-4 transition-transform', isExpanded && 'rotate-180']" />
          </div>
          <CardDescription class="mt-2 text-left">
            {{ t("settings.azureOpenAI.description") }}
          </CardDescription>
        </CollapsibleTrigger>
      </CardHeader>
      <CollapsibleContent>
        <CardContent class="space-y-6">
          <!-- Image Generation Service -->
          <div class="space-y-3 border-b pb-4">
            <Label class="text-base font-medium">{{ t("settings.azureOpenAI.image.title") }}</Label>
            <div class="space-y-2">
              <div class="flex gap-2">
                <Input
                  v-model="localConfig.image.apiKey"
                  :type="showKeys.imageApiKey ? 'text' : 'password'"
                  :placeholder="t('settings.azureOpenAI.image.apiKey')"
                  class="flex-1"
                />
                <Button variant="outline" size="icon" @click="showKeys.imageApiKey = !showKeys.imageApiKey">
                  <Eye v-if="!showKeys.imageApiKey" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </Button>
              </div>
              <Input
                v-model="localConfig.image.baseUrl"
                type="text"
                :placeholder="t('settings.azureOpenAI.baseUrlPlaceholder')"
              />
            </div>
          </div>

          <!-- TTS Service -->
          <div class="space-y-3 border-b pb-4">
            <Label class="text-base font-medium">{{ t("settings.azureOpenAI.tts.title") }}</Label>
            <div class="space-y-2">
              <div class="flex gap-2">
                <Input
                  v-model="localConfig.tts.apiKey"
                  :type="showKeys.ttsApiKey ? 'text' : 'password'"
                  :placeholder="t('settings.azureOpenAI.tts.apiKey')"
                  class="flex-1"
                />
                <Button variant="outline" size="icon" @click="showKeys.ttsApiKey = !showKeys.ttsApiKey">
                  <Eye v-if="!showKeys.ttsApiKey" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </Button>
              </div>
              <Input
                v-model="localConfig.tts.baseUrl"
                type="text"
                :placeholder="t('settings.azureOpenAI.baseUrlPlaceholder')"
              />
            </div>
          </div>

          <!-- LLM Service -->
          <div class="space-y-3">
            <Label class="text-base font-medium">{{ t("settings.azureOpenAI.llm.title") }}</Label>
            <div class="space-y-2">
              <div class="flex gap-2">
                <Input
                  v-model="localConfig.llm.apiKey"
                  :type="showKeys.llmApiKey ? 'text' : 'password'"
                  :placeholder="t('settings.azureOpenAI.llm.apiKey')"
                  class="flex-1"
                />
                <Button variant="outline" size="icon" @click="showKeys.llmApiKey = !showKeys.llmApiKey">
                  <Eye v-if="!showKeys.llmApiKey" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </Button>
              </div>
              <Input
                v-model="localConfig.llm.baseUrl"
                type="text"
                :placeholder="t('settings.azureOpenAI.baseUrlPlaceholder')"
              />
            </div>
          </div>
        </CardContent>
      </CollapsibleContent>
    </Collapsible>
  </Card>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ChevronDown, Eye, EyeOff } from "lucide-vue-next";

import { Button, Input, Label } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import type { AzureOpenAIConfig, AzureOpenAIServiceConfig } from "../../types/index";

type Props = {
  config: AzureOpenAIConfig;
};

type Emits = {
  "update:config": [value: AzureOpenAIConfig];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

const isExpanded = ref(false);

const showKeys = reactive({
  imageApiKey: false,
  ttsApiKey: false,
  llmApiKey: false,
});

const createDefaultServiceConfig = (): AzureOpenAIServiceConfig => ({
  apiKey: "",
  baseUrl: "",
});

const localConfig = reactive<{
  image: AzureOpenAIServiceConfig;
  tts: AzureOpenAIServiceConfig;
  llm: AzureOpenAIServiceConfig;
}>({
  image: { ...createDefaultServiceConfig(), ...props.config?.image },
  tts: { ...createDefaultServiceConfig(), ...props.config?.tts },
  llm: { ...createDefaultServiceConfig(), ...props.config?.llm },
});

// Watch for external config changes
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig) {
      localConfig.image = { ...createDefaultServiceConfig(), ...newConfig.image };
      localConfig.tts = { ...createDefaultServiceConfig(), ...newConfig.tts };
      localConfig.llm = { ...createDefaultServiceConfig(), ...newConfig.llm };
    }
  },
  { deep: true },
);

// Emit changes to parent
watch(
  localConfig,
  (newConfig) => {
    emit("update:config", {
      image: { ...newConfig.image },
      tts: { ...newConfig.tts },
      llm: { ...newConfig.llm },
    });
  },
  { deep: true },
);
</script>
