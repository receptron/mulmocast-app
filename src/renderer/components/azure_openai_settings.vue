<template>
  <Card>
    <Collapsible v-model:open="expanded">
      <CardHeader>
        <CollapsibleTrigger class="w-full">
          <div class="flex items-center justify-between">
            <CardTitle class="cursor-pointer">{{ t("settings.azureOpenAI.title") }}</CardTitle>
            <ChevronDown :class="['h-4 w-4 transition-transform', expanded && 'rotate-180']" />
          </div>
          <CardDescription class="mt-2 text-left">
            {{ t("settings.azureOpenAI.description") }}
          </CardDescription>
        </CollapsibleTrigger>
      </CardHeader>
      <CollapsibleContent>
        <CardContent class="space-y-6">
          <!-- Image Generation (IMAGE) -->
          <div class="space-y-3 border-b pb-4">
            <div class="text-foreground text-sm font-semibold">
              {{ t("settings.azureOpenAI.image.title") }}
            </div>
            <div class="space-y-2">
              <Label for="image-api-key">{{ t("settings.azureOpenAI.apiKey") }}</Label>
              <div class="flex gap-2">
                <Input
                  id="image-api-key"
                  v-model="imageApiKey"
                  :type="showImageKey ? 'text' : 'password'"
                  :placeholder="t('settings.azureOpenAI.apiKeyPlaceholder')"
                  class="flex-1"
                />
                <Button variant="outline" size="icon" @click="showImageKey = !showImageKey">
                  <Eye v-if="!showImageKey" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div class="space-y-2">
              <Label for="image-base-url">{{ t("settings.azureOpenAI.baseUrl") }}</Label>
              <Input
                id="image-base-url"
                v-model="imageBaseUrl"
                type="text"
                :placeholder="t('settings.azureOpenAI.baseUrlPlaceholder')"
              />
            </div>
          </div>

          <!-- Text-to-Speech (TTS) -->
          <div class="space-y-3 border-b pb-4">
            <div class="text-foreground text-sm font-semibold">
              {{ t("settings.azureOpenAI.tts.title") }}
            </div>
            <div class="space-y-2">
              <Label for="tts-api-key">{{ t("settings.azureOpenAI.apiKey") }}</Label>
              <div class="flex gap-2">
                <Input
                  id="tts-api-key"
                  v-model="ttsApiKey"
                  :type="showTtsKey ? 'text' : 'password'"
                  :placeholder="t('settings.azureOpenAI.apiKeyPlaceholder')"
                  class="flex-1"
                />
                <Button variant="outline" size="icon" @click="showTtsKey = !showTtsKey">
                  <Eye v-if="!showTtsKey" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div class="space-y-2">
              <Label for="tts-base-url">{{ t("settings.azureOpenAI.baseUrl") }}</Label>
              <Input
                id="tts-base-url"
                v-model="ttsBaseUrl"
                type="text"
                :placeholder="t('settings.azureOpenAI.baseUrlPlaceholder')"
              />
            </div>
          </div>

          <!-- LLM (Text Generation) -->
          <div class="space-y-3">
            <div class="text-foreground text-sm font-semibold">
              {{ t("settings.azureOpenAI.llm.title") }}
            </div>
            <div class="space-y-2">
              <Label for="llm-api-key">{{ t("settings.azureOpenAI.apiKey") }}</Label>
              <div class="flex gap-2">
                <Input
                  id="llm-api-key"
                  v-model="llmApiKey"
                  :type="showLlmKey ? 'text' : 'password'"
                  :placeholder="t('settings.azureOpenAI.apiKeyPlaceholder')"
                  class="flex-1"
                />
                <Button variant="outline" size="icon" @click="showLlmKey = !showLlmKey">
                  <Eye v-if="!showLlmKey" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div class="space-y-2">
              <Label for="llm-base-url">{{ t("settings.azureOpenAI.baseUrl") }}</Label>
              <Input
                id="llm-base-url"
                v-model="llmBaseUrl"
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
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Eye, EyeOff, ChevronDown } from "lucide-vue-next";

import { Button, Input, Label } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import type { AzureOpenAIConfig } from "../../types/index";

type Props = {
  azureOpenAIConfig?: AzureOpenAIConfig;
};

type Emits = {
  "update:azureOpenAIConfig": [value: AzureOpenAIConfig];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

const expanded = ref(false);

// Show/hide states for API keys
const showImageKey = ref(false);
const showTtsKey = ref(false);
const showLlmKey = ref(false);

// Helper to emit updates
const emitUpdate = (updates: Partial<AzureOpenAIConfig>) => {
  const newConfig: AzureOpenAIConfig = {
    ...props.azureOpenAIConfig,
    ...updates,
  };
  emit("update:azureOpenAIConfig", newConfig);
};

// IMAGE settings
const imageApiKey = computed({
  get: () => props.azureOpenAIConfig?.image?.apiKey || "",
  set: (value: string) => {
    emitUpdate({
      image: {
        ...props.azureOpenAIConfig?.image,
        apiKey: value,
      },
    });
  },
});

const imageBaseUrl = computed({
  get: () => props.azureOpenAIConfig?.image?.baseUrl || "",
  set: (value: string) => {
    emitUpdate({
      image: {
        ...props.azureOpenAIConfig?.image,
        baseUrl: value,
      },
    });
  },
});

// TTS settings
const ttsApiKey = computed({
  get: () => props.azureOpenAIConfig?.tts?.apiKey || "",
  set: (value: string) => {
    emitUpdate({
      tts: {
        ...props.azureOpenAIConfig?.tts,
        apiKey: value,
      },
    });
  },
});

const ttsBaseUrl = computed({
  get: () => props.azureOpenAIConfig?.tts?.baseUrl || "",
  set: (value: string) => {
    emitUpdate({
      tts: {
        ...props.azureOpenAIConfig?.tts,
        baseUrl: value,
      },
    });
  },
});

// LLM settings
const llmApiKey = computed({
  get: () => props.azureOpenAIConfig?.llm?.apiKey || "",
  set: (value: string) => {
    emitUpdate({
      llm: {
        ...props.azureOpenAIConfig?.llm,
        apiKey: value,
      },
    });
  },
});

const llmBaseUrl = computed({
  get: () => props.azureOpenAIConfig?.llm?.baseUrl || "",
  set: (value: string) => {
    emitUpdate({
      llm: {
        ...props.azureOpenAIConfig?.llm,
        baseUrl: value,
      },
    });
  },
});

// Auto-expand if any Azure config is set
watch(
  () => props.azureOpenAIConfig,
  (config) => {
    if (
      config?.image?.apiKey ||
      config?.image?.baseUrl ||
      config?.tts?.apiKey ||
      config?.tts?.baseUrl ||
      config?.llm?.apiKey ||
      config?.llm?.baseUrl
    ) {
      expanded.value = true;
    }
  },
  { immediate: true },
);
</script>
