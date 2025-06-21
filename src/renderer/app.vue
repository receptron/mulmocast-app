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
          console.log(message);
        }
      });
    });
  },
});
</script>
