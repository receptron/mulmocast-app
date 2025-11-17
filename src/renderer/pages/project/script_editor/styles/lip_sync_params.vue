<template>
  <Card class="p-4">
    <h4 class="font-medium">{{ t("parameters.lipSyncParams.title") }}</h4>
    <div class="space-y-3">
      <div>
        <Label>{{ t("ui.common.provider") }}</Label>
        <Select :model-value="lipSyncParams?.provider" @update:model-value="handleProviderChange">
          <SelectTrigger>
            <SelectValue :placeholder="t('parameters.lipSyncParams.providerNone')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__undefined__">{{ t("parameters.lipSyncParams.providerNone") }}</SelectItem>
            <SelectItem v-for="provider in PROVIDERS" :key="provider.value" :value="provider.value">
              {{ t("ai.provider." + provider.name + ".name") }}
            </SelectItem>
          </SelectContent>
        </Select>
        <SettingsAlert class="mt-2" :settingPresence="settingPresence" :provider="lipSyncParams?.provider" />
      </div>
      <div v-if="lipSyncParams?.provider">
        <Label>{{ t("ui.common.model") }}</Label>
        <Select
          :model-value="currentParams.model"
          @update:model-value="handleModelChange"
          :disabled="!lipSyncParams?.provider"
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="model in PROVIDERS.find((p) => p.value === lipSyncParams?.provider)?.models || []"
              :key="model"
              :value="model"
            >
              {{ model }}
            </SelectItem>
          </SelectContent>
        </Select>
        <div v-if="modelDescription" class="text-muted-foreground mt-2 text-sm">
          {{ modelDescription }}
        </div>
      </div>
      <MulmoError :mulmoError="mulmoError" />
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Card, Label } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MulmoError from "./mulmo_error.vue";
import SettingsAlert from "../settings_alert.vue";
import { provider2LipSyncAgent, defaultProviders, type MulmoPresentationStyle } from "mulmocast/browser";
import { getLipSyncModelDescription } from "../lip_sync_utils";

type LipSyncParams = MulmoPresentationStyle["lipSyncParams"];

const PROVIDERS = Object.entries(provider2LipSyncAgent)
  .filter(([provider, __]) => {
    return provider !== "mock";
  })
  .map(([provider, agent]) => {
    return {
      name: provider,
      value: provider,
      models: agent.models,
    };
  });

const { t } = useI18n();

const props = defineProps<{
  lipSyncParams?: LipSyncParams;
  mulmoError: string[];
  settingPresence: Record<string, boolean>;
}>();

const emit = defineEmits<{
  update: [lipSyncParams: LipSyncParams];
}>();

const DEFAULT_VALUES = computed((): LipSyncParams => {
  const defaultProvider = defaultProviders.lipSync as keyof typeof provider2LipSyncAgent;
  const agentInfo = provider2LipSyncAgent[defaultProvider];
  return {
    provider: defaultProvider,
    model: agentInfo?.defaultModel,
  };
});

const currentParams = computed((): LipSyncParams => {
  const provider = (props.lipSyncParams?.provider || DEFAULT_VALUES.value.provider) as keyof typeof provider2LipSyncAgent;
  const agentInfo = provider2LipSyncAgent[provider];
  return {
    provider,
    model: props.lipSyncParams?.model || agentInfo?.defaultModel,
  };
});

const modelDescription = computed(() => {
  return getLipSyncModelDescription(currentParams.value.provider, currentParams.value.model, t);
});

const updateParams = (partial: Partial<LipSyncParams>) => {
  const params = {
    ...currentParams.value,
    ...partial,
  };
  emit("update", params);
};

const handleProviderChange = (value: LipSyncParams["provider"]) => {
  updateParams({ provider: value == "__undefined__" ? undefined : value, model: undefined });
};

const handleModelChange = (value: LipSyncParams["model"]) => {
  updateParams({ model: value });
};
</script>
