import { createRouter, createWebHashHistory } from "vue-router";
import Dashboard from "./pages/dashboard.vue";
import Project from "./pages/project.vue";
import Settings from "./pages/settings.vue";
import Bgm from "./pages/bgm.vue";

const routes = [
  { path: "/", component: Dashboard },
  { path: "/project/:id", component: Project },
  { path: "/settings", component: Settings },
  { path: "/bgm", component: Bgm },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
