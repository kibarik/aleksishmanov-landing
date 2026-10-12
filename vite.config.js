import { defineConfig } from 'vite';
import { portalBridge } from './scripts/vite-portal.mjs';
import { scenePreload } from './scripts/vite-preload.mjs';
import { inlineCss } from './scripts/vite-inline-css.mjs';

// base './': относительные пути к ассетам — сборка работает на любом статическом хостинге,
// в том числе не в корне домена (спека, «Хостинг»).
export default defineConfig({
  base: './',
  // главная и портал — одна сборка (scripts/build.mjs); плагин связывает их, см. scripts/vite-portal.mjs
  plugins: [portalBridge(), scenePreload(), inlineCss()],
  build: {
    rollupOptions: {
      output: {
        // three и постпроцессинг — отдельным чанком: страница и секции грузятся, не дожидаясь 3D
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
        },
      },
    },
  },
  server: { port: 5173, host: true },
});
