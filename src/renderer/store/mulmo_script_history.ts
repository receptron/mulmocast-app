import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { MulmoScript } from "mulmocast";
import cloneDeep from "clone-deep";
import deepEqual from "deep-equal";

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
  };
});
