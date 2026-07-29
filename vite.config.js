import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
    plugins: [
        vue({
            template: {
                transformAssetUrls: {
                    base: null,
                    includeAbsolute: false,
                },
            },
        }),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src/js'),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'https://cbt-application-ufyd.onrender.com',
                changeOrigin: true,
                rewrite: (path) => path,
            },
            // Laravel Echo's private-channel auth handshake (see
            // src/js/echoNotifications.js) posts to the absolute path
            // `/api/broadcasting/auth`, which the `/api` proxy above already
            // covers. This extra `/broadcasting` rule is kept as a fallback
            // in case any code path still resolves against a bare
            // `/broadcasting/...` path. API_BASE_URL is intentionally '' in
            // dev (see src/js/lib/api.js), so requests resolve relative to
            // the current page origin instead of the real backend. Without
            // this proxy entry, Vite's SPA fallback serves index.html for
            // that path instead of a real auth response, and every
            // private-channel subscription silently fails — no console
            // error, it just never receives realtime notifications.
            '/broadcasting': {
                target: 'https://cbt-application-ufyd.onrender.com',
                changeOrigin: true,
                rewrite: (path) => path,
            },
        },
    },
});
