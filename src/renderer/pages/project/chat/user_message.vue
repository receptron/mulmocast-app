<template>
  <div class="flex flex-row-reverse items-start space-x-3 space-x-reverse">
    <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 dark:bg-blue-500/30">
      <User :size="16" class="text-blue-600 dark:text-blue-400" />
    </div>
    <div class="flex-1 text-right">
      <div
        class="text-foreground inline-block max-w-md rounded-lg bg-blue-500/20 p-3 break-words whitespace-pre-wrap dark:bg-blue-500/30 text-left"
      >
        <p class="text-sm">{{ message }}</p>
      </div>
      <div class="text-muted-foreground mt-1 flex items-center justify-end space-x-1 text-xs">
        <span>{{ formatedTime }}</span>
        <button @click="editUser" class="text-muted-foreground hover:text-foreground transition-colors duration-150">
          <Edit :size="16" class="ml-2" />
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { User, Edit } from "lucide-vue-next";

import { useFormatedDate } from "./date_format";

const props = defineProps<{
  message: string;
  time?: number;
}>();
const emit = defineEmits(["editUser"]);

const { formatedTime } = useFormatedDate(props.time ?? Date.now(), "L LT");

const editUser = () => {
  emit("editUser");
};
</script>
