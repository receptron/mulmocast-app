<template>
  <header class="border-border bg-card relative border-b px-6 py-4 transition-colors duration-200">
    <div class="mx-auto flex items-center justify-between">
      <!-- Logo/Brand -->
      <RouterLink to="/">
        <h1 class="text-foreground hover:text-primary cursor-pointer text-2xl font-bold transition-colors duration-200">
          {{ t("ui.common.applicationName") }}
        </h1>
      </RouterLink>

      <!-- Navigation -->
      <div class="flex items-center space-x-3">
        <!-- Status indicators -->
        <div
          v-if="mulmoEventStore.generatingProjectCount > 0"
          class="flex items-center space-x-1"
          data-testid="generating-indicator"
        >
          <Activity :size="16" class="text-green-500 dark:text-green-400" />
          <Badge variant="secondary" class="text-xs" data-testid="generating-count-badge">
            {{ mulmoEventStore.generatingProjectCount }} {{ t("ui.actions.generating") }}
          </Badge>
        </div>

        <!-- TODO: Add error indicator -->
        <!-- <div class="flex items-center space-x-1">
          <AlertTriangle :size="16" class="text-destructive" />
          <Badge variant="destructive" class="text-xs"> Errors </Badge>
        </div> -->

        <!-- Dashboard Button - Always visible -->
        <RouterLink :to="dashboardItem.path">
          <Button
            :variant="isDashboardActive ? 'default' : 'ghost'"
            size="sm"
            class="relative transition-transform duration-200 hover:scale-105"
            data-testid="dashboard-button"
          >
            <component :is="dashboardItem.icon" :size="16" class="mr-1" />
            {{ t("menu." + dashboardItem.key) }}
          </Button>
        </RouterLink>

        <!-- Settings Button -->
        <Button
          variant="ghost"
          size="sm"
          class="relative transition-transform duration-200 hover:scale-105"
          data-testid="settings-button"
          @click="globalStore.toggleSettingModal"
        >
          <Settings :size="16" class="mr-1" />
          {{ t("menu.settings") }}
        </Button>

        <!-- Theme Toggle -->
        <!-- ThemeToggle /-->
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { Home, Settings, Activity } from "lucide-vue-next";
import { useI18n } from "vue-i18n";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMulmoEventStore, useMulmoGlobalStore } from "@/store";
// import ThemeToggle from "@/components/theme_toggle.vue";

const route = useRoute();
const { t } = useI18n();

const globalStore = useMulmoGlobalStore();
const mulmoEventStore = useMulmoEventStore();

const dashboardItem = { path: "/", icon: Home, key: "top" };

const isDashboardActive = computed(() => route.path === dashboardItem.path);
</script>
