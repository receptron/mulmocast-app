<template>
  <div
    v-if="mulmoError && mulmoError.length > 0"
    class="w-full p-2 border border-red-500 bg-red-100 text-red-800 rounded text-sm mt-2"
  >
    <div v-for="(message, key) in mulmoError" :key="key">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  mulmoError: string[];
}>();
</script>
