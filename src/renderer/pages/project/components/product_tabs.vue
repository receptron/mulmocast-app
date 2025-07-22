<template>
  <Tabs default-value="movie" class="w-full">
    <TabsList class="grid w-full grid-cols-5">
      <TabsTrigger value="movie">{{ t('project.productTabs.tabs.movie') }}</TabsTrigger>
      <TabsTrigger value="pdf">{{ t('project.productTabs.tabs.pdf') }}</TabsTrigger>
      <TabsTrigger value="html">{{ t('project.productTabs.tabs.html') }}</TabsTrigger>
      <TabsTrigger value="podcast">{{ t('project.productTabs.tabs.podcast') }}</TabsTrigger>
      <TabsTrigger value="slide">{{ t('project.productTabs.tabs.slide') }}</TabsTrigger>
    </TabsList>

    <TabsContent value="movie" class="mt-4">
      <div class="border rounded-lg p-8 text-center bg-gray-50">
        <video :size="64" class="mx-auto text-gray-400 mb-4" controls :src="videoUrl" ref="videoRef" />
        <p class="text-lg font-medium mb-2">{{ t('project.productTabs.movie.title') }}</p>
        <p class="text-sm text-gray-600 mb-4">{{ t('project.productTabs.movie.description') }}</p>
        <div class="flex justify-center space-x-4">
          <Button @click="playVideo">
            <Play :size="16" class="mr-2" />
            {{ t('project.productTabs.movie.play') }}
          </Button>
          <Button variant="outline" @click="downloadMp4">
            <Video :size="16" class="mr-2" />
            {{ t('project.productTabs.movie.download') }}
          </Button>
        </div>
        <div class="mt-4 text-sm text-gray-500">{{ t('project.productTabs.movie.details') }}</div>
      </div>
    </TabsContent>

    <TabsContent value="pdf" class="mt-4">
      <div class="border rounded-lg p-8 text-center bg-gray-50">
        <FileText :size="64" class="mx-auto text-gray-400 mb-4" />
        <p class="text-lg font-medium mb-2">{{ t('project.productTabs.pdf.title') }}</p>
        <p class="text-sm text-gray-600 mb-4">{{ t('project.productTabs.pdf.description') }}</p>
        <div class="flex justify-center space-x-4">
          <Button>
            <FileText :size="16" class="mr-2" />
            {{ t('project.productTabs.pdf.view') }}
          </Button>
          <Button variant="outline">
            <FileText :size="16" class="mr-2" />
            {{ t('project.productTabs.pdf.download') }}
          </Button>
        </div>
        <div class="mt-4 text-sm text-gray-500">{{ t('project.productTabs.pdf.details') }}</div>
      </div>
    </TabsContent>

    <TabsContent value="html" class="mt-4">
      <div class="border rounded-lg p-8 text-center bg-gray-50">
        <Globe :size="64" class="mx-auto text-gray-400 mb-4" />
        <p class="text-lg font-medium mb-2">{{ t('project.productTabs.html.title') }}</p>
        <p class="text-sm text-gray-600 mb-4">{{ t('project.productTabs.html.description') }}</p>
        <div class="flex justify-center space-x-4">
          <Button>
            <Eye :size="16" class="mr-2" />
            {{ t('project.productTabs.html.view') }}
          </Button>
          <Button variant="outline">
            <Download :size="16" class="mr-2" />
            {{ t('project.productTabs.html.download') }}
          </Button>
        </div>
        <div class="mt-4 text-sm text-gray-500">{{ t('project.productTabs.html.details') }}</div>
      </div>
    </TabsContent>

    <TabsContent value="podcast" class="mt-4">
      <div class="border rounded-lg p-8 text-center bg-gray-50">
        <Volume2 :size="64" class="mx-auto text-gray-400 mb-4" />
        <p class="text-lg font-medium mb-2">{{ t('project.productTabs.podcast.title') }}</p>
        <p class="text-sm text-gray-600 mb-4">{{ t('project.productTabs.podcast.description') }}</p>
        <div class="flex justify-center space-x-4">
          <Button>
            <Play :size="16" class="mr-2" />
            {{ t('project.productTabs.podcast.play') }}
          </Button>
          <Button variant="outline" @click="downloadMp3">
            <Volume2 :size="16" class="mr-2" />
            {{ t('project.productTabs.podcast.download') }}
          </Button>
        </div>
        <div class="mt-4 text-sm text-gray-500">{{ t('project.productTabs.podcast.details') }}</div>
      </div>
    </TabsContent>

    <TabsContent value="slide" class="mt-4">
      <div class="border rounded-lg p-8 text-center bg-gray-50">
        <FileImage :size="64" class="mx-auto text-gray-400 mb-4" />
        <p class="text-lg font-medium mb-2">{{ t('project.productTabs.slide.title') }}</p>
        <p class="text-sm text-gray-600 mb-4">{{ t('project.productTabs.slide.description') }}</p>
        <div class="flex justify-center space-x-4">
          <Button>
            <Play :size="16" class="mr-2" />
            {{ t('project.productTabs.slide.start') }}
          </Button>
          <Button variant="outline">
            <FileImage :size="16" class="mr-2" />
            {{ t('project.productTabs.slide.export') }}
          </Button>
        </div>
        <div class="mt-4 text-sm text-gray-500">{{ t('project.productTabs.slide.details') }}</div>
      </div>
    </TabsContent>
  </Tabs>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from "vue";
import { Video, FileText, Globe, Volume2, FileImage, Play, Eye, Download } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const route = useRoute();
const projectId = computed(() => route.params.id as string);
const { t } = useI18n();

const downloadMp4 = async () => {
  return downloadFile("movie", "video/mp4", projectId.value + "_video.mp4");
};
const downloadMp3 = async () => {
  return downloadFile("audio", "audio/mp3", projectId.value + "_audio.mp3");
};

interface Props {
  videoUrl: string;
}

defineProps<Props>();
const emit = defineEmits(["playVideo"]);

const videoRef = ref(null);
const playVideo = () => {
  emit("playVideo", async () => {
    console.log(videoRef.value);
    await nextTick();

    videoRef.value?.play();
  });
};

const downloadFile = async (fileType: string, mimeType: string, fileName: string) => {
  const buffer = (await window.electronAPI.mulmoHandler("downloadFile", projectId.value, fileType)) as ArrayBuffer;
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();

  URL.revokeObjectURL(url);
};
</script>
