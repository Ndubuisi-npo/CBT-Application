import './bootstrap';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '../App.vue';
import router from '../router/index';
import { initializeApiState } from './lib/api';
import { initializeAuthState } from './lib/auth';
import '../css/app.css';

// Initialize API and auth state from localStorage
initializeApiState();
initializeAuthState();

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.mount('#app');
