<template>
  <Dialog :open="isOpen" @update:open="() => {}">
    <DialogContent
      class="flex h-[605px] max-w-2xl flex-col"
      :hide-close="true"
      @escape-key-down.prevent
      @pointer-down-outside.prevent
    >
      <DialogHeader class="flex-shrink-0">
        <DialogTitle class="text-center text-2xl font-bold">
          {{ t("onboarding.title") }}
        </DialogTitle>
        <DialogDescription class="text-muted-foreground text-center">
          {{ t("onboarding.description") }}
        </DialogDescription>

        <!-- Step indicator -->
        <div class="mt-2 flex justify-center space-x-3">
          <div
            v-for="step in steps"
            :key="step.id"
            :class="[
              'h-2 w-2 rounded-full transition-all duration-300 ease-in-out',
              currentStep >= step.id ? 'bg-primary scale-110 shadow-lg' : 'bg-primary/20 scale-105',
            ]"
          />
        </div>
      </DialogHeader>

      <div class="flex-1 space-y-6 overflow-y-auto p-1">
        <!-- Step 1: Language + Welcome -->
        <div v-if="currentStep === 1" class="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{{ t("settings.appSettings.language.label") }}</CardTitle>
              <CardDescription>{{ t("settings.appSettings.language.description") }}</CardDescription>
            </CardHeader>
            <CardContent>
              <Select v-model="locale">
                <SelectTrigger id="onboarding-language" data-testid="onboarding-language-select">
                  <SelectValue :placeholder="t('settings.appSettings.language.placeholder')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="language in I18N_SUPPORTED_LANGUAGES" :key="language.id" :value="language.id">
                    {{ t("commonLanguages." + language.id) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent class="space-y-4">
              <div>
                <h4 class="mb-2 font-semibold">{{ t("onboarding.welcome.whatIsMulmoCast") }}</h4>
                <p class="text-muted-foreground text-sm">
                  {{ t("onboarding.welcome.whatIsMulmoCastDescription") }}
                </p>
              </div>
              <div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
                <p class="text-sm">
                  {{ t("onboarding.welcome.setupGuide") }}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Step 2: API Key -->
        <div v-if="currentStep === 2">
          <Card>
            <CardHeader>
              <CardTitle>{{ t("settings.apiKeys.title") }}</CardTitle>
              <CardDescription>{{ t("settings.apiKeys.description") }}</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="space-y-3">
                <ApiKeyInput
                  :key="DEFAULT_LLM_API_KEY"
                  :env-key="DEFAULT_LLM_API_KEY"
                  :config="ENV_KEYS[DEFAULT_LLM_API_KEY]"
                  :api-key="apiKeys[DEFAULT_LLM_API_KEY]"
                  :show-key="showKeys[DEFAULT_LLM_API_KEY]"
                  @update:api-key="(value) => updateApiKey(DEFAULT_LLM_API_KEY, value)"
                  @update:show-key="(value) => updateShowKey(DEFAULT_LLM_API_KEY, value)"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Step 3: Complete -->
        <div v-if="currentStep === totalSteps">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2 text-2xl">
                <div class="rounded-full border-2 border-green-600 p-1 dark:border-green-900">
                  <Check class="h-4 w-4 text-green-600" />
                </div>
                {{ t("onboarding.complete.title") }}
              </CardTitle>
              <CardDescription class="text-lg">
                {{ t("onboarding.complete.description") }}
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
              <div>
                <h4 class="mb-3 font-semibold">{{ t("onboarding.complete.nextSteps") }}</h4>
                <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div class="flex items-start gap-2 rounded-lg bg-green-50 p-3 dark:bg-green-950/20">
                    <FileText class="h-5 w-5 text-green-600" />
                    <div>
                      <p class="text-sm font-medium">{{ t("onboarding.complete.features.script") }}</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-2 rounded-lg bg-purple-50 p-3 dark:bg-purple-950/20">
                    <Palette class="h-5 w-5 text-purple-600" />
                    <div>
                      <p class="text-sm font-medium">{{ t("onboarding.complete.features.media") }}</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
                    <BarChart3 class="h-5 w-5 text-blue-600" />
                    <div>
                      <p class="text-sm font-medium">{{ t("onboarding.complete.features.presentation") }}</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-2 rounded-lg bg-orange-50 p-3 dark:bg-orange-950/20">
                    <Globe class="h-4 w-4 text-orange-600" />
                    <div>
                      <p class="text-sm font-medium">{{ t("onboarding.complete.features.translation") }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- error message -->
        <div
          v-if="errorMessage"
          class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-400"
        >
          <AlertCircle class="h-4 w-4 flex-shrink-0" />
          <span class="text-sm">{{ errorMessage }}</span>
        </div>
      </div>

      <DialogFooter class="flex flex-shrink-0 justify-between border-t pt-4">
        <Button v-if="currentStep > 1" variant="outline" @click="prevStep" :disabled="isSaving">
          {{ t("ui.common.previous") }}
        </Button>
        <div v-else />

        <Button v-if="currentStep < totalSteps" @click="nextStep" :disabled="!canProceedToNext">
          {{ t("ui.common.next") }}
        </Button>
        <Button v-else @click="handleSave" :disabled="!canSave || isSaving">
          <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("onboarding.completeBtn") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, toRaw } from "vue";
import { useI18n } from "vue-i18n";
import { Loader2, AlertCircle, Check, FileText, Palette, BarChart3, Globe } from "lucide-vue-next";

import { Button } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ApiKeyInput from "@/components/api_key_input.vue";

import { notifySuccess, notifyError } from "@/lib/notification";
import {
  ENV_KEYS,
  llms,
  I18N_SUPPORTED_LANGUAGES,
  LLM_OLLAMA_DEFAULT_CONFIG,
  LLM_OPENAI_DEFAULT_CONFIG,
  LLM_ANTHROPIC_DEFAULT_CONFIG,
  LLM_GROQ_DEFAULT_CONFIG,
  LLM_GEMINI_DEFAULT_CONFIG,
} from "../../shared/constants";
import { useMulmoGlobalStore } from "../store";
import { Settings } from "../../main/settings_manager";

const { t, locale } = useI18n();
const globalStore = useMulmoGlobalStore();

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

defineProps<{
  isOpen: boolean;
}>();
const emit = defineEmits<{
  "update:isOpen": [value: boolean];
  complete: [];
}>();

const isSaving = ref(false);
const errorMessage = ref("");
const DEFAULT_LLM_AGENT = "openAIAgent";
const DEFAULT_LLM_API_KEY = "OPENAI_API_KEY";
const currentStep = ref(1);

const apiKeys = ref<Record<string, string>>({});
const showKeys = ref<Record<string, boolean>>({});

const llmConfigs = ref<LlmConfigs>({
  ollama: { ...LLM_OLLAMA_DEFAULT_CONFIG },
  openai: { ...LLM_OPENAI_DEFAULT_CONFIG },
  anthropic: { ...LLM_ANTHROPIC_DEFAULT_CONFIG },
  groq: { ...LLM_GROQ_DEFAULT_CONFIG },
  gemini: { ...LLM_GEMINI_DEFAULT_CONFIG },
});

// Initialize API keys
Object.keys(ENV_KEYS).forEach((envKey) => {
  apiKeys.value[envKey] = "";
  showKeys.value[envKey] = false;
});

// Step configuration
const steps = [
  { id: 1, name: "welcome" },
  { id: 2, name: "llm" },
  { id: 3, name: "complete" },
];

const totalSteps = computed(() => {
  return steps.length;
});

const canSave = computed(() => {
  const selectedLlmConfig = llms.find((llm) => llm.id === DEFAULT_LLM_AGENT);
  if (!selectedLlmConfig?.apiKey) {
    return false;
  }
  return apiKeys.value[selectedLlmConfig.apiKey]?.trim() !== "";
});

const canProceedToNext = computed(() => {
  if (currentStep.value === 1) {
    return true;
  }
  if (currentStep.value === 2) {
    return canSave.value;
  }
  if (currentStep.value === 3) {
    return true;
  }
  return false;
});

const updateApiKey = (envKey: string, value: string) => {
  apiKeys.value[envKey] = value;
  errorMessage.value = "";
};

const updateShowKey = (envKey: string, value: boolean) => {
  showKeys.value[envKey] = value;
};

const nextStep = () => {
  if (currentStep.value < totalSteps.value) {
    currentStep.value++;
    errorMessage.value = "";
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
    errorMessage.value = "";
  }
};

const handleSave = async () => {
  if (!canSave.value) {
    errorMessage.value = t("onboarding.errors.requiredApiKey");
    return;
  }

  isSaving.value = true;
  errorMessage.value = "";

  try {
    const data = {
      ...apiKeys.value,
      APIKEY: toRaw({ ...apiKeys.value }),
      APP_LANGUAGE: locale.value,
      MAIN_LANGUAGE: locale.value,
      CHAT_LLM: DEFAULT_LLM_AGENT,
      llmConfigs: toRaw(llmConfigs.value),
    };

    await window.electronAPI.settings.set(data as unknown as Settings);
    globalStore.updateSettings(data);

    notifySuccess(t("onboarding.success"));
    emit("complete");
  } catch (error) {
    console.error("Failed to save onboarding settings:", error);
    errorMessage.value = t("onboarding.errors.saveFailed");
    notifyError("Error", t("onboarding.errors.saveFailed"));
  } finally {
    isSaving.value = false;
  }
};
</script>
