import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import VNetworkGraph from "v-network-graph";
import "v-network-graph/lib/style.css";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(ElementPlus);
app.use(VNetworkGraph);
app.use(createPinia());
app.use(router);

app.mount("#app");
