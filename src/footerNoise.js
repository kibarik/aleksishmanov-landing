/**
 * Плёночное зерно поверх панели футера (как noise-canvas у референса): маленький канвас, растянутый
 * на всю панель, обновляется ~12 раз в секунду и только пока футер в кадре.
 */
export function mountFooterNoise(canvas) {
  const ctx = canvas.getContext('2d');
  const W = 220;
  const H = 140;
  canvas.width = W;
  canvas.height = H;
  const img = ctx.createImageData(W, H);
  let timer = 0;

  function draw() {
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 22;
    }
    ctx.putImageData(img, 0, 0);
  }

  return {
    start() {
      if (timer) return;
      draw();
      // без анимации — один статичный кадр зерна
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      timer = setInterval(draw, 80);
    },
    stop() { clearInterval(timer); timer = 0; },
  };
}
