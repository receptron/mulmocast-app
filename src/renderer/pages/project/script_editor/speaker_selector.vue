<template>
  <div class="template-dropdown-container flex items-center gap-4">
    <div class="group relative ml-5">
      <Select v-model="selectedSpeaker">
        <SelectTrigger class="w-auto">
          <SelectValue :placeholder="t('beat.speaker.selectSpeaker')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="(_speaker, name) in speakers" :key="name" :value="name">
            {{ name }}
          </SelectItem>
        </SelectContent>
      </Select>
      <span
        class="bg-popover text-popover-foreground border-border pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded border px-2 py-1 text-xs whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      >
        <div>{{ t("beat.speaker.tooltipTitle", { speakerLabel: t("beat.speaker.label") }) }}</div>
        <div class="text-muted-foreground">
          {{ t("beat.speaker.tooltipDescription", { tab: "Style" }) }}
        </div>
        <div class="text-muted-foreground">
          {{ t("beat.speaker.tooltipNote") }}
        </div>
      </span>
    </div>
    <div v-if="false">
      <Button size="sm" @click="emitSpeaker" :disabled="disableChange"> {{ t("ui.actions.change") }} </Button>
      <Button size="sm" @click="cancel"> {{ t("ui.actions.cancel") }} </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import type { MulmoPresentationStyle } from "mulmocast/browser";

const props = defineProps<{
  currentSpeaker?: string;
  speakers?: MulmoPresentationStyle["speechParams"]["speakers"];
}>();

const { t } = useI18n();

const emit = defineEmits(["emitSpeaker", "cancel"]);
const selectedSpeaker = ref(props.currentSpeaker);

const disableChange = computed(() => {
  return props.currentSpeaker && props.currentSpeaker === selectedSpeaker.value;
});

watch(selectedSpeaker, () => {
  emitSpeaker();
});

const emitSpeaker = () => {
  if (selectedSpeaker.value) {
    emit("emitSpeaker", selectedSpeaker.value);
  }
};

const cancel = () => {
  emit("cancel");
};
</script>
