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
        },
    },
});
