// Realtime notifications transport setup (Laravel Echo + Pusher protocol).
//
// This file used to be fully commented out, which meant `window.Echo` was
// never defined and src/js/echoNotifications.js silently no-op'd (it checks
// `if (!window.Echo) return`).
//
// Echo itself is intentionally NOT instantiated here: this file is imported
// at the very top of main.js, before `initializeAuthState()` runs, so the
// auth token isn't available yet. Instead we only expose Pusher + the API
// base URL globally; the actual `new Echo(...)` call (which needs the auth
// token for private-channel authorization) happens in
// initializeRealtimeNotifications() in src/js/echoNotifications.js, which
// main.js calls after auth + API state are initialized.
//
// Backend dependency: this expects a working Laravel broadcasting auth
// route (`POST {API_BASE_URL}/broadcasting/auth`) that authorizes private
// channel subscriptions using the Bearer token, and that private
// notification channels are named `tenant.{tenantSlug}.users.{userId}`
// (school admin/teacher/student) or `superadmin.{userId}` (see
// buildChannelName() in echoNotifications.js). Confirm these match the
// actual backend broadcasting config before relying on this integration.
import { API_BASE_URL } from './lib/api';
import Pusher from 'pusher-js';

window.API_BASE_URL = API_BASE_URL;
window.Pusher = Pusher;

// Pusher app credentials. These were already committed (hardcoded) in this
// file before it was commented out; kept only as local-dev fallbacks so a
// missing .env doesn't silently disable realtime notifications. Set
// VITE_PUSHER_APP_KEY / VITE_PUSHER_APP_CLUSTER in .env for real deployments.
window.__PUSHER_APP_KEY__ = import.meta.env.VITE_PUSHER_APP_KEY || '89909ba947140c167211';
window.__PUSHER_APP_CLUSTER__ = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'eu';
