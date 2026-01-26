<template>
  <div class="template-dropdown-container flex items-center gap-4">
    <Select v-model="selectedBeat">
      <SelectTrigger class="w-auto">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="(template, k) in isPro ? beatTemplates : simpleTemplates" :key="k" :value="k">
          {{ t("beat." + template.key + ".label") }}
        </SelectItem>
      </SelectContent>
    </Select>
    <Button size="sm" @click="emitBeat" :disabled="disableChange"> {{ t("ui.actions." + buttonKey) }} </Button>
    <slot />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ref } from "vue";
import { beatTemplates, simpleTemplates } from "../../../../shared/beat_data";
import { useI18n } from "vue-i18n";

interface Props {
  buttonKey: string;
  currentBeatType?: string;
  isPro: boolean;
}
const props = defineProps<Props>();

const { t } = useI18n();

const emit = defineEmits(["emitBeat"]);
const selectedBeat = ref(0);

const templates = computed(() => {
  return props.isPro ? beatTemplates : simpleTemplates;
});
const initSelectedBeat = () => {
  if (props.currentBeatType) {
    const index = templates.value.findIndex((beat) => beat.key === props.currentBeatType);
    if (index !== -1) {
      selectedBeat.value = index;
      return;
    }
  }
  selectedBeat.value = 0;
};

onMounted(() => {
  initSelectedBeat();
});

watch([() => props.currentBeatType, templates], () => {
  initSelectedBeat();
});

const disableChange = computed(() => {
  return (
    props.buttonKey === "change" &&
    props.currentBeatType &&
    props.currentBeatType === templates.value[selectedBeat.value]?.key
  );
});

const emitBeat = () => {
  const template = templates.value[selectedBeat.value];
  const beat = { ...template.beat };
  emit("emitBeat", beat);
};
</script>
