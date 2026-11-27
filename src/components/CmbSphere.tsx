'use client';
import {useEffect, useRef, useState} from 'react';
import info from '../../data/curated/cmb.json';
import type {Locale} from '@/lib/i18n';

// The Planck SMICA temperature map on a sphere. One full-screen triangle; each fragment casts a ray
// at the unit sphere, turns the hit point into galactic (l, b), samples the equirectangular texture
// (grey = ΔT between −limit and +limit µK) and applies a diverging scale. No library, no meshes.
const vertex = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p; gl_Position = vec4(p, 0.0, 1.0); }`;

const fragment = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D map; uniform mat3 rot; uniform float aspect, zoom;
const float PI = 3.141592653589793;
vec3 scale(float t){
  vec3 c0 = vec3(0.09,0.16,0.52), c1 = vec3(0.25,0.45,1.0), c2 = vec3(0.95,0.96,0.98), c3 = vec3(0.96,0.62,0.27), c4 = vec3(0.70,0.16,0.12);
  t = clamp(t,0.0,1.0)*4.0;
  if(t<1.0) return mix(c0,c1,t); if(t<2.0) return mix(c1,c2,t-1.0); if(t<3.0) return mix(c2,c3,t-2.0); return mix(c3,c4,t-3.0);
}
void main(){
  vec2 q = uv * vec2(aspect, 1.0) / zoom;
  float r2 = dot(q,q);
  if(r2 > 1.0){ o = vec4(0.0); return; }
  vec3 n = vec3(q, sqrt(1.0 - r2));
  vec3 d = rot * n;
  float l = atan(d.y, d.x), b = asin(clamp(d.z,-1.0,1.0));
  vec2 st = vec2(fract(0.5 - l/(2.0*PI)), 0.5 - b/PI);
  float g = texture(map, st).r;
  vec3 c = scale(g);
  float rim = smoothstep(1.0, 0.92, sqrt(r2));
  float light = 0.82 + 0.18*n.z;
  o = vec4(c*light, rim);
  o.rgb *= o.a;
}`;

function matrix(yaw: number, pitch: number) {
  // camera looks along -z; columns map screen axes to galactic xyz
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  // screen x → east, screen y → north, screen z → out of the sphere toward the viewer
  return new Float32Array([
    -sy, cy, 0,
    -sp * cy, -sp * sy, cp,
    cp * cy, cp * sy, sp,
  ]);
}

export function CmbSphere({locale}: {locale: Locale}) {
  const pt = locale === 'pt';
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'live' | 'failed'>('idle');
  const view = useRef({yaw: 2.6, pitch: 0.35, zoom: 0.92, drag: null as null | {x: number; y: number; yaw: number; pitch: number}, spin: true});
  // The canvas exists only in the browser: the served HTML carries the caption and the scale, no empty canvas.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const el = canvas.current;
    if (!mounted || !el) return;
    let stop = false, raf = 0;
    const io = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting) || state !== 'idle') return;
      io.disconnect();
      setState('loading');
      start();
    }, {rootMargin: '200px'});
    io.observe(el);

    async function start() {
      const gl = el!.getContext('webgl2', {alpha: true, premultipliedAlpha: true, antialias: true});
      if (!gl) { setState('failed'); return; }
      const prog = gl.createProgram()!;
      for (const [kind, src] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
        const s = gl.createShader(kind)!; gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { setState('failed'); return; }
        gl.attachShader(prog, s);
      }
      gl.linkProgram(prog); gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const small = window.matchMedia('(max-width: 40rem)').matches;
      const img = new Image();
      img.src = `/observatory/cmb-smica-${small ? 1024 : 2048}.png`;
      try { await img.decode(); } catch { setState('failed'); return; }
      if (stop) return;
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const uRot = gl.getUniformLocation(prog, 'rot'), uAsp = gl.getUniformLocation(prog, 'aspect'), uZoom = gl.getUniformLocation(prog, 'zoom');
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setState('live');
      let last = performance.now();
      const frame = (now: number) => {
        if (stop) return;
        const v = view.current;
        if (v.spin && !v.drag && !reduce) v.yaw += (now - last) * 0.00006;
        last = now;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(el!.clientWidth * dpr), h = Math.round(el!.clientHeight * dpr);
        if (el!.width !== w || el!.height !== h) { el!.width = w; el!.height = h; }
        gl.viewport(0, 0, w, h);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniformMatrix3fv(uRot, false, matrix(v.yaw, v.pitch));
        gl.uniform1f(uAsp, w / h); gl.uniform1f(uZoom, v.zoom);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }
    return () => { stop = true; cancelAnimationFrame(raf); io.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const down = (e: React.PointerEvent) => { const v = view.current; v.drag = {x: e.clientX, y: e.clientY, yaw: v.yaw, pitch: v.pitch}; v.spin = false; (e.target as Element).setPointerCapture(e.pointerId); };
  const move = (e: React.PointerEvent) => { const v = view.current; if (!v.drag) return; const k = 3.2 / (canvas.current?.clientHeight || 400); v.yaw = v.drag.yaw - (e.clientX - v.drag.x) * k; v.pitch = Math.max(-1.45, Math.min(1.45, v.drag.pitch + (e.clientY - v.drag.y) * k)); };
  const up = () => { view.current.drag = null; };
  const key = (e: React.KeyboardEvent) => { const v = view.current; const s = 0.12; v.spin = false;
    if (e.key === 'ArrowLeft') v.yaw += s; else if (e.key === 'ArrowRight') v.yaw -= s; else if (e.key === 'ArrowUp') v.pitch = Math.min(1.45, v.pitch + s); else if (e.key === 'ArrowDown') v.pitch = Math.max(-1.45, v.pitch - s); else if (e.key === '+' || e.key === '=') v.zoom = Math.min(1.6, v.zoom * 1.1); else if (e.key === '-') v.zoom = Math.max(0.6, v.zoom / 1.1); else return; e.preventDefault(); };
  const lim = info.limit_uK;
  return (
    <figure className="cmb-sphere">
      <div className="cmb-stage">
        {mounted && <canvas ref={canvas} tabIndex={0} role="img"
          aria-label={pt ? `Mapa de temperatura da radiação cósmica de fundo do Planck numa esfera, em coordenadas galácticas. Arraste ou use as setas para girar.` : `Planck cosmic microwave background temperature map on a sphere, in galactic coordinates. Drag or use the arrow keys to rotate.`}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key} />}
        {state !== 'live' && <p className="cmb-status" role="status">{!mounted
          ? (pt ? 'A esfera do Planck precisa de JavaScript para girar.' : 'The Planck sphere needs JavaScript to rotate.')
          : state === 'failed' ? (pt ? 'Seu navegador não abriu o WebGL, que a esfera usa.' : 'Your browser could not open WebGL, which the sphere uses.')
          : (pt ? 'Carregando o mapa do Planck…' : 'Loading the Planck map…')}</p>}
      </div>
      <div className="cmb-scale" aria-hidden="true"><span>−{lim} µK</span><i /><span>+{lim} µK</span></div>
      <figcaption>{pt
        ? <>Temperatura da radiação cósmica de fundo, mapa {info.map} do {info.release}, em coordenadas galácticas. Flutuações de ±{lim} µK sobre 2,7255 K; desvio padrão de {String(info.rms_uK).replace('.', ',')} µK no céu inteiro. A faixa do plano da Via Láctea guarda resíduo de emissão da Galáxia. Créditos: {info.credit}. <a className="text-link" href={info.reference.url}>{info.reference.label}</a>.</>
        : <>Cosmic microwave background temperature, {info.map} map from {info.release}, in galactic coordinates. Fluctuations of ±{lim} µK on top of 2.7255 K; standard deviation {info.rms_uK} µK over the full sky. The Milky Way plane keeps residual Galactic emission. Credit: {info.credit}. <a className="text-link" href={info.reference.url}>{info.reference.label}</a>.</>}
      </figcaption>
    </figure>
  );
}
