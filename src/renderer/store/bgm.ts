import { defineStore } from "pinia";
import { ref } from "vue";

interface GeneratingBgm {
  tempId: string;
  title: string;
  prompt: string;
  duration: string;
  startedAt: string;
}

export const useBgmStore = defineStore("bgm", () => {
  const generatingBgms = ref<GeneratingBgm[]>([]);

  const addGeneratingBgm = (bgm: GeneratingBgm) => {
    generatingBgms.value.push(bgm);
  };

  const removeGeneratingBgm = (tempId: string) => {
    generatingBgms.value = generatingBgms.value.filter((bgm) => bgm.tempId !== tempId);
  };

  const clearGeneratingBgms = () => {
    generatingBgms.value = [];
  };

  return {
    generatingBgms,
    addGeneratingBgm,
    removeGeneratingBgm,
    clearGeneratingBgms,
  };
});
