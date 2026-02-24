<template>
  <div class="bg-muted rounded-lg p-4">
    <div class="mb-2 flex items-center justify-between">
      <h3 class="text-sm font-medium">{{ t("project.menu.debugLog") }}</h3>
      <Button
        @click="copyDebugLogs"
        size="sm"
        variant="outline"
        :disabled="!debugLog || debugLog.length === 0"
        class="gap-2"
      >
        <Copy class="h-3 w-3" />
        {{ t("ui.actions.copy") }}
      </Button>
    </div>
    <div
      class="border-border bg-card h-40 overflow-y-auto rounded border p-2 font-mono text-xs"
      ref="logContainer"
      v-if="false"
    >
      <div v-for="(entry, i) in debugLog" :key="'debug-' + i" class="whitespace-pre-wrap">
        {{ entry }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useGraphAIDebugLogStore } from "@/store";
import { Button } from "@/components/ui";
import { Copy } from "lucide-vue-next";
import { notifySuccess, notifyError } from "@/lib/notification";

const { t } = useI18n();
const route = useRoute();
const projectId = computed(() => route.params.id as string);

const graphAIDebugStore = useGraphAIDebugLogStore();
const logContainer = ref<HTMLElement | null>(null);

// for debug
const debugLog = computed(() => graphAIDebugStore.graphaiDebugLog[projectId.value]);

watch(
  () => debugLog,
  () => {
    logContainer.value?.scrollTo({ top: logContainer.value.scrollHeight });
  },
  { deep: true },
);

// Copy debug logs to clipboard
const copyDebugLogs = async () => {
  if (!debugLog.value || debugLog.value.length === 0) return;

  const logsText = debugLog.value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }
      return JSON.stringify(item, null, 2);
    })
    .join("\n");

  try {
    await window.electronAPI.writeClipboardText(logsText);
    notifySuccess(t("settings.notifications.copiedToClipboard"));
  } catch (error) {
    console.error("Failed to copy debug logs:", error);
    notifyError(t("settings.notifications.copyFailed"));
  }
};
</script>
