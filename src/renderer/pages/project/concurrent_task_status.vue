<template>
  <span>{{ generatingMessage }}</span>
</template>

<script setup lang="ts">
interface Props {
  generatingMessage: string;
}
defineProps<Props>();
</script>
