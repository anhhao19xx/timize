import { createApp } from 'vue';
import RugoVue from '@rugo-vn/vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

import '@rugo-vn/vue/dist/index.css';
import 'v-calendar/dist/style.css';
import './index.css';

const app = createApp(App);
const pinia = createPinia();

app.use(RugoVue);
app.use(pinia);
app.use(router);

app.mount('#app');
