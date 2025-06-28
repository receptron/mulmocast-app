<template>
  <Toaster richColors />
  <div>
    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from "vue";
import { useStore } from "./store";
import { Toaster } from "@/components/ui/sonner";
import "vue-sonner/style.css";

import { notifyError } from "@/lib/notification";

export default defineComponent({
  components: {
    Toaster,
  },
  setup() {
    const store = useStore();

    onMounted(() => {
      window.electronAPI.onProgress(async (event, message) => {
        if (message.type === "mulmo") {
          store.mulmoLogCallback(message);
        }
        if (message.type === "graphai") {
          store.graphaiLogCallback(message);
        }
        if (message.type === "error") {
          if (typeof message.data?.message) {
            notifyError("Error", message.data.message);
          }
        }

        if (message.type === "zod_error") {
          console.log("FFF", message);
          store.zodErrorLogCallback(message);
        }
      });
    });
  },
});
</script>
