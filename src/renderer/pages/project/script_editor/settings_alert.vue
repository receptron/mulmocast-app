<template>
  <div v-if="providerWarning" class="text-destructive">
    {{ t("ai.provider." + props.provider + ".warning") }}
    <a
      v-if="t('ai.provider.' + props.provider + '.warningLink', '')"
      :href="t('ai.provider.' + props.provider + '.warningLink')"
      target="_blank"
      rel="noopener noreferrer"
      class="ml-1 inline-flex items-center gap-0.5"
    >
      <ExternalLink class="h-3 w-3" />
    </a>
  </div>
  <div v-if="providerAlert" class="text-destructive">
    {{ t("ai.provider.alertTemplate", { thing: t("ai.apiKeyName." + providerAlert) }) }}
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { ExternalLink } from "lucide-vue-next";
const { t } = useI18n();

interface Props {
  provider?: string;
  settingPresence: Record<string, boolean>;
}
const props = defineProps<Props>();

const provider2ApiKey = {
  openai: "OPENAI_API_KEY",
  nijivoice: "NIJIVOICE_API_KEY",
  google: "GEMINI_API_KEY",
  gemini: "GEMINI_API_KEY",
  replicate: "REPLICATE_API_TOKEN",
  elevenlabs: "ELEVENLABS_API_KEY",
};

const providerWarnings = ["nijivoice"];

const providerWarning = computed(() => {
  return props.provider && providerWarnings.includes(props.provider);
});

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
  // return key;
  return false;
});
</script>
