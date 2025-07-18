<template>
  <div>
    <!-- View Mode Toggle -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium">View:</span>
        <div class="flex border rounded-lg">
          <Button
            :variant="viewMode === 'list' ? 'default' : 'ghost'"
            size="sm"
            @click="$emit('update:viewMode', 'list')"
            class="rounded-r-none"
          >
            <List :size="16" class="mr-1" />
            List
          </Button>
          <Button
            :variant="viewMode === 'timeline' ? 'default' : 'ghost'"
            size="sm"
            @click="$emit('update:viewMode', 'timeline')"
            class="rounded-l-none"
          >
            <Calendar :size="16" class="mr-1" />
            Timeline
          </Button>
        </div>
      </div>
      <div class="text-sm text-gray-500">
        Total duration: {{ beatsData[beatsData.length - 1]?.timestamp || "00:00" }}
      </div>
    </div>

    <!-- Scrollable Content -->
    <ScrollArea class="max-h-[600px] w-full rounded-md border p-4 overflow-auto">
      <!-- List View -->
      <div v-if="viewMode === 'list'" class="space-y-4">
        <div v-for="(beat, index) in beatsData" :key="beat.id" class="border-b border-gray-200 p-3 last:border-b-0">
          <div class="grid gap-4 items-start" style="grid-template-columns: 80px 80px 1fr">
            <!-- Image Status -->
            <div class="text-center">
              <div class="flex items-center justify-center gap-1 mb-1">
                <FileImage
                  :size="16"
                  :class="`${beat?.image?.status === 'ready' ? 'text-green-500' : 'text-gray-400'}`"
                />
                <Loader2 v-if="beat?.image?.status === 'generating'" :size="12" class="animate-spin text-blue-500" />
              </div>
              <p :class="`text-xs mb-2 ${beat?.image?.status === 'ready' ? 'text-green-600' : 'text-gray-500'}`">
                {{ beat?.image?.status === "ready" ? "Image ready" : "Generating..." }}
                <audio :src="audioFiles[index]" v-if="!!audioFiles[index]" controls />
              </p>
              <div v-if="beat?.image?.status === 'ready'" class="flex justify-center space-x-1">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button size="sm" variant="ghost" class="w-6 h-6 p-0">
                      <Eye :size="12" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Preview</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button size="sm" variant="ghost" class="w-6 h-6 p-0">
                      <RefreshCw :size="12" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Regenerate</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <!-- Audio Status -->
            <div class="text-center">
              <div class="flex items-center justify-center gap-1 mb-1">
                <Volume2
                  :size="16"
                  :class="`${beat?.audio?.status === 'ready' ? 'text-green-500' : 'text-gray-400'}`"
                />
                <Loader2 v-if="beat?.audio?.status === 'generating'" :size="12" class="animate-spin text-blue-500" />
              </div>
              <p :class="`text-xs mb-2 ${beat?.audio?.status === 'ready' ? 'text-green-600' : 'text-gray-500'}`">
                {{ beat?.audio?.status === "ready" ? "Audio ready" : "Generating..." }}
              </p>
              <div v-if="beat?.audio?.status === 'ready'" class="flex justify-center space-x-1">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button size="sm" variant="ghost" class="w-6 h-6 p-0">
                      <Play :size="12" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Play</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button size="sm" variant="ghost" class="w-6 h-6 p-0">
                      <RefreshCw :size="12" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Regenerate</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <!-- Beat Content -->
            <div>
              <div class="flex items-center gap-2 mb-2">
                <Badge variant="outline" class="text-xs"> Beat {{ index + 1 }} </Badge>
                <span class="text-xs text-gray-500">
                  {{ beat.timestamp }}
                </span>
                <span class="text-xs font-medium text-blue-600">
                  {{ beat.speaker }}
                </span>
              </div>
              <p class="text-sm text-gray-800">
                {{ beat.text }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline View -->
      <div v-else class="space-y-6">
        <!-- Preview Area - Only shown when timeline is clicked -->
        <div v-if="isPreviewAreaVisible" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Image/Media Preview -->
          <div class="space-y-4">
            <div
              class="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
            >
              <div v-if="beatsData[currentBeatIndex]?.image.status === 'ready'" class="text-center">
                <FileImage :size="64" class="text-gray-400 mx-auto mb-2" />
                <p class="text-sm text-gray-600">Image Preview</p>
                <p class="text-xs text-gray-500">
                  {{ beatsData[currentBeatIndex]?.image.prompt }}
                </p>
              </div>
              <div v-else class="text-center">
                <Loader2 :size="64" class="text-blue-500 animate-spin mx-auto mb-2" />
                <p class="text-sm text-gray-600">Generating Image...</p>
              </div>
            </div>

            <!-- Media Controls -->
            <div class="flex items-center justify-center gap-4">
              <Button size="lg" class="px-8">
                <Play :size="20" class="mr-2" />
                Play from {{ getCurrentTimeFromPosition(timelinePosition) }}
              </Button>
              <div class="flex gap-2">
                <Button size="sm" variant="outline">
                  <Eye :size="16" />
                </Button>
                <Button size="sm" variant="outline">
                  <RefreshCw :size="16" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Content Preview -->
          <div class="space-y-4">
            <Card class="p-6">
              <div class="space-y-4">
                <!-- Beat Info -->
                <div class="flex items-center gap-2 pb-3 border-b">
                  <Badge variant="outline"> Beat {{ currentBeatIndex }} </Badge>
                  <span class="text-sm font-medium text-blue-600">
                    {{ beatsData[currentBeatIndex]?.speaker }}
                  </span>
                  <span class="text-xs text-gray-500 font-mono ml-auto">
                    {{ formatTime(getBeatDuration(currentBeatIndex)) }}s
                  </span>
                </div>

                <!-- Text Content -->
                <div class="space-y-3">
                  <p class="text-lg leading-relaxed text-gray-800">
                    {{ beatsData[currentBeatIndex]?.text }}
                  </p>
                </div>

                <!-- Status Indicators -->
                <div class="flex items-center gap-4 pt-3 border-t">
                  <div class="flex items-center gap-2">
                    <FileImage
                      :size="16"
                      :class="`${beatsData[currentBeatIndex]?.image.status === 'ready' ? 'text-green-500' : 'text-gray-400'}`"
                    />
                    <span
                      :class="`text-xs ${beatsData[currentBeatIndex]?.image.status === 'ready' ? 'text-green-600' : 'text-gray-500'}`"
                    >
                      {{ beatsData[currentBeatIndex]?.image.status === "ready" ? "Image Ready" : "Generating..." }}
                    </span>
                    <Loader2
                      v-if="beatsData[currentBeatIndex]?.image.status === 'generating'"
                      :size="12"
                      class="animate-spin text-blue-500"
                    />
                  </div>
                  <div class="flex items-center gap-2">
                    <Volume2
                      :size="16"
                      :class="`${beatsData[currentBeatIndex]?.audio.status === 'ready' ? 'text-green-500' : 'text-gray-400'}`"
                    />
                    <span
                      :class="`text-xs ${beatsData[currentBeatIndex]?.audio.status === 'ready' ? 'text-green-600' : 'text-gray-500'}`"
                    >
                      {{ beatsData[currentBeatIndex]?.audio.status === "ready" ? "Audio Ready" : "Generating..." }}
                    </span>
                    <Loader2
                      v-if="beatsData[currentBeatIndex]?.audio.status === 'generating'"
                      :size="12"
                      class="animate-spin text-blue-500"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <!-- Horizontal Timeline -->
        <div class="relative">
          <!-- Timeline Track -->
          <div
            class="relative h-16 bg-gray-100 rounded-lg cursor-pointer select-none"
            @click="handleTimelineClick"
            @mousemove="handleTimelineDrag"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseUp"
          >
            <!-- Beat Segments -->
            <div
              v-for="(beat, index) in beatsData"
              :key="beat.id"
              :class="`absolute top-0 h-full border-r border-gray-300 flex flex-col justify-center items-center transition-colors ${
                index === currentBeatIndex ? 'bg-blue-200' : 'bg-gray-50 hover:bg-gray-100'
              }`"
              :style="{
                left: `${getBeatStartPercentage(index)}%`,
                width: `${getBeatWidthPercentage(index)}%`,
              }"
              @click.stop="selectBeat(index)"
            >
              <!-- Beat Number -->
              <div class="text-xs font-semibold text-gray-600">
                {{ index + 1 }}
              </div>
              <!-- Duration -->
              <div class="text-xs text-gray-500 font-mono">{{ formatTime(getBeatDuration(index)) }}s</div>
            </div>

            <!-- Timeline Cursor -->
            <div
              class="absolute top-0 h-full w-1 bg-blue-500 cursor-grab active:cursor-grabbing z-10"
              :style="{ left: `${timelinePosition}%` }"
              @mousedown="handleMouseDown"
            >
              <!-- Triangle pointing down -->
              <div
                class="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-blue-500 shadow-md"
              ></div>
              <!-- Triangle pointing up -->
              <div
                class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-blue-500 shadow-md"
              ></div>
            </div>
          </div>

          <!-- Navigation Controls -->
          <div class="absolute right-0 top-1/2 transform -translate-y-1/2 flex gap-2 -mr-20">
            <Button size="sm" variant="outline" @click="navigateToBeat('prev')" :disabled="currentBeatIndex === 0">
              <ChevronLeft :size="16" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              @click="navigateToBeat('next')"
              :disabled="currentBeatIndex === beatsData.length - 1"
            >
              <ChevronRight :size="16" />
            </Button>
          </div>
        </div>

        <!-- Current Time Display Following Timeline Position -->
        <div v-if="isPreviewAreaVisible" class="relative mt-2 mb-4 h-12">
          <div
            class="absolute text-center"
            :style="{
              left: `${timelinePosition}%`,
              transform:
                timelinePosition <= 5
                  ? 'translateX(0)'
                  : timelinePosition >= 95
                    ? 'translateX(-100%)'
                    : 'translateX(-50%)',
            }"
          >
            <div
              class="text-lg font-mono text-blue-600 font-semibold bg-white px-2 py-1 rounded shadow-sm border whitespace-nowrap"
            >
              {{ getCurrentTimeFromPosition(timelinePosition) }}
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import {
  List,
  Calendar,
  FileImage,
  Volume2,
  Loader2,
  Eye,
  RefreshCw,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Beat {
  id: string;
  speaker: string;
  text: string;
  image: {
    status: "ready" | "generating";
    prompt: string;
  };
  audio: {
    status: "ready" | "generating";
  };
  timestamp: string;
}

interface Props {
  beatsData: Beat[];
  audioFiles: (string | null)[];
  viewMode: "list" | "timeline";
  currentBeatIndex: number;
  timelinePosition: number;
  isPreviewAreaVisible: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:viewMode": [value: "list" | "timeline"];
  "update:currentBeatIndex": [value: number];
  "update:timelinePosition": [value: number];
  "update:isPreviewAreaVisible": [value: boolean];
}>();

const isDragging = ref(false);

// Helper functions
const convertTimeToSeconds = (timeString: string) => {
  if (!timeString) return 0;
  const [minutes, seconds] = timeString.split(":").map(Number);
  return minutes * 60 + seconds;
};

const getTotalDuration = () => {
  if (props.beatsData.length === 0) return 0;
  return convertTimeToSeconds(props.beatsData[props.beatsData.length - 1].timestamp) + 15;
};

const getBeatDuration = (index: number) => {
  if (index === props.beatsData.length - 1) return 15;
  return (
    convertTimeToSeconds(props.beatsData[index + 1].timestamp) - convertTimeToSeconds(props.beatsData[index].timestamp)
  );
};

const getBeatWidthPercentage = (index: number) => {
  const totalDuration = getTotalDuration();
  const beatDuration = getBeatDuration(index);
  return (beatDuration / totalDuration) * 100;
};

const getBeatStartPercentage = (index: number) => {
  const totalDuration = getTotalDuration();
  const startTime = convertTimeToSeconds(props.beatsData[index].timestamp);
  return (startTime / totalDuration) * 100;
};

const getCurrentBeatFromPosition = (position: number) => {
  const totalDuration = getTotalDuration();
  const currentTime = (position / 100) * totalDuration;

  for (let i = 0; i < props.beatsData.length; i++) {
    const beatStart = convertTimeToSeconds(props.beatsData[i].timestamp);
    const beatEnd =
      i === props.beatsData.length - 1 ? beatStart + 15 : convertTimeToSeconds(props.beatsData[i + 1].timestamp);

    if (currentTime >= beatStart && currentTime < beatEnd) {
      return i;
    }
  }
  return 0;
};

const getCurrentTimeFromPosition = (position: number) => {
  const totalDuration = getTotalDuration();
  const currentSeconds = (position / 100) * totalDuration;
  const minutes = Math.floor(currentSeconds / 60);
  const seconds = Math.floor(currentSeconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Event handlers
const handleTimelineClick = (event: MouseEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const position = ((event.clientX - rect.left) / rect.width) * 100;
  emit("update:timelinePosition", position);
  const newBeatIndex = getCurrentBeatFromPosition(position);
  emit("update:currentBeatIndex", newBeatIndex);
  emit("update:isPreviewAreaVisible", true);
};

const handleTimelineDrag = (event: MouseEvent) => {
  if (!isDragging.value) return;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const position = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
  emit("update:timelinePosition", position);
  const newBeatIndex = getCurrentBeatFromPosition(position);
  emit("update:currentBeatIndex", newBeatIndex);
};

const handleMouseDown = () => {
  isDragging.value = true;
};

const handleMouseUp = () => {
  isDragging.value = false;
};

const selectBeat = (index: number) => {
  emit("update:currentBeatIndex", index);
  emit("update:timelinePosition", getBeatStartPercentage(index));
  emit("update:isPreviewAreaVisible", true);
};

const navigateToBeat = (direction: "prev" | "next") => {
  const newIndex =
    direction === "prev"
      ? Math.max(0, props.currentBeatIndex - 1)
      : Math.min(props.beatsData.length - 1, props.currentBeatIndex + 1);
  emit("update:currentBeatIndex", newIndex);
  emit("update:timelinePosition", getBeatStartPercentage(newIndex));
};

// Update timeline position when currentBeatIndex changes
watch(
  () => props.currentBeatIndex,
  (newIndex) => {
    if (!isDragging.value) {
      emit("update:timelinePosition", getBeatStartPercentage(newIndex));
    }
  },
);
</script>
