import './bootstrap';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '../App.vue';
import router from '../router/index';
import { initializeApiState } from './lib/api';
import { initializeAuthState } from './lib/auth';
import '../css/app.css';

// Initialize auth state first, then API state (auth sets the token)
initializeAuthState();
initializeApiState();

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.mount('#app');
