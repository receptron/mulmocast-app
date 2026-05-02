<template>
  <Card class="p-4">
    <h4 class="font-medium">{{ t("parameters.concurrencyParams.title") }}</h4>
    <div class="space-y-3">
      <p class="text-muted-foreground text-xs">
        {{ t("parameters.concurrencyParams.autoDetectNote") }}
      </p>
      <div class="space-y-4">
        <div>
          <Label>{{ t("parameters.concurrencyParams.imageMovie") }}</Label>
          <p class="text-muted-foreground mt-1 text-xs">
            {{ t("parameters.concurrencyParams.imageMovieDescription") }}
          </p>
          <Input
            :model-value="imageMovieValue"
            @update:model-value="handleImageMovieUpdate"
            type="number"
            min="1"
            step="1"
          />
        </div>
        <div>
          <Label>{{ t("parameters.concurrencyParams.audio") }}</Label>
          <p class="text-muted-foreground mt-1 text-xs">
            {{ t("parameters.concurrencyParams.audioDescription") }}
          </p>
          <Input :model-value="audioValue" @update:model-value="handleAudioUpdate" type="number" min="1" step="1" />
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Card, Label, Input } from "@/components/ui";
import type { MulmoImageParams, MulmoMovieParams, MulmoPresentationStyle } from "mulmocast/browser";
import { parseConcurrency } from "../../../../../shared/concurrency";

type AudioParams = MulmoPresentationStyle["audioParams"];

export type ConcurrencyUpdate = {
  imageParams?: MulmoImageParams;
  movieParams?: MulmoMovieParams;
  audioParams?: AudioParams;
};

const { t } = useI18n();

const props = defineProps<{
  imageParams?: MulmoImageParams;
  movieParams?: MulmoMovieParams;
  audioParams?: AudioParams;
}>();

// A single combined emit prevents the "second handler reads stale props" race
// when the parent rebuilds the whole presentation style on every update.
const emit = defineEmits<{
  update: [updates: ConcurrencyUpdate];
}>();

const imageMovieValue = computed(() => {
  const image = props.imageParams?.concurrency;
  const movie = props.movieParams?.concurrency;
  if (image !== undefined && movie !== undefined) return Math.min(image, movie);
  return image ?? movie ?? "";
});

const audioValue = computed(() => props.audioParams?.concurrency ?? "");

const handleImageMovieUpdate = (value: string | number) => {
  const concurrency = parseConcurrency(value);
  emit("update", {
    imageParams: { ...(props.imageParams ?? {}), concurrency },
    movieParams: { ...(props.movieParams ?? {}), concurrency },
  });
};

const handleAudioUpdate = (value: string | number) => {
  const concurrency = parseConcurrency(value);
  emit("update", {
    audioParams: { ...((props.audioParams ?? {}) as AudioParams), concurrency } as AudioParams,
  });
};
</script>
