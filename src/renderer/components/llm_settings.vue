<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ t("settings.llmSettings.title") }}</CardTitle>
      <CardDescription>{{ t("settings.llmSettings.description") }}</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="space-y-2">
        <Label for="language">{{ t("settings.llmSettings.llm.label") }}</Label>
        <p class="text-muted-foreground text-sm">{{ t("settings.llmSettings.llm.description") }}</p>
        <!-- LLM -->
        <Select v-model="selectedLLM">
          <SelectTrigger id="llm">
            <SelectValue :placeholder="t('settings.llmSettings.llm.placeholder')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="llm in llms" :key="llm.id" :value="llm.id">
              {{ t("ai.agent." + llm.id) }}
            </SelectItem>
          </SelectContent>
        </Select>
        <div v-if="alertLLM" class="text-destructive">
          {{ t("ai.provider.alertTemplate", { thing: t("ai.apiKeyName." + alertLLM) }) }}
        </div>
      </div>
      <!-- Ollama config -->
      <div class="mt-4 space-y-2" v-if="selectedLLM === 'ollamaAgent'">
        <Label for="language">{{ t("settings.llmSettings.ollama.label") }}</Label>
        {{ t("settings.llmSettings.ollama.url") }}:
        <Input v-model="llmConfigs['ollama']['url']" type="text" class="flex-1" />
        {{ t("settings.llmSettings.model") }}:
        <Input v-model="llmConfigs['ollama']['model']" type="text" class="flex-1" />
      </div>
      <!-- OpenAI Model config -->
      <div class="mt-4 space-y-2" v-if="selectedLLM === 'openAIAgent' && isDevelopment">
        {{ t("settings.llmSettings.model") }}:
        <Select v-model="llmConfigs['openai']['model']">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="model in provider2LLMAgent['openai']['models']" :key="model" :value="model">
              {{ model }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <!-- Azure OpenAI option under OpenAI (shown when Azure LLM is configured) -->
      <div class="mt-4 space-y-2" v-if="selectedLLM === 'openAIAgent' && azureOpenAIConfigured">
        <div class="flex items-center space-x-2">
          <Checkbox :model-value="llmConfigs['openai']['useAzure'] ?? false" @update:model-value="(v) => updateUseAzure(v)" />
          <Label>{{ t("settings.llmSettings.azureOpenai.useAzure") }}</Label>
        </div>
        <div v-if="llmConfigs['openai']['useAzure']" class="mt-2 space-y-2">
          <Label for="azureOpenaiModel">{{ t("settings.llmSettings.model") }}</Label>
          <p class="text-muted-foreground text-sm">{{ t("settings.llmSettings.azureOpenai.modelDescription") }}</p>
          <Input
            :model-value="llmConfigs['openai']['azureDeploymentName'] ?? ''"
            @update:model-value="(v) => updateAzureDeploymentName(v)"
            type="text"
            class="flex-1"
            :placeholder="t('settings.llmSettings.azureOpenai.modelPlaceholder')"
          />
        </div>
      </div>
      <!-- Gemini Model config -->
      <div class="mt-4 space-y-2" v-if="selectedLLM === 'geminiAgent' && isDevelopment">
        {{ t("settings.llmSettings.model") }}:
        <Select v-model="llmConfigs['gemini']['model']">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="model in provider2LLMAgent['gemini']['models']" :key="model" :value="model">
              {{ model }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="mt-4 space-y-2" v-if="selectedLLM === 'anthropicAgent' && isDevelopment">
        {{ t("settings.llmSettings.model") }}:
        <Select v-model="llmConfigs['anthropic']['model']">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="model in provider2LLMAgent['anthropic']['models']" :key="model" :value="model">
              {{ model }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="mt-4 space-y-2" v-if="selectedLLM === 'groqAgent' && isDevelopment">
        {{ t("settings.llmSettings.model") }}:
        <Select v-model="llmConfigs['groq']['model']">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="model in provider2LLMAgent['groq']['models']" :key="model" :value="model">
              {{ model }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { provider2LLMAgent } from "mulmocast/browser";

import { Input, Label, Checkbox } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { llms } from "../../shared/constants";

const isDevelopment = import.meta.env.DEV;
const { t } = useI18n();

type LlmConfigOllama = { url: string; model: string };
type LlmConfigOpenAI = { model: string; useAzure?: boolean; azureDeploymentName?: string };
type LlmConfigGemini = { model: string };
type LlmConfigAnthropic = { model: string };
type LlmConfigGroq = { model: string };
type LlmConfigAzureOpenAI = { model: string };

type LlmConfigs = {
  ollama: LlmConfigOllama;
  openai: LlmConfigOpenAI;
  gemini: LlmConfigGemini;
  anthropic: LlmConfigAnthropic;
  groq: LlmConfigGroq;
  azureOpenai: LlmConfigAzureOpenAI;
};

type AzureOpenAIServiceConfig = {
  apiKey?: string;
  baseUrl?: string;
};

type AzureOpenAIConfig = {
  image?: AzureOpenAIServiceConfig;
  tts?: AzureOpenAIServiceConfig;
  llm?: AzureOpenAIServiceConfig;
};

type Props = {
  selectedLLM: string;
  llmConfigs: LlmConfigs;
  apiKeys?: Record<string, string>;
  azureOpenAIConfig?: AzureOpenAIConfig;
};

type Emits = {
  "update:selectedLLM": [value: string];
  "update:llmConfigs": [value: LlmConfigs];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedLLM = computed({
  get: () => props.selectedLLM,
  set: (value: string) => emit("update:selectedLLM", value),
});

const llmConfigs = computed({
  get: () => props.llmConfigs,
  set: (value: LlmConfigs) => emit("update:llmConfigs", value),
});

const alertLLM = computed(() => {
  if (!props.apiKeys) {
    return null;
  }
  // Azure OpenAI uses a different validation path (skip API key check when useAzure is enabled)
  if (selectedLLM.value === "openAIAgent" && props.llmConfigs.openai?.useAzure) {
    return null;
  }
  const llmKey = llms.find((llm) => llm.id === selectedLLM.value)?.apiKey;
  if (llmKey && props.apiKeys[llmKey] === "") {
    return llmKey;
  }
  return null;
});

// Check if Azure OpenAI LLM is properly configured
const azureOpenAIConfigured = computed(() => {
  const llmConfig = props.azureOpenAIConfig?.llm;
  return !!(llmConfig?.apiKey && llmConfig?.baseUrl);
});

// Update useAzure flag in llmConfigs
const updateUseAzure = (value: boolean) => {
  const newConfigs = { ...props.llmConfigs };
  newConfigs.openai = { ...newConfigs.openai, useAzure: value };
  emit("update:llmConfigs", newConfigs);
};

// Update Azure deployment name in llmConfigs
const updateAzureDeploymentName = (value: string) => {
  const newConfigs = { ...props.llmConfigs };
  newConfigs.openai = { ...newConfigs.openai, azureDeploymentName: value };
  emit("update:llmConfigs", newConfigs);
};
</script>
