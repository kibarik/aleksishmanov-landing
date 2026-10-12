/**
 * CSS главной — прямо в <style> HTML, а не отдельным файлом: внешний CSS блокирует первую отрисовку
 * лишним запросом (PageSpeed: render-blocking, ~0,5–0,9 с на мобильной сети). Хостинг отдаёт без сжатия,
 * поэтому CSS заранее урезан до нужных шрифтов (src/main.js) — в HTML он добавляет ~34 КБ.
 * Пути внутри CSS считаются от assets/, в HTML — от корня: url(./x) → url(./assets/x).
 */
export function inlineCss() {
  return {
    name: 'aleks-inline-css',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        return html.replace(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"[^>]*>/g, (tag, file) => {
          const asset = ctx.bundle[file];
          if (!asset || asset.type !== 'asset') return tag;
          const css = String(asset.source).replace(/url\(\.\//g, 'url(./assets/');
          delete ctx.bundle[file];
          return `<style>${css}</style>`;
        });
      },
    },
  };
}
