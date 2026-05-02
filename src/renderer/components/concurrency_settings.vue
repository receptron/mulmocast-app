<template>
  <Card>
    <Collapsible v-model:open="isExpanded">
      <CardHeader>
        <CollapsibleTrigger class="w-full">
          <div class="flex items-center justify-between">
            <CardTitle class="cursor-pointer">{{ t("settings.concurrency.title") }}</CardTitle>
            <ChevronDown :class="['h-4 w-4 transition-transform', isExpanded && 'rotate-180']" />
          </div>
          <CardDescription class="mt-2 text-left">
            {{ t("settings.concurrency.description") }}
          </CardDescription>
        </CollapsibleTrigger>
      </CardHeader>
      <CollapsibleContent>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label>{{ t("settings.concurrency.imageMovie") }}</Label>
            <p class="text-muted-foreground text-xs">
              {{ t("settings.concurrency.imageMovieDescription") }}
            </p>
            <Input
              :model-value="imageMovieValue"
              @update:model-value="(value) => updateField('imageMovie', value)"
              type="number"
              min="1"
              step="1"
              :placeholder="t('settings.concurrency.placeholder')"
            />
          </div>
          <div class="space-y-2">
            <Label>{{ t("settings.concurrency.audio") }}</Label>
            <p class="text-muted-foreground text-xs">
              {{ t("settings.concurrency.audioDescription") }}
            </p>
            <Input
              :model-value="audioValue"
              @update:model-value="(value) => updateField('audio', value)"
              type="number"
              min="1"
              step="1"
              :placeholder="t('settings.concurrency.placeholder')"
            />
          </div>
        </CardContent>
      </CollapsibleContent>
    </Collapsible>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { ChevronDown } from "@lucide/vue";

import { Input, Label } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import type { ConcurrencyConfig } from "../../types/index";
import { parseConcurrency } from "../../shared/concurrency";

type Props = {
  config: ConcurrencyConfig;
};

type Emits = {
  "update:config": [value: ConcurrencyConfig];
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

const isExpanded = ref(false);

const imageMovieValue = computed(() => props.config?.imageMovie ?? "");
const audioValue = computed(() => props.config?.audio ?? "");

const updateField = (field: keyof ConcurrencyConfig, value: string | number) => {
  emit("update:config", {
    ...props.config,
    [field]: parseConcurrency(value),
  });
};
</script>
