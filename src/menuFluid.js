/**
 * «Жидкость» под курсором в меню: белое пятно тянется за мышью, гаснет в покое, всплеск по клику.
 * Канвас лежит поверх пунктов с mix-blend-mode: exclusion, поэтому пятно инвертирует фон и буквы, а белый знак
 * поверх него проступает внутри чёрного. Схема симуляции (перенос красителя и скорости по полю скорости,
 * гауссовы всплески) — по мотивам Pavel Dobryakov «WebGL Fluid Simulation» (MIT), без решателя давления.
 * Нет WebGL2 или рендера в half-float — createFluid вернёт null, знак останется невидимым.
 */

const VERT = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const SPLAT = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uTarget; uniform vec2 uPoint; uniform vec3 uColor; uniform float uRadius; uniform float uAspect;
void main() {
  vec2 p = vUv - uPoint; p.x *= uAspect;
  o = texture(uTarget, vUv) + vec4(exp(-dot(p, p) / uRadius) * uColor, 1.0);
}`;

const ADVECT = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 uTexel; uniform float uDt; uniform float uDissipation;
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uTexel;
  o = texture(uSource, coord) / (1.0 + uDissipation * uDt);
}`;

const DISPLAY = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uDye; uniform vec2 uSize; uniform float uTime;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
void main() {
  vec3 c = texture(uDye, vUv).rgb;
  float d = max(c.r, max(c.g, c.b));
  // шероховатый край: порог гуляет по шуму, пятно выглядит как расплывшаяся краска
  float n = vnoise(vUv * uSize / 9.0) * 0.6 + vnoise(vUv * uSize / 3.0) * 0.4;
  float thr = 0.16 + (n - 0.5) * 0.09;
  float a = smoothstep(thr, thr + 0.02, d);
  o = vec4(vec3(a), a);
}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
  return sh;
}

function program(gl, frag) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
  return { p, u };
}

const SIM = 128;
const DYE = 512;
const SPLAT_FORCE = 5200;
const MAX_RADIUS = 0.07;
const VELOCITY_DISSIPATION = 0.19;
const DENSITY_DISSIPATION = 0.872;

/** Размер сетки по пропорциям экрана: короткая сторона = res. */
function gridSize(res, aspect) {
  return aspect >= 1 ? { w: Math.round(res * aspect), h: res } : { w: res, h: Math.round(res / aspect) };
}

export function createFluid(canvas) {
  let gl;
  try {
    gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  } catch { return null; }
  if (!gl || !(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))) return null;

  let progs;
  try {
    progs = { splat: program(gl, SPLAT), advect: program(gl, ADVECT), display: program(gl, DISPLAY) };
  } catch { return null; }
  const vao = gl.createVertexArray();

  const makeTarget = (w, h) => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo, w, h, texel: [1 / w, 1 / h] };
  };
  const makeDouble = (w, h) => {
    const d = { read: makeTarget(w, h), write: makeTarget(w, h), swap() { [d.read, d.write] = [d.write, d.read]; } };
    return d;
  };
  const free = (t) => { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo); };

  let velocity; let dye;
  function allocate() {
    if (velocity) { free(velocity.read); free(velocity.write); free(dye.read); free(dye.write); }
    const aspect = canvas.width / canvas.height;
    const s = gridSize(SIM, aspect); const d = gridSize(DYE, aspect);
    velocity = makeDouble(s.w, s.h);
    dye = makeDouble(d.w, d.h);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(2, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
    if (canvas.width === w && canvas.height === h && velocity) return;
    canvas.width = w; canvas.height = h;
    allocate();
  }

  const blit = (target) => {
    if (target) { gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); gl.viewport(0, 0, target.w, target.h); }
    else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height); }
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const bind = (unit, tex) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); return unit; };

  function splat(x, y, dx, dy, radius) {
    const aspect = canvas.width / canvas.height;
    gl.useProgram(progs.splat.p);
    gl.uniform1f(progs.splat.u.uAspect, aspect);
    gl.uniform2f(progs.splat.u.uPoint, x, y);
    gl.uniform1f(progs.splat.u.uRadius, radius * radius);
    gl.uniform1i(progs.splat.u.uTarget, bind(0, velocity.read.tex));
    gl.uniform3f(progs.splat.u.uColor, dx * SPLAT_FORCE, dy * SPLAT_FORCE, 0);
    blit(velocity.write); velocity.swap();
    gl.uniform1i(progs.splat.u.uTarget, bind(0, dye.read.tex));
    gl.uniform3f(progs.splat.u.uColor, 1, 1, 1);
    blit(dye.write); dye.swap();
  }

  function advect(target, source, dissipation, dt) {
    gl.useProgram(progs.advect.p);
    gl.uniform2f(progs.advect.u.uTexel, velocity.read.texel[0], velocity.read.texel[1]);
    gl.uniform1i(progs.advect.u.uVelocity, bind(0, velocity.read.tex));
    gl.uniform1i(progs.advect.u.uSource, bind(1, source.read.tex));
    gl.uniform1f(progs.advect.u.uDt, dt);
    gl.uniform1f(progs.advect.u.uDissipation, dissipation);
    blit(target.write); target.swap();
  }

  function render(time) {
    gl.disable(gl.BLEND);
    gl.useProgram(progs.display.p);
    gl.uniform1i(progs.display.u.uDye, bind(0, dye.read.tex));
    gl.uniform2f(progs.display.u.uSize, canvas.width, canvas.height);
    gl.uniform1f(progs.display.u.uTime, time);
    gl.clearColor(0, 0, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    blit(null);
  }

  // --- ввод ---
  const pointer = { x: 0, y: 0, px: 0, py: 0, moved: false, has: false };
  const queue = [];
  const toUv = (e) => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
  };
  const onMove = (e) => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const [x, y] = toUv(e);
    if (!pointer.has) { pointer.px = x; pointer.py = y; pointer.has = true; }
    pointer.x = x; pointer.y = y; pointer.moved = true;
  };
  const onClick = (e) => { const [x, y] = toUv(e); queue.push({ x, y, burst: true }); };

  // --- цикл ---
  let running = false; let raf = 0; let last = 0; let idle = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 1 / 30) || 1 / 60;
    last = now;
    const aspect = canvas.width / canvas.height;
    let active = false;

    if (pointer.moved) {
      pointer.moved = false;
      const dx = (pointer.x - pointer.px) * aspect; const dy = pointer.y - pointer.py;
      const speed = Math.hypot(dx, dy);
      if (speed > 0) {
        const size = Math.min(1.7, 0.45 + speed * 28);
        splat(pointer.x, pointer.y, dx, dy, MAX_RADIUS * size);
        active = true;
      }
      pointer.px = pointer.x; pointer.py = pointer.y;
    }
    for (const b of queue.splice(0)) { splat(b.x, b.y, 0, 0, MAX_RADIUS * 3); active = true; }

    advect(velocity, velocity, VELOCITY_DISSIPATION, dt);
    advect(dye, dye, DENSITY_DISSIPATION, dt);
    idle = active ? 0 : idle + dt;
    render(now / 1000);
    if (idle > 3) { cancelAnimationFrame(raf); raf = 0; running = false; } // всё погасло: кадры не нужны до движения мыши
  }
  function wake() { if (!running && active) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }

  let active = false;
  const onMoveWake = (e) => { onMove(e); wake(); };
  const onClickWake = (e) => { onClick(e); wake(); };

  return {
    start() {
      if (active) return;
      active = true;
      resize();
      window.addEventListener('pointermove', onMoveWake, { passive: true });
      window.addEventListener('click', onClickWake, { passive: true });
      window.addEventListener('resize', resize);
    },
    stop() {
      if (!active) return;
      active = false;
      window.removeEventListener('pointermove', onMoveWake);
      window.removeEventListener('click', onClickWake);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf); raf = 0; running = false; pointer.has = false;
      for (const t of [velocity.read, velocity.write, dye.read, dye.write]) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    },
    get running() { return running; },
  };
}
