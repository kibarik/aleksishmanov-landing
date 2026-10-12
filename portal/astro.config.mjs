// Портал aleksishmanov.ru: все страницы, кроме главной (главная — 3D-лендинг на Vite в корне репозитория).
// Сборка — scripts/build.mjs: лендинг и портал собираются отдельно и сливаются в dist/.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://aleksishmanov.ru',
  trailingSlash: 'always',
  outDir: '../dist-portal',
  // CSS — внутри HTML: внешний файл блокировал первую отрисовку (PageSpeed: render-blocking)
  build: { format: 'directory', inlineStylesheets: 'always' },
  // главная собирается Vite, но в sitemap она нужна первой
  integrations: [sitemap({ customPages: ['https://aleksishmanov.ru/'], filter: (page) => !page.includes('/404') })],
  markdown: { shikiConfig: { theme: 'github-light', wrap: true } },
  server: { port: 4321 },
});
