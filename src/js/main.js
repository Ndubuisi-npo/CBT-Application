import './bootstrap';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '../App.vue';
import router from '../router/index';
import { initializeApiState } from './lib/api';
import { initializeAuthState, getAuthUser } from './lib/auth';
import { initializeRealtimeNotifications } from './echoNotifications';
import { useNotificationStore } from '../components/shared/stores/notifications';
import '../css/app.css';

// Initialize auth state first, then API state (auth sets the token)
initializeAuthState();
initializeApiState();

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.mount('#app');

initializeRealtimeNotifications();

// Prime the notification bell for whichever role is logged in (school
// admin, teacher, or student — GET /notifications + GET
// /notifications/unread-count). No-op on public/unauthenticated pages.
if (getAuthUser()) {
  void useNotificationStore().initialize();
}
