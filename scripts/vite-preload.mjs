/**
 * Параллельная предзагрузка тяжёлого 3D (Vite-плагин главной).
 * Без неё запросы шли цепочкой: index.js → boot3d.js → three.js (900 КБ) → draco-декодер,
 * и каждое звено стартовало только после разбора предыдущего. Теперь инлайн-скрипт в <head>
 * (после проверки WebGL) сразу просит чанки сцены и декодер — они качаются вместе с моделью.
 *
 * При сборке плагин кладёт в страницу список чанков (хэши в именах), в dev списка нет: там
 * предзагружается только декодер.
 */
export function scenePreload() {
  return {
    name: 'aleks-scene-preload',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const chunks = Object.values(ctx.bundle)
          .filter((c) => c.type === 'chunk' && !c.isEntry && /^assets\/(three|boot3d)-/.test(c.fileName))
          .map((c) => `./${c.fileName}`);
        if (!chunks.length) return html;
        return html.replace(/<meta charset="UTF-8" \/>/i, (m) => `${m}\n  <script>window.__sceneChunks = ${JSON.stringify(chunks)};</script>`);
      },
    },
  };
}
