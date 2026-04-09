<template>
  <Button variant="ghost" size="icon" class="h-9 w-9" @click="toggleTheme">
    <Sun class="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
    <Moon class="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    <span class="sr-only">{{ $t("theme.toggle") }}</span>
  </Button>
</template>

<script setup lang="ts">
import { Sun, Moon } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/composables/use_theme";

const { theme, setTheme } = useTheme();

const toggleTheme = () => {
  setTheme(theme.value === "dark" ? "light" : "dark");
};
</script>
