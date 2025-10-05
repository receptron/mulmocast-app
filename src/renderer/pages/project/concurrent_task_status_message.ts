import { defineComponent, h, markRaw, type ComputedRef } from "vue";
import ConcurrentTaskStatus from "./concurrent_task_status.vue";

export const getConcurrentTaskStatusMessageComponent = (projectId: string, generatingMessage: ComputedRef<string>) => {
  return markRaw(
    defineComponent({
      setup() {
        return () => h(ConcurrentTaskStatus, { projectId, generatingMessage: generatingMessage.value });
      },
    }),
  );
};
