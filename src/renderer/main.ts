import { createApp } from "vue";
import "./style.css";
import App from "./app.vue";
import router from "./router";

import { createPinia } from "pinia";

import { createI18n } from "vue-i18n";

import i18nConf from "./i18n/index";
const i18n = createI18n(i18nConf);

const app = createApp(App);
app.use(i18n);
app.use(router);
app.use(createPinia());
app.mount("#app");
