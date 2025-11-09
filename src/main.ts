import { createApp } from "vue";
import App from "./App.vue";
import "./assets/index.css";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";

createApp(App)
  .use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: '.dark',
        cssLayer: false
      }
    }
  })
  .mount("#app");
