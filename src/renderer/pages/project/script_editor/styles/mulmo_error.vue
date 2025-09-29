<template>
  <div
    v-if="mulmoError && mulmoError.length > 0"
    class="border-destructive bg-destructive/10 text-destructive mt-2 w-full rounded border p-2 text-sm"
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
