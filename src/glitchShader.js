/**
 * Глитч-пасс, порт шейдера bersus.io (main.js, `uBlockCount` …) под three ShaderPass.
 * Интенсивность = (1 − |progress − .5|·2)^curve × strength, зона [start, end] с рампами.
 * Параметры по умолчанию = GLITCH_DEFAULT_OPTIONS из бандла.
 */
export const GLITCH_DEFAULTS = {
  strength: 2,
  blockCount: 6,
  displacementStrength: 0.3,
  intensityCurvePower: 1,
  glitchProgressStart: 0,
  glitchProgressEnd: 1,
  glitchRampIn: 0.05,
  glitchRampOut: 0.05,
  blockChance: 1,
  timeSpeed: 4,
  rgbShift: 0,
  rgbIntensity: 0,
  rgbMono: 1,
  scanlineStrength: 0.51,
  noiseStrength: 0.43,
  flickerStrength: 0.43,
  ghostStrength: 1,
};

export const GlitchShader = {
  name: 'GlitchShader',
  uniforms: {
    tDiffuse: { value: null },
    uProgress: { value: 0 },
    uResolution: { value: [1, 1] },
    uTime: { value: 0 },
    uStrength: { value: GLITCH_DEFAULTS.strength },
    uBlockCount: { value: GLITCH_DEFAULTS.blockCount },
    uDisplacementStrength: { value: GLITCH_DEFAULTS.displacementStrength },
    uIntensityCurvePower: { value: GLITCH_DEFAULTS.intensityCurvePower },
    uGlitchProgressStart: { value: GLITCH_DEFAULTS.glitchProgressStart },
    uGlitchProgressEnd: { value: GLITCH_DEFAULTS.glitchProgressEnd },
    uGlitchRampIn: { value: GLITCH_DEFAULTS.glitchRampIn },
    uGlitchRampOut: { value: GLITCH_DEFAULTS.glitchRampOut },
    uBlockChance: { value: GLITCH_DEFAULTS.blockChance },
    uTimeSpeed: { value: GLITCH_DEFAULTS.timeSpeed },
    uRgbShift: { value: GLITCH_DEFAULTS.rgbShift },
    uRgbIntensity: { value: GLITCH_DEFAULTS.rgbIntensity },
    uRgbMono: { value: GLITCH_DEFAULTS.rgbMono },
    uScanlineStrength: { value: GLITCH_DEFAULTS.scanlineStrength },
    uNoiseStrength: { value: GLITCH_DEFAULTS.noiseStrength },
    uFlickerStrength: { value: GLITCH_DEFAULTS.flickerStrength },
    uGhostStrength: { value: GLITCH_DEFAULTS.ghostStrength },
    uBypass: { value: 1 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uProgress;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uStrength;
    uniform float uBlockCount;
    uniform float uDisplacementStrength;
    uniform float uIntensityCurvePower;
    uniform float uGlitchProgressStart;
    uniform float uGlitchProgressEnd;
    uniform float uGlitchRampIn;
    uniform float uGlitchRampOut;
    uniform float uBlockChance;
    uniform float uTimeSpeed;
    uniform float uRgbShift;
    uniform float uRgbIntensity;
    uniform float uRgbMono;
    uniform float uScanlineStrength;
    uniform float uNoiseStrength;
    uniform float uFlickerStrength;
    uniform float uGhostStrength;
    uniform float uBypass;
    varying vec2 vUv;

    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * .1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec4 inputColor = texture2D(tDiffuse, vUv);
      if (uBypass > 0.5 || uProgress <= 0.0 || uProgress >= 1.0) { gl_FragColor = inputColor; return; }

      vec2 uvCoord = vUv;
      float centerProgress = abs(uProgress - 0.5) * 2.0;
      float intensity = pow(1.0 - centerProgress, uIntensityCurvePower) * uStrength;

      float inGlitchZone = step(uGlitchProgressStart, uProgress) * step(uProgress, uGlitchProgressEnd);
      float zoneSpan = max(0.001, uGlitchProgressEnd - uGlitchProgressStart);
      float t = (uProgress - uGlitchProgressStart) / zoneSpan;
      float rampUp = uGlitchRampIn < 0.001 ? 1.0 : smoothstep(0.0, uGlitchRampIn, t);
      float rampDown = uGlitchRampOut < 0.001 ? 1.0 : (1.0 - smoothstep(1.0 - uGlitchRampOut, 1.0, t));
      intensity *= inGlitchZone * rampUp * rampDown;

      float timeStep = floor(uTime * uTimeSpeed);
      float fastTimeStep = floor(uTime * uTimeSpeed * 2.0);

      float blockId = floor(uvCoord.y * uBlockCount);
      float blockActive = hash(vec2(blockId, timeStep));
      float isActiveBlock = step(1.0 - uBlockChance, blockActive) * step(0.5, inGlitchZone) * step(0.001, intensity);

      float displacement = 0.0;
      if (isActiveBlock > 0.5) {
        float shiftNoise = hash(vec2(blockId + 0.5, timeStep));
        displacement = (shiftNoise - 0.5) * 2.0 * intensity * uDisplacementStrength;
        displacement = floor(displacement * uResolution.x) / uResolution.x;
      }

      vec2 distortedUV = uvCoord + vec2(displacement, 0.0);
      distortedUV.x = clamp(distortedUV.x, 0.0, 1.0);

      vec3 color = texture2D(tDiffuse, distortedUV).rgb;
      if (uRgbShift > 0.001 && intensity > 0.01) {
        float shift = intensity * uRgbShift * (0.5 + hash(vec2(blockId, fastTimeStep)) * 0.5);
        float rgbAmt = clamp(uRgbIntensity, 0.0, 1.0);
        if (uRgbMono > 0.5) {
          vec3 shiftLeft = texture2D(tDiffuse, distortedUV + vec2(shift, 0.0)).rgb;
          vec3 shiftRight = texture2D(tDiffuse, distortedUV - vec2(shift, 0.0)).rgb;
          float edgeLum = dot(abs(shiftLeft - shiftRight), vec3(0.299, 0.587, 0.114));
          color += vec3(edgeLum * 1.5 * rgbAmt);
        } else {
          float r = texture2D(tDiffuse, distortedUV + vec2(shift, 0.0)).r;
          float b = texture2D(tDiffuse, distortedUV - vec2(shift, 0.0)).b;
          color = mix(color, vec3(r, color.g, b), rgbAmt);
        }
      }

      if (uGhostStrength > 0.001 && intensity > 0.05) {
        float ghostNoise = hash(vec2(floor(uTime * 5.0), 0.0));
        if (ghostNoise > 0.7) {
          float ghostOffset = (hash(vec2(timeStep, 1.0)) - 0.5) * 0.1 * intensity;
          vec2 ghostUV = uvCoord + vec2(ghostOffset, 0.0);
          ghostUV.x = clamp(ghostUV.x, 0.0, 1.0);
          color = mix(color, texture2D(tDiffuse, ghostUV).rgb, uGhostStrength * intensity * 0.5);
        }
      }

      if (uScanlineStrength > 0.001 && intensity > 0.01) {
        float scanline = sin(uvCoord.y * uResolution.y * 1.5) * 0.5 + 0.5;
        scanline = pow(scanline, 1.5);
        float amt = scanline * uScanlineStrength * intensity * 0.5;
        float lum = dot(color, vec3(0.299, 0.587, 0.114));
        float darkenW = smoothstep(0.08, 0.45, lum);
        vec3 darkened = color * (1.0 - amt);
        vec3 lightened = color + amt * (1.0 - color) * 0.65;
        color = mix(lightened, darkened, darkenW);
      }

      if (uNoiseStrength > 0.001 && intensity > 0.01) {
        float noise = hash(uvCoord * uResolution + vec2(uTime * 100.0, 0.0));
        color += (noise - 0.5) * 2.0 * uNoiseStrength * intensity * 0.15;
      }

      if (uFlickerStrength > 0.001 && isActiveBlock > 0.5) {
        float flicker = hash(vec2(blockId + 1.5, fastTimeStep));
        if (flicker > 0.8) color *= 1.0 + (flicker - 0.8) * 5.0 * uFlickerStrength * intensity * 0.5;
        if (flicker < 0.15) color *= 1.0 - (0.15 - flicker) * 3.0 * uFlickerStrength * intensity;
      }

      if (uRgbMono > 0.5 && intensity > 0.01) {
        float luma = dot(color, vec3(0.299, 0.587, 0.114));
        color = mix(color, vec3(luma), clamp(intensity, 0.0, 1.0));
      }

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), inputColor.a);
    }
  `,
};
