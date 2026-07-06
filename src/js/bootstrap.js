// import { API_BASE_URL } from './lib/api';
// import Pusher from 'pusher-js';
// import Echo from 'laravel-echo';

// window.API_BASE_URL = API_BASE_URL;

// window.Pusher = Pusher;

// const PUSHER_KEY = '89909ba947140c167211';
// const PUSHER_CLUSTER = 'eu';
// const FORCE_TLS = true;

// try {
// 	const storedToken = typeof window !== 'undefined' ? window.localStorage.getItem('authToken') || '' : '';

// 	window.Echo = new Echo({
// 		broadcaster: 'pusher',
// 		key: PUSHER_KEY,
// 		cluster: PUSHER_CLUSTER,
// 		forceTLS: FORCE_TLS,
// 		auth: {
// 			headers: {
// 				Authorization: `Bearer ${storedToken}`,
// 			},
// 		},
// 	});
// 	console.info('[Realtime Notifications] Echo initialized');
// } catch (e) {
// 	console.warn('[Realtime Notifications] Failed to initialize Echo', e);
// }
