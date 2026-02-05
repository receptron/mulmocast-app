<template>
  <div>
    <div v-if="providerAlert" class="text-destructive">
      {{ t("ai.provider.alertTemplate", { thing: t("ai.apiKeyName." + providerAlert) }) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useMulmoGlobalStore } from "@/store";

const { t } = useI18n();
const globalStore = useMulmoGlobalStore();

interface Props {
  provider?: string;
  settingPresence: Record<string, boolean>;
  feature?: "image" | "tts" | "llm"; // OpenAI feature type for Azure OpenAI support
}
const props = defineProps<Props>();

const provider2ApiKey: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  google: "GEMINI_API_KEY",
  gemini: "GEMINI_API_KEY",
  replicate: "REPLICATE_API_TOKEN",
  elevenlabs: "ELEVENLABS_API_KEY",
  kotodama: "KOTODAMA_API_KEY",
};

const providerAlert = computed(() => {
  if (!props.provider) {
    return false;
  }
  if (!props.settingPresence) {
    return false;
  }
  const key = provider2ApiKey[props.provider];

  // For OpenAI provider with feature specified, use feature-specific check (supports Azure OpenAI)
  if (props.provider === "openai" && props.feature) {
    if (globalStore.hasOpenAIKeyForFeature(props.feature)) {
      return false;
    }
    return key;
  }

  // Default behavior for other providers
  if (!props.settingPresence[key]) {
    return key;
  }
  return false;
});
</script>
