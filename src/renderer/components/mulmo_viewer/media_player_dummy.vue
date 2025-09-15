<template>
  <div>
    <div v-if="videoWithAudioSource">
      <video
        :src="videoWithAudioSource"
        class="mx-auto h-auto max-h-[80vh] w-auto object-contain"
        :controls="controlsEnabled"
        ref="videoWithAudioRef"
      />
    </div>
    <div v-else-if="videoSource" class="relative inline-block">
      <video
        class="mx-auto h-auto max-h-[80vh] w-auto object-contain"
        :src="videoSource"
        ref="videoRef"
        :controls="controlsEnabled"
      />
      <audio :src="audioSource" ref="audioSyncRef" v-if="audioSource" @ended="handleAudioEnd" />
    </div>
    <div v-else-if="audioSource">
      <video
        class="mx-auto h-auto max-h-[80vh] w-auto object-contain"
        :src="audioSource"
        :poster="imageSource ?? mulmoImage"
        :controls="controlsEnabled"
        ref="audioRef"
      />
    </div>
    <div v-else-if="imageSource" class="relative inline-block">
      <img :src="imageSource" ref="imageRef" class="mx-auto h-auto max-h-[80vh] w-auto object-contain" />
    </div>
  </div>
</template>
<script setup lang="ts">
interface Props {
  videoWithAudioSource?: string;
  videoSource?: string;
  imageSource?: string;
  audioSource?: string;
}
const props = defineProps<Props>();
</script>
