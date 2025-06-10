<template>
  <Layout>
    <div class="max-w-7xl mx-auto p-6 space-y-6">
      <!-- Main Content -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-4">
            <button
              class="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              @click="newProject"
            >
              <Plus class="w-5 h-5" />
              <span>Create New</span>
            </button>
            <div class="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
              <button
                @click="viewMode = 'list'"
                :class="[
                  'p-2 rounded-md transition-colors',
                  viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600',
                ]"
              >
                <List class="w-5 h-5" />
              </button>
              <button
                @click="viewMode = 'grid'"
                :class="[
                  'p-2 rounded-md transition-colors',
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600',
                ]"
              >
                <Grid class="w-5 h-5" />
              </button>
            </div>
          </div>
          <div class="text-sm text-gray-500">{{ projects.length }} projects</div>
        </div>

        <!-- Project List -->
        <div v-if="viewMode === 'list'">
          <ListView :projects="projects" />
        </div>

        <!-- Project Grid -->
        <div v-else>
          <GridView :projects="projects" />
        </div>
      </div>
    </div>
  </Layout>
</template>

<script lang="ts">
import { ref, defineComponent } from "vue";
import { Plus, List, Grid } from "lucide-vue-next";
//import { RouterLink } from "vue-router";
import { useRouter } from "vue-router";

import Layout from "@/components/Layout.vue";
import ListView from "./components/ListView.vue";
import GridView from "./components/GridView.vue";

const dummyProject = [
  {
    id: 1,
    title: "Podcast: AI Technology Fundamentals",
    type: "podcast" as const,
    thumbnail: "https://picsum.photos/seed/ai-technology/200/150",
    audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    date: "2024-05-20",
    sessionActive: true,
    hasErrors: false,
  },
  {
    id: 2,
    title: "Educational Video: Climate Change",
    type: "video" as const,
    thumbnail: "https://picsum.photos/seed/climate-change/200/150",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    date: "2024-05-19",
    sessionActive: false,
    hasErrors: false,
  },
  {
    id: 3,
    title: "Business Presentation: Q1 Results",
    type: "presentation" as const,
    thumbnail: "https://picsum.photos/seed/q1-results/200/150",
    date: "2024-05-18",
    sessionActive: true,
    hasErrors: true,
  },
  {
    id: 4,
    title: "Tutorial: Vue.js Basics",
    type: "video" as const,
    thumbnail: "https://picsum.photos/seed/vuejs-basics/200/150",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    date: "2024-05-17",
    sessionActive: false,
    hasErrors: false,
  },
  {
    id: 5,
    title: "Marketing Campaign Video",
    type: "video" as const,
    thumbnail: "https://picsum.photos/seed/marketing-campaign/200/150",
    videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    date: "2024-05-16",
    sessionActive: false,
    hasErrors: false,
  },
  {
    id: 6,
    title: "Daily News Podcast",
    type: "audio" as const,
    audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    thumbnail: "https://picsum.photos/seed/daily-news/200/150",
    date: "2024-05-15",
    sessionActive: false,
    hasErrors: false,
  },
];

export default defineComponent({
  components: {
    Layout,
    ListView,
    GridView,
  },
  setup() {
    const viewMode = ref<"list" | "grid">("list");
    const router = useRouter();

    const newProject = async () => {
      const id =
        new Date().toISOString().slice(0, 16).replace(/[-T:]/g, "") + "-" + Math.random().toString(36).slice(2, 8);
      await window.electronAPI.createProject(id);
      router.push("/project/" + id);
    };

    const projects = ref(dummyProject);
    const loadProjects = async () => {
      const data = await window.electronAPI.loadProjects();
      projects.value = [...data, ...dummyProject];
      console.log(projects.value);
    };
    loadProjects();
    return {
      newProject,
      projects,
      viewMode,
    };
  },
});
// TODO: Audio play functionality to be implemented later
</script>
