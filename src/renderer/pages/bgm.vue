<template>
  <Layout>
    <div class="mx-auto max-w-7xl space-y-6 p-6">
      <!-- Header Section -->
      <div class="border-border bg-card rounded-lg border p-6 shadow-sm">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">{{ t("bgm.title") }}</h1>
            <p class="text-muted-foreground mt-1 text-sm">{{ t("bgm.description") }}</p>
          </div>
          <Button @click="openCreateDialog" class="flex items-center space-x-2">
            <Plus class="h-5 w-5" />
            <span>{{ t("bgm.createNew") }}</span>
          </Button>
        </div>

        <!-- BGM List -->
        <div v-if="bgmList.length === 0" class="py-16 text-center">
          <div class="space-y-4">
            <Music class="text-muted-foreground mx-auto h-16 w-16" />
            <h2 class="text-foreground text-xl font-semibold">{{ t("bgm.empty.title") }}</h2>
            <p class="text-muted-foreground">{{ t("bgm.empty.description") }}</p>
          </div>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="bgm in bgmList"
            :key="bgm.id"
            class="border-border hover:border-primary flex items-center justify-between rounded-lg border p-4 transition-colors"
          >
            <div class="flex flex-1 items-center space-x-4">
              <Button variant="ghost" size="icon" @click="togglePlay(bgm.id)">
                <Play v-if="!bgm.playing" class="h-5 w-5" />
                <Pause v-else class="h-5 w-5" />
              </Button>

              <div class="flex-1">
                <input
                  v-if="bgm.editing"
                  v-model="bgm.name"
                  @blur="saveNameEdit(bgm)"
                  @keyup.enter="saveNameEdit(bgm)"
                  class="bg-background border-border w-full rounded border px-2 py-1 text-sm"
                  type="text"
                />
                <div v-else class="flex items-center space-x-2">
                  <span class="font-medium">{{ bgm.name }}</span>
                  <Button variant="ghost" size="icon" class="h-6 w-6" @click="startNameEdit(bgm)">
                    <Pencil class="h-3 w-3" />
                  </Button>
                </div>
                <p class="text-muted-foreground text-xs">{{ formatDate(bgm.createdAt) }}</p>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <Badge variant="secondary" class="text-xs">{{ bgm.duration }}</Badge>
              <Button variant="ghost" size="icon" @click="deleteBgm(bgm.id)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create BGM Dialog -->
    <Dialog v-model:open="createDialog.open">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{ t("bgm.create.title") }}</DialogTitle>
          <DialogDescription>{{ t("bgm.create.description") }}</DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">{{ t("bgm.create.promptLabel") }}</label>
            <Textarea
              v-model="createDialog.prompt"
              :placeholder="t('bgm.create.promptPlaceholder')"
              class="min-h-[100px]"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">{{ t("bgm.create.durationLabel") }}</label>
            <Select v-model="createDialog.duration">
              <SelectTrigger>
                <SelectValue :placeholder="t('bgm.create.selectDuration')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30s">30{{ t("bgm.create.seconds") }}</SelectItem>
                <SelectItem value="60s">60{{ t("bgm.create.seconds") }}</SelectItem>
                <SelectItem value="120s">120{{ t("bgm.create.seconds") }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="createDialog.open = false">{{ t("ui.actions.cancel") }}</Button>
          <Button @click="generateBgm" :disabled="createDialog.generating || !createDialog.prompt">
            <span v-if="!createDialog.generating">{{ t("ui.actions.generate") }}</span>
            <span v-else class="flex items-center space-x-2">
              <span>{{ t("ui.actions.generating") }}</span>
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Plus, Music, Play, Pause, Pencil, Trash2 } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import dayjs from "dayjs";

import Layout from "@/components/layout.vue";
import { Button, Badge, Textarea } from "@/components/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const { t } = useI18n();

interface BgmItem {
  id: string;
  name: string;
  createdAt: string;
  duration: string;
  playing: boolean;
  editing: boolean;
}

const bgmList = ref<BgmItem[]>([]);

const createDialog = ref({
  open: false,
  prompt: "",
  duration: "60s",
  generating: false,
});

// Mock data for demonstration
const loadBgmList = async () => {
  // This will be replaced with actual API call
  bgmList.value = [
    {
      id: "1",
      name: "Upbeat Background Music",
      createdAt: new Date().toISOString(),
      duration: "60s",
      playing: false,
      editing: false,
    },
    {
      id: "2",
      name: "Calm Piano Melody",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      duration: "120s",
      playing: false,
      editing: false,
    },
  ];
};

const openCreateDialog = () => {
  createDialog.value = {
    open: true,
    prompt: "",
    duration: "60s",
    generating: false,
  };
};

const generateBgm = async () => {
  createDialog.value.generating = true;

  // Mock generation - will be replaced with actual API call
  setTimeout(() => {
    const newBgm: BgmItem = {
      id: Date.now().toString(),
      name: createDialog.value.prompt.substring(0, 30) + (createDialog.value.prompt.length > 30 ? "..." : ""),
      createdAt: new Date().toISOString(),
      duration: createDialog.value.duration,
      playing: false,
      editing: false,
    };

    bgmList.value.unshift(newBgm);
    createDialog.value.open = false;
    createDialog.value.generating = false;
  }, 2000);
};

const togglePlay = (id: string) => {
  // Mock play/pause - will be replaced with actual audio playback
  bgmList.value.forEach((bgm) => {
    if (bgm.id === id) {
      bgm.playing = !bgm.playing;
    } else {
      bgm.playing = false;
    }
  });
};

const startNameEdit = (bgm: BgmItem) => {
  bgm.editing = true;
};

const saveNameEdit = (bgm: BgmItem) => {
  bgm.editing = false;
  // This will be replaced with actual API call to save name
};

const deleteBgm = async (id: string) => {
  // This will be replaced with actual API call
  bgmList.value = bgmList.value.filter((bgm) => bgm.id !== id);
};

const formatDate = (dateString: string) => {
  return dayjs(dateString).format("YYYY/MM/DD HH:mm");
};

onMounted(() => {
  loadBgmList();
});
</script>
