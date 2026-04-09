<template>
  <div class="space-y-2 border-b pb-4 last:border-b-0">
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
        v-model="apiKey"
        :type="showKey ? 'text' : 'password'"
        :placeholder="config.placeholder"
        class="flex-1"
      />
      <Button variant="outline" size="icon" @click="showKey = !showKey">
        <Eye v-if="!showKey" class="h-4 w-4" />
        <EyeOff v-else class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Eye, EyeOff, ExternalLink } from "@lucide/vue";

import { Button, Input, Label } from "@/components/ui";

type Props = {
  envKey: string;
  config: {
    url?: string;
    placeholder?: string;
    features?: string[];
  };
  apiKey: string;
  showKey: boolean;
};

type Emits = {
  "update:apiKey": [value: string];
  "update:showKey": [value: boolean];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

const apiKey = computed({
  get: () => props.apiKey,
  set: (value: string) => emit("update:apiKey", value),
});

const showKey = computed({
  get: () => props.showKey,
  set: (value: boolean) => emit("update:showKey", value),
});
</script>
