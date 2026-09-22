/** Плёночное зерно поверх финального кадра: сильнее в средних тонах, слабее в чёрном и белом. */
export const GrainShader = {
  name: 'GrainShader',
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    amount: { value: 0.08 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float amount;
    varying vec2 vUv;
    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      float n = hash(gl_FragCoord.xy + fract(time) * 1000.0) - 0.5;
      // пик зерна в полутонах, чёрный фон остаётся чистым
      float w = smoothstep(0.0, 0.12, l) * (1.0 - smoothstep(0.5, 1.0, l)) + 0.08 * smoothstep(0.0, 0.03, l);
      c.rgb += n * amount * w;
      gl_FragColor = c;
    }
  `,
};
