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
const { t } = useI18n();

interface Props {
  provider?: string;
  settingPresence: Record<string, boolean>;
}
const props = defineProps<Props>();

const provider2ApiKey = {
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
  if (!props.settingPresence[key]) {
    return key;
  }
  return false;
});
</script>
