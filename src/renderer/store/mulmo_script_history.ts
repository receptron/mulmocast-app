import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { type MulmoScript, mulmoScriptSchema } from "mulmocast/browser";
import cloneDeep from "clone-deep";
import deepEqual from "deep-equal";
import { MulmoError } from "@/types";
import { zodError2MulmoError } from "../lib/error";

export const useMulmoScriptHistoryStore = defineStore("mulmoScriptHistory", () => {
  const index = ref(0);
  const histories = ref<{ data: MulmoScript; name: string }[]>([]);
  const currentMulmoScript = ref<MulmoScript | null>(null);

  const updateMulmoScript = (data: MulmoScript) => {
    currentMulmoScript.value = data;
  };

  const initMulmoScript = (data: MulmoScript, lang: string) => {
    if (!data.lang) {
      data.lang = lang;
    }
    currentMulmoScript.value = data;
    index.value = 0;
    pushDataToHistory("init", data);
  };

  const resetMulmoScript = () => {
    currentMulmoScript.value = null;
    index.value = 0;
    histories.value = [];
  };

  const updateMulmoScriptAndPushToHistory = (data: MulmoScript) => {
    currentMulmoScript.value = data;
    pushDataToHistory("push", data);
  };

  const pushDataToHistory = (name: string, data: MulmoScript) => {
    if (index.value > 0 && deepEqual(histories.value[index.value - 1].data, data)) {
      console.log("equal");
      return;
    }
    console.log("push history");
    histories.value.length = index.value;
    histories.value.push({ data: cloneDeep(data), name });
    index.value = index.value + 1;
  };

  const undoable = computed(() => {
    return index.value > 1;
  });

  const undo = () => {
    if (undoable.value) {
      console.log("UNDO");
      currentMulmoScript.value = histories.value[index.value - 2].data;
      index.value = index.value - 1;
    }
  };

  const redoable = computed(() => {
    return index.value < histories.value.length;
  });

  const redo = () => {
    if (redoable.value) {
      console.log("REDO");
      currentMulmoScript.value = histories.value[index.value].data;
      index.value = index.value + 1;
    }
  };

  const lang = computed(() => {
    return currentMulmoScript.value?.lang ?? "en";
  });

  // internal
  const zodError = computed(() => {
    return mulmoScriptSchema.safeParse(currentMulmoScript.value ?? {});
  });

  const mulmoError = computed<MulmoError>(() => {
    if (!zodError.value.success) {
      console.log(zodError.value.error);
      return zodError2MulmoError(zodError.value.error);
    }
    return null;
  });
  const isValidScript = computed(() => {
    return zodError.value.success;
  });
  const hasBeatSchemaError = computed(() => {
    if (!zodError.value.success) {
      return zodError?.value?.error.issues.some((error) => {
        return error.path[0] === "beats";
      });
    }
    return false;
  });

  return {
    currentMulmoScript,
    initMulmoScript,
    updateMulmoScript,
    updateMulmoScriptAndPushToHistory,
    undoable,
    undo,
    redoable,
    redo,
    resetMulmoScript,
    lang,

    mulmoError,
    isValidScript,
    hasBeatSchemaError,
  };
});
