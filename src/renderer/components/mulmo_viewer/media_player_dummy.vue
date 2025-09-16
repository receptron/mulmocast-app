<template>
  <div>
    <div v-if="videoWithAudioSource">
      <video :src="videoWithAudioSource" class="mx-auto h-auto max-h-[80vh] w-auto object-contain" />
    </div>
    <div v-else-if="videoSource" class="relative inline-block">
      <video class="mx-auto h-auto max-h-[80vh] w-auto object-contain" :src="videoSource" />
      <audio :src="audioSource" v-if="audioSource" />
    </div>
    <div v-else-if="audioSource">
      <video
        class="mx-auto h-auto max-h-[80vh] w-auto object-contain"
        :src="audioSource"
        :poster="imageSource ?? mulmoImage"
      />
    </div>
    <div v-else-if="imageSource" class="relative inline-block">
      <img :src="imageSource" class="mx-auto h-auto max-h-[80vh] w-auto object-contain" />
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
defineProps<Props>();
</script>
