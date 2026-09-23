import { defineConfig } from 'vite';

// base './': относительные пути к ассетам — сборка работает на любом статическом хостинге,
// в том числе не в корне домена (спека, «Хостинг»).
export default defineConfig({
  base: './',
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
