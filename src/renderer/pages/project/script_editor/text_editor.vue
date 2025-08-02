<template>
  <div class="flex items-center justify-between font-bold text-gray-700">
    <span>Beat {{ index + 1 }}</span>
    <Badge variant="outline">{{ t("beat.badge." + getBadge(beat)) }}</Badge>
  </div>
  <div>
    <Label>Speaker</Label>
    <Input
      :model-value="beat?.speaker"
      @update:model-value="(value) => update(index, 'speaker', String(value))"
      placeholder="e.g. Alice"
      class="h-8"
    />
  </div>
  <div>
    <Label>Text</Label>
    <Input
      :model-value="beat.text"
      @update:model-value="(value) => update(index, 'text', String(value))"
      placeholder="e.g. What is AI?"
      class="h-8"
    />
  </div>

  <div v-for="(lang, key) in languages" :key="key">
    <!-- WIP {{ lang }} -->
  </div>
  <Button variant="outline" size="sm" @click="generateAudio(index)" class="w-fit">generate audio</Button>
  <span v-if="mulmoEventStore.sessionState?.[projectId]?.['beat']?.['audio']?.[index]">generating</span>
  <audio :src="audioFile" v-if="!!audioFile" controls />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { type MulmoBeat } from "mulmocast/browser";

import { Button, Label, Input, Badge } from "@/components/ui";
import { getBadge } from "@/lib/beat_util.js";

import { useMulmoEventStore, useMulmoGlobalStore } from "../../../store";
import { notifyProgress } from "@/lib/notification";
import { getConcurrentTaskStatusMessageComponent } from "../concurrent_task_status_message";

const { t } = useI18n();
const mulmoEventStore = useMulmoEventStore();
const globalStore = useMulmoGlobalStore();

interface Props {
  index: number;
  beat: MulmoBeat;
  audioFile?: string;
  projectId: string;
}
const props = defineProps<Props>();

const emit = defineEmits(["update"]);

const languages = computed(() => {
  const data = (globalStore.settings ?? {})?.USE_LANGUAGES ?? {};
  return Object.keys(data).reduce((tmp, current) => {
    if (data[current]) {
      tmp.push(current);
    }
    return tmp;
  }, []);
});

const update = (index: number, path: string, value: unknown) => {
  emit("update", index, path, value);
};

const ConcurrentTaskStatusMessageComponent = getConcurrentTaskStatusMessageComponent(props.projectId);

const generateAudio = async (index: number) => {
  notifyProgress(window.electronAPI.mulmoHandler("mulmoAudioGenerate", props.projectId, index), {
    loadingMessage: ConcurrentTaskStatusMessageComponent,
    successMessage: "Audio generated successfully",
    errorMessage: "Failed to generate audio",
  });
};
</script>
