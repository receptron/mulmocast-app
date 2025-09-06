<template>
  <div class="container mx-auto max-w-2xl p-6">
    <h1 class="mb-8 text-3xl font-bold">{{ t("settings.title") }}</h1>
    <div class="space-y-6">
      <!-- App Settings Section -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t("settings.appSettings.title") }}</CardTitle>
          <CardDescription>{{ t("settings.appSettings.description") }}</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <Label for="language">{{ t("settings.appSettings.language.label") }}</Label>
            <Select v-model="selectedLanguage">
              <SelectTrigger id="language" data-testid="language-select">
                <SelectValue :placeholder="t('settings.appSettings.language.placeholder')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="language in I18N_SUPPORTED_LANGUAGES"
                  :key="language.id"
                  :value="language.id"
                  :data-testid="`language-option-${language.id}`"
                >
                  {{ t("commonLanguages." + language.id) }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p class="text-muted-foreground text-sm">{{ t("settings.appSettings.language.description") }}</p>
          </div>
        </CardContent>
      </Card>

      <!-- API Key Settings Section -->
      <Card>
        <Collapsible v-model:open="apiKeysExpanded">
          <CardHeader>
            <CollapsibleTrigger class="w-full">
              <div class="flex items-center justify-between">
                <CardTitle class="cursor-pointer">{{ t("settings.apiKeys.title") }}</CardTitle>
                <ChevronDown :class="['h-4 w-4 transition-transform', apiKeysExpanded && 'rotate-180']" />
              </div>
              <CardDescription class="mt-2 text-left">
                {{ t("settings.apiKeys.description") }}
              </CardDescription>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent class="space-y-4">
              <div v-for="(config, envKey) in ENV_KEYS" :key="envKey" class="space-y-2 border-b pb-4 last:border-b-0">
                <div class="flex items-center justify-between">
                  <Label :for="envKey" class="text-base font-medium">{{ t("ai.apiKeyName." + envKey) }}</Label>
                  <a
                    v-if="config.url"
                    :href="config.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary hover:text-primary/80 flex items-center gap-1 text-xs"
                  >
                    {{ t("settings.apiKeys.getApiKey") }}
                    <ExternalLink class="h-3 w-3" />
                  </a>
                </div>
                <div v-if="config.features" class="mb-2 flex flex-wrap gap-2">
                  <span v-for="feature in config.features" :key="feature" class="bg-muted rounded-md px-2 py-1 text-xs">
                    {{ t(`settings.apiKeys.features.${feature}`) }}
                  </span>
                </div>
                <div class="flex gap-2">
                  <Input
                    :id="envKey"
                    v-model="apiKeys[envKey]"
                    :type="showKeys[envKey] ? 'text' : 'password'"
                    :placeholder="config.placeholder"
                    class="flex-1"
                  />
                  <Button variant="outline" size="icon" @click="showKeys[envKey] = !showKeys[envKey]">
                    <Eye v-if="!showKeys[envKey]" class="h-4 w-4" />
                    <EyeOff v-else class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
      <!-- language -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t("settings.languages.title") }}</CardTitle>
          <CardDescription>{{ t("settings.languages.description") }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="text-foreground text-base font-semibold">
            {{ t("settings.languages.mainTitle") }}
          </div>
          <RadioGroup v-model="mainLanguage" class="grid grid-cols-4 gap-2 text-sm">
            <div v-for="language in languages" :key="language" class="flex items-center space-x-2">
              <RadioGroupItem :value="language" :id="language" />
              <Label :for="language">{{ t("languages." + language) }}</Label>
            </div>
          </RadioGroup>
          <div class="text-foreground text-base font-semibold">
            {{ t("settings.languages.translatedTitle") }}
          </div>
          <div v-for="(language, key) in languages" :key="key">
            &ensp;
            <Checkbox v-model="useLanguage[language]" />
            {{ t("languages." + language) }}
          </div>
        </CardContent>
      </Card>

      <!-- llm -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t("settings.llmSettings.title") }}</CardTitle>
          <CardDescription>{{ t("settings.llmSettings.description") }}</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <Label for="language">{{ t("settings.llmSettings.llm.label") }}</Label>
            <p class="text-muted-foreground text-sm">{{ t("settings.llmSettings.llm.description") }}</p>
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
          <div class="mt-4 space-y-2" v-if="selectedLLM === 'ollamaAgent'">
            <Label for="language">{{ t("settings.llmSettings.ollama.label") }}</Label>
            {{ t("settings.llmSettings.ollama.url") }}:
            <Input v-model="llmConfigs['ollama']['url']" type="text" class="flex-1" />
            {{ t("settings.llmSettings.model") }}:
            <Input v-model="llmConfigs['ollama']['model']" type="text" class="flex-1" />
          </div>
          <div class="mt-4 space-y-2" v-if="selectedLLM === 'openAIAgent'">
            {{ t("settings.llmSettings.model") }}:
            <Input v-model="llmConfigs['openai']['model']" type="text" class="flex-1" />
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
          <div class="mt-4 space-y-2" v-if="selectedLLM === 'geminiAgent'">
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
          <div class="mt-4 space-y-2" v-if="selectedLLM === 'anthropicAgent'">
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
          <div class="mt-4 space-y-2" v-if="selectedLLM === 'groqAgent'">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch, nextTick, toRaw, computed } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { Eye, EyeOff, ExternalLink, ChevronDown } from "lucide-vue-next";
import { provider2LLMAgent } from "mulmocast/browser";

import { Button, Input, Label, Checkbox } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { notifySuccess, notifyError } from "@/lib/notification";
import {
  ENV_KEYS,
  languages,
  I18N_SUPPORTED_LANGUAGES,
  llms,
  LLM_OLLAMA_DEFAULT_CONFIG,
  LLM_OPENAI_DEFAULT_CONFIG,
  LLM_ANTHROPIC_DEFAULT_CONFIG,
  LLM_GROQ_DEFAULT_CONFIG,
  LLM_GEMINI_DEFAULT_CONFIG,
} from "../../shared/constants";
import { useMulmoGlobalStore } from "../store";

const { locale, t } = useI18n();

const apiKeys = reactive<Record<string, string>>({});
const showKeys = reactive<Record<string, boolean>>({});
const apiKeysExpanded = ref(false);

const globalStore = useMulmoGlobalStore();

const mainLanguage = ref("en");
const useLanguage = reactive<Record<string, boolean>>({});

const selectedLanguage = ref(locale.value);
const isInitialLoad = ref(true);

const selectedLLM = ref("openAIAgent");
const alertLLM = computed(() => {
  const llmKey = llms.find((llm) => llm.id === selectedLLM.value)?.apiKey;
  if (llmKey && apiKeys[llmKey] === "") {
    return llmKey;
  }
  return null;
});

type LlmConfigOllama = { url: string; model: string };
type LlmConfigOpenAI = { model: string };
type LlmConfigGemini = { model: string };
type LlmConfigAnthropic = { model: string };
type LlmConfigGroq = { model: string };

type LlmConfigs = {
  ollama: LlmConfigOllama;
  openai: LlmConfigOpenAI;
  gemini: LlmConfigGemini;
  anthropic: LlmConfigAnthropic;
  groq: LlmConfigGroq;
};

const llmConfigs = reactive<LlmConfigs>({
  ollama: { ...LLM_OLLAMA_DEFAULT_CONFIG },
  openai: { ...LLM_OPENAI_DEFAULT_CONFIG },
  anthropic: { ...LLM_ANTHROPIC_DEFAULT_CONFIG },
  groq: { ...LLM_GROQ_DEFAULT_CONFIG },
  gemini: { ...LLM_GEMINI_DEFAULT_CONFIG },
});

// Initialize all keys
Object.keys(ENV_KEYS).forEach((envKey) => {
  apiKeys[envKey] = "";
  showKeys[envKey] = false;
});
Object.values(languages).forEach((langKey) => {
  useLanguage[langKey] = false;
});

onMounted(async () => {
  // Load existing API keys and language settings
  try {
    const settings = await window.electronAPI.settings.get();
    Object.keys(ENV_KEYS).forEach((envKey) => {
      if (settings.APIKEY && settings.APIKEY[envKey]) {
        apiKeys[envKey] = settings.APIKEY[envKey as keyof typeof settings] || "";
      } else if (envKey in settings) {
        // backward compatibility
        apiKeys[envKey] = settings[envKey as keyof typeof settings] || "";
      }
    });
    if (settings.USE_LANGUAGES) {
      Object.values(languages).forEach((langKey) => {
        useLanguage[langKey] = settings.USE_LANGUAGES[langKey] ?? false;
      });
    }

    // Load language preference
    if (settings.APP_LANGUAGE) {
      selectedLanguage.value = settings.APP_LANGUAGE;
    }
    if (settings.MAIN_LANGUAGE) {
      mainLanguage.value = settings.MAIN_LANGUAGE;
    }
    if (settings.CHAT_LLM) {
      selectedLLM.value = settings.CHAT_LLM;
    }
    if (settings?.llmConfigs?.ollama) {
      llmConfigs.ollama = settings.llmConfigs.ollama;
    }
    if (settings?.llmConfigs?.openai) {
      llmConfigs.openai = settings.llmConfigs.openai;
    }
    if (settings?.llmConfigs?.anthropic) {
      llmConfigs.anthropic = settings.llmConfigs.anthropic;
    }
    // Wait for the next tick to avoid triggering save during initial load
    await nextTick();
    isInitialLoad.value = false;
  } catch (error) {
    console.error("Failed to load settings:", error);
    isInitialLoad.value = false;
  }
});

const saveSettings = async () => {
  try {
    const data = {
      ...apiKeys,
      APIKEY: toRaw(apiKeys),
      APP_LANGUAGE: selectedLanguage.value,
      USE_LANGUAGES: { ...useLanguage },
      MAIN_LANGUAGE: mainLanguage.value,
      CHAT_LLM: selectedLLM.value,
      llmConfigs: toRaw(llmConfigs),
    };
    await window.electronAPI.settings.set(data);
    globalStore.updateSettings(data);
    notifySuccess(t("settings.notifications.success"));
  } catch (error) {
    console.error("Failed to save settings:", error);
    notifyError("Error", t("settings.notifications.error"));
  }
};

const debouncedSave = useDebounceFn(saveSettings, 1000);

// Watch for changes in text
watch(
  [apiKeys, llmConfigs],
  () => {
    // Skip save during initial load
    if (!isInitialLoad.value) {
      debouncedSave();
    }
  },
  { deep: true },
);

watch(
  [mainLanguage, useLanguage, selectedLLM],
  () => {
    // Skip save during initial load
    if (!isInitialLoad.value) {
      saveSettings();
    }
  },
  { deep: true },
);

// Watch for changes in language selection - save immediately and update i18n locale
watch(selectedLanguage, (newLang) => {
  if (!isInitialLoad.value) {
    locale.value = newLang;
    saveSettings();
  }
});
</script>
