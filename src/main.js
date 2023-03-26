import { createApp } from 'vue';
import RugoVue from '@rugo-vn/vue';
import { createPinia } from 'pinia';
import { setupCalendar } from 'v-calendar';

import App from './App.vue';
import router from './router';

import 'v-calendar/style.css';
import '@rugo-vn/vue/dist/index.css';
import 'vue3-treeview/dist/style.css';
import './index.css';

const app = createApp(App);
const pinia = createPinia();

app.use(setupCalendar, {});
app.use(RugoVue);
app.use(pinia);
app.use(router);

app.mount('#app');
