import { defineConfig } from 'vite';

// base './': относительные пути к ассетам — сборка работает на любом статическом хостинге,
// в том числе не в корне домена (спека, «Хостинг»).
export default defineConfig({
  base: './',
  server: { port: 5173, host: true },
});
