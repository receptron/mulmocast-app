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
              <ApiKeyInput
                v-for="(config, envKey) in ENV_KEYS"
                :key="envKey"
                :env-key="envKey"
                :config="config"
                :api-key="apiKeys[envKey]"
                :show-key="showKeys[envKey]"
                @update:api-key="(value) => updateApiKey(envKey, value)"
                @update:show-key="(value) => updateShowKey(envKey, value)"
              />
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
      <LlmSettings
        :selected-l-l-m="selectedLLM"
        :llm-configs="llmConfigs"
        :api-keys="apiKeys"
        @update:selected-l-l-m="updateSelectedLLM"
        @update:llm-configs="updateLlmConfigs"
      />

      <!-- language -->
      <Card>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="language">{{ t("settings.appSettings.mode.label") }}</Label>
            <Select v-model="selectedUserLevel">
              <SelectTrigger>
                <SelectValue :placeholder="t('settings.appSettings.mode.placeholder')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="user_level in userLevels" :key="user_level.id" :value="user_level.id">
                  {{ t("settings.appSettings.userLevel." + user_level.id) }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p class="text-muted-foreground text-sm">{{ t("settings.appSettings.mode.description") }}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch, nextTick, toRaw } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { ChevronDown } from "lucide-vue-next";

import { Label, Checkbox } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import LlmSettings from "@/components/llm_settings.vue";
import ApiKeyInput from "@/components/api_key_input.vue";

import { notifySuccess, notifyError } from "@/lib/notification";
import {
  ENV_KEYS,
  languages,
  I18N_SUPPORTED_LANGUAGES,
  LLM_OLLAMA_DEFAULT_CONFIG,
  LLM_OPENAI_DEFAULT_CONFIG,
  LLM_ANTHROPIC_DEFAULT_CONFIG,
  LLM_GROQ_DEFAULT_CONFIG,
  LLM_GEMINI_DEFAULT_CONFIG,
  userLevels,
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

const selectedUserLevel = ref("beginner");

const selectedLLM = ref("openAIAgent");

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

const llmConfigs = ref<LlmConfigs>({
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
      llmConfigs.value.ollama = settings.llmConfigs.ollama;
    }
    if (settings?.llmConfigs?.openai) {
      llmConfigs.value.openai = settings.llmConfigs.openai;
    }
    if (settings?.llmConfigs?.anthropic) {
      llmConfigs.value.anthropic = settings.llmConfigs.anthropic;
    }
    if (settings?.llmConfigs?.gemini) {
      llmConfigs.value.gemini = settings.llmConfigs.gemini;
    }
    if (settings?.llmConfigs?.groq) {
      llmConfigs.value.groq = settings.llmConfigs.groq;
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
      llmConfigs: toRaw(llmConfigs.value),
      USER_LEVEL: selectedUserLevel.value ?? "beginner",
    };
    await window.electronAPI.settings.set(data);
    console.log(data);
    globalStore.updateSettings(data);
    notifySuccess(t("settings.notifications.success"));
  } catch (error) {
    console.error("Failed to save settings:", error);
    notifyError("Error", t("settings.notifications.error"));
  }
};

const debouncedSave = useDebounceFn(saveSettings, 1000);

const updateSelectedLLM = (llm: string) => {
  selectedLLM.value = llm;
};

const updateApiKey = (envKey: string, value: string) => {
  apiKeys[envKey] = value;
};

const updateShowKey = (envKey: string, value: boolean) => {
  showKeys[envKey] = value;
};

const updateLlmConfigs = (configs: LlmConfigs) => {
  llmConfigs.value = configs;
};

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

watch(selectedUserLevel, () => {
  if (!isInitialLoad.value) {
    saveSettings();
  }
});

// Watch for changes in language selection - save immediately and update i18n locale
watch(selectedLanguage, (newLang) => {
  if (!isInitialLoad.value) {
    locale.value = newLang;
    saveSettings();
  }
});
</script>
