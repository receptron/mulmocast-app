<template>
  <Dialog :open="modalStore.isOpenApiKeyModal" @update:open="onUpdateOpen">
    <DialogContent class="flex max-w-lg flex-col" :hide-close="isSaving">
      <DialogHeader class="flex-shrink-0">
        <DialogTitle class="text-center text-2xl font-bold">
          {{ t("settings.apiKeys.title") }}
        </DialogTitle>
        <DialogDescription class="text-muted-foreground text-center">
          {{ t("settings.apiKeys.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 space-y-6 overflow-y-auto p-1">
        <Card v-if="targetKey">
          <CardContent>
            <ApiKeyInput
              v-if="targetKey"
              :key="targetKey"
              :env-key="targetKey"
              :config="ENV_KEYS[targetKey]"
              :api-key="apiKey"
              :show-key="showKey"
              @update:api-key="(value) => (apiKey = value)"
              @update:show-key="(value) => (showKey = value)"
            />
          </CardContent>
        </Card>

        <div
          v-if="errorMessage"
          class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-400"
        >
          <AlertCircle class="h-4 w-4 flex-shrink-0" />
          <span class="text-sm">{{ errorMessage }}</span>
        </div>
      </div>

      <DialogFooter class="flex flex-shrink-0 justify-between border-t pt-4">
        <Button variant="outline" :disabled="isSaving" @click="handleCancel">
          {{ t("ui.actions.cancel") }}
        </Button>
        <Button :disabled="!canSave || isSaving" @click="handleSave">
          <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("ui.actions.update") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Loader2, AlertCircle } from "lucide-vue-next";

import { Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import ApiKeyInput from "@/components/api_key_input.vue";

import { notifySuccess, notifyError } from "@/lib/notification";
import { ENV_KEYS } from "../../shared/constants";
import { useMulmoGlobalStore, useModalStore } from "@/store";

const { t } = useI18n();
const globalStore = useMulmoGlobalStore();
const modalStore = useModalStore();

const isSaving = ref(false);
const errorMessage = ref("");
const apiKey = ref("");
const showKey = ref(false);

const targetKey = computed(() => modalStore.apiKeyModalTarget);

watch(
  () => targetKey.value,
  async (newKey) => {
    errorMessage.value = "";
    showKey.value = false;
    apiKey.value = "";
    if (!newKey) return;
    try {
      const settings = await window.electronAPI.settings.get();
      apiKey.value = settings[newKey] ?? settings.APIKEY?.[newKey] ?? "";
    } catch (e) {
      console.error(e);
    }
  },
  { immediate: true },
);

const canSave = computed(() => {
  return !!apiKey.value.trim();
});

const handleCancel = () => {
  modalStore.hideApiKeyModal();
};

const handleSave = async () => {
  if (!targetKey.value) return;
  if (!canSave.value) {
    errorMessage.value = t("onboarding.errors.requiredApiKey");
    return;
  }

  isSaving.value = true;
  errorMessage.value = "";

  try {
    const settings = await window.electronAPI.settings.get();
    const newSettings = {
      ...settings,
      [targetKey.value]: apiKey.value,
      APIKEY: {
        ...(settings.APIKEY ?? {}),
        [targetKey.value]: apiKey.value,
      },
    } as const;
    await window.electronAPI.settings.set(newSettings);
    globalStore.updateSettings(newSettings);
    notifySuccess(t("settings.notifications.success"));
    modalStore.hideApiKeyModal();
  } catch (error) {
    console.error("Failed to save api key:", error);
    errorMessage.value = t("onboarding.errors.saveFailed");
    notifyError(t("ui.status.error"), t("onboarding.errors.saveFailed"));
  } finally {
    isSaving.value = false;
  }
};

const onUpdateOpen = (open: boolean) => {
  if (!open) handleCancel();
};
</script>
