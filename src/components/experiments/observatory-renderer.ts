import manifest from '../../../public/observatory/provenance.json';

export type Selection = {min: number; max: number; layers: [boolean, boolean]};
type Counts = [number, number];
type Callbacks = {counts: (value: Counts) => void; running: (value: boolean) => void; failed: () => void};
const pitchStart = manifest.initial_pitch_deg * Math.PI / 180;
const yawStart = manifest.initial_yaw_rad;
const totals: Counts = [manifest.counts.DESI, manifest.counts.eROSITA];
const endianness = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
const tolerance = 0.0000001;
const colors = [[0.34, 0.85, 1], [1, 0.72, 0.32]] as const;

const vertex = `#version 300 es
in vec4 point;
uniform vec3 center, right, up, forward;
uniform vec2 scale, range;
uniform float size;
out float depth;
void main() {
  vec3 q = point.xyz - center;
  depth = clamp(dot(q, forward) / 3300.0 + 0.5, 0.0, 1.0);
  gl_Position = vec4(dot(q, right) * scale.x, dot(q, up) * scale.y, 0.0, 1.0);
  if (point.w < range.x || point.w > range.y) gl_Position = vec4(3.0, 3.0, 0.0, 1.0);
  gl_PointSize = size * mix(0.85, 1.15, depth);
}`;

const fragment = `#version 300 es
precision mediump float;
in float depth;
uniform vec3 tint;
uniform float weight;
out vec4 color;
void main() {
  float r = length(gl_PointCoord * 2.0 - 1.0);
  float alpha = (1.0 - smoothstep(0.08, 1.0, r)) * weight * mix(0.72, 1.0, depth);
  color = vec4(tint, alpha);
}`;

function createProgram(gl: WebGL2RenderingContext) {
  const program = gl.createProgram();
  const shaders = [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const;
  for (const [kind, source] of shaders) {
    const shader = gl.createShader(kind)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (compiled) gl.attachShader(program, shader);
    gl.deleteShader(shader);
    if (!compiled) {
      gl.deleteProgram(program);
      throw Error('Observatory shader failed to compile');
    }
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    throw Error('Observatory program failed to link');
  }
  return program;
}

async function readLayer(parts: string[], count: number, hash: string, signal: AbortSignal) {
  async function load(packed: boolean) {
    const bytes = new Uint8Array(count * 16);
    const chunks = await Promise.all(parts.map(async part => {
      const response = await fetch('/observatory/' + (packed ? 'packed-v1/' : '') + part, {signal, priority: 'low'});
      if (!response.ok) throw Error('Observatory data unavailable');
      if (!packed) return new Uint8Array(await response.arrayBuffer());
      const body = response.body;
      if (!body) throw Error('Empty observation payload');
      const shuffled = new Uint8Array(await new Response(body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
      if (shuffled.length % 16 || shuffled.length > bytes.length) throw Error('Invalid packed observation size');
      const records = shuffled.length / 16, raw = new Uint8Array(shuffled.length);
      for (let byte = 0; byte < 16; byte++) for (let i = 0; i < records; i++) raw[i * 16 + byte] = shuffled[byte * records + i]!;
      return raw;
    }));
    let offset = 0;
    for (const data of chunks) { bytes.set(data, offset); offset += data.byteLength; }
    if (offset !== bytes.byteLength) throw Error('Unexpected observatory data size');
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    if (Array.from(digest, val => val.toString(16).padStart(2, '0')).join('') !== hash) throw Error('Observatory data integrity check failed');
    return bytes;
  }
  let bytes: Uint8Array;
  if (typeof DecompressionStream === 'function') {
    try { bytes = await load(true); }
    catch { signal.throwIfAborted(); bytes = await load(false); }
  } else bytes = await load(false);
  if (endianness) return new Float32Array(bytes.buffer);
  const view = new DataView(bytes.buffer);
  return Float32Array.from({length: count * 4}, (_, i) => view.getFloat32(i * 4, true));
}

export async function mountObservatory(host: HTMLElement, callbacks: Callbacks, signal: AbortSignal) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false, powerPreference: 'low-power'});
  if (!gl) throw Error('WebGL 2 unavailable');

  const program = createProgram(gl);
  const buffers: WebGLBuffer[] = [];
  try {
    const points = await Promise.all(manifest.parts.map((parts, i) => readLayer(parts, totals[i]!, manifest.payload_sha256[i]!, signal)));
    signal.throwIfAborted();
    gl.useProgram(program);
    const point = gl.getAttribLocation(program, 'point');
    gl.enableVertexAttribArray(point);
    for (const pointsOfLayer of points) {
      const buffer = gl.createBuffer();
      buffers.push(buffer);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, pointsOfLayer, gl.STATIC_DRAW);
    }
    if (gl.getError() !== gl.NO_ERROR) throw Error('Observatory data upload failed');

    const names = ['center', 'right', 'up', 'forward', 'scale', 'range', 'size', 'tint', 'weight'] as const;
    const uniforms = Object.fromEntries(names.map(name => [name, gl.getUniformLocation(program, name)])) as Record<typeof names[number], WebGLUniformLocation | null>;
    gl.uniform3fv(uniforms.center, manifest.camera_center_Mpc);
    gl.clearColor(5 / 255, 7 / 255, 13 / 255, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    let yaw = yawStart, pitch = pitchStart, zoom = 1;
    let selection: Selection = {min: 0.1, max: 0.4, layers: [true, true]};
    let lastCounts: Counts = [-1, -1], lastCountTime = -Infinity;
    let playing = false, visible = false, running = false, stopped = false;
    let frame = 0, pendingDraw = 0, settleTimer = 0, lastFrameTime = -Infinity, dpr = 1;
    let quality = 1, frameInterval = 33;
    let slowFrames = 0, fastFrames = 0, lastTick = -Infinity;
    const [cx, cy, cz] = manifest.camera_center_Mpc as [number, number, number];

    function draw(time: number) {
      const cyaw = Math.cos(yaw), syaw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const width = canvas.width, height = canvas.height;
      const fit = Math.min(width * 0.94 / manifest.display_half_extents_Mpc[0]!, height * 0.92 / manifest.display_half_extents_Mpc[1]!) * zoom;
      const sx = fit / width, sy = fit / height;
      const low = selection.min - tolerance, high = selection.max + tolerance;
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.uniform3f(uniforms.right, cyaw, syaw, 0);
      gl!.uniform3f(uniforms.up, -cp * syaw, cp * cyaw, sp);
      gl!.uniform3f(uniforms.forward, sp * syaw, -sp * cyaw, cp);
      gl!.uniform2f(uniforms.scale, sx, sy);
      gl!.uniform2f(uniforms.range, low, high);

      const recount = time - lastCountTime >= 500;
      const counts: Counts = [0, 0];
      for (const [i, buffer] of buffers.entries()) {
        if (!selection.layers[i]) continue;
        gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
        gl!.vertexAttribPointer(point, 4, gl!.FLOAT, false, 16, 0);
        gl!.uniform3fv(uniforms.tint, colors[i]!);
        gl!.uniform1f(uniforms.weight, i === 0 ? 0.48 : 0.95);
        gl!.uniform1f(uniforms.size, Math.max(1, (i === 0 ? 1.9 : 4.7) * dpr));
        gl!.drawArrays(gl!.POINTS, 0, totals[i]!);
        if (!recount) continue;

        const values = points[i]!;
        let count = 0;
        for (let j = 0; j < values.length; j += 4) {
          const redshift = values[j + 3]!;
          if (redshift < low || redshift > high) continue;
          const x = values[j]! - cx, y = values[j + 1]! - cy, z = values[j + 2]! - cz;
          const u = (x * cyaw + y * syaw) * sx;
          const v = ((-x * syaw + y * cyaw) * cp + z * sp) * sy;
          if (Math.abs(u) <= 1 && Math.abs(v) <= 1) count++;
        }
        counts[i] = count;
      }
      if (recount) {
        lastCountTime = time;
        if (counts[0] !== lastCounts[0] || counts[1] !== lastCounts[1]) {
          lastCounts = counts;
          callbacks.counts(counts);
        }
      }
    }

    function redraw() {
      if (stopped) return;
      lastCountTime = -Infinity;
      draw(performance.now());
    }

    function requestDraw(exact = false) {
      if (stopped) return;
      if (exact) lastCountTime = -Infinity;
      clearTimeout(settleTimer);
      settleTimer = window.setTimeout(redraw, 125);
      if (pendingDraw) return;
      pendingDraw = requestAnimationFrame(() => {
        pendingDraw = 0;
        draw(performance.now());
      });
    }

    function animate(time: number) {
      if (!running) return;
      const elapsed = time - lastFrameTime;
      const tickInterval = time - lastTick;
      lastTick = time;
      if (elapsed >= frameInterval - 1) {
        yaw += Math.min(elapsed, 150) * 0.000075;
        lastFrameTime = time;
        const before = performance.now();
        draw(time);
        const slow = performance.now() - before > frameInterval * 0.75 || elapsed > frameInterval * 1.8;
        if (slow) { slowFrames++; fastFrames = 0; }
        else if (tickInterval < 25) { fastFrames++; slowFrames = Math.max(0, slowFrames - 1); }
        if (slowFrames >= 4) {
          quality = Math.max(0.45, quality * 0.8);
          frameInterval = Math.min(125, Math.ceil(frameInterval * 1.45));
          slowFrames = 0;
          resize();
        } else if (fastFrames >= 180 && quality < 1) {
          quality = Math.min(1, quality + 0.1);
          frameInterval = Math.max(33, frameInterval - 5);
          fastFrames = 0;
          resize();
        }
      }
      frame = requestAnimationFrame(animate);
    }

    function reconcile() {
      const next = !stopped && playing && visible && !document.hidden;
      if (running === next) return;
      running = next;
      callbacks.running(running);
      if (!running) {
        cancelAnimationFrame(frame);
        return;
      }
      lastFrameTime = performance.now();
      lastTick = lastFrameTime;
      frame = requestAnimationFrame(animate);
    }

    function resize() {
      const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, width < 500 ? 1.25 : 1.65, Math.sqrt(900_000 / (width * height))) * quality;
      const w = Math.max(1, Math.round(width * dpr)), h = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl!.viewport(0, 0, w, h);
      redraw();
    }

    function dispose() {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(pendingDraw);
      clearTimeout(settleTimer);
      reconcile();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', reconcile);
      canvas.removeEventListener('webglcontextlost', lose);
      for (const buffer of buffers) gl!.deleteBuffer(buffer);
      gl!.deleteProgram(program);
      canvas.remove();
    }

    function lose(event: Event) {
      event.preventDefault();
      dispose();
      callbacks.failed();
    }

    canvas.addEventListener('webglcontextlost', lose);
    document.addEventListener('visibilitychange', reconcile);
    host.append(canvas);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      reconcile();
    }, {threshold: 0.01});
    intersection.observe(host);
    resize();
    return {
      rotate(dx: number, dy: number) {
        yaw += dx * 0.008;
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch + dy * 0.008));
        requestDraw();
      },
      zoomBy(factor: number) {
        zoom = Math.max(0.78, Math.min(8, zoom * factor));
        requestDraw();
      },
      reset() {
        yaw = yawStart;
        pitch = pitchStart;
        zoom = 1;
        requestDraw(true);
      },
      select(next: Selection) {
        selection = next;
        requestDraw(true);
      },
      play(value: boolean) {
        playing = value;
        reconcile();
      },
      exportPNG(onBlob: (blob: Blob | null) => void) {
        redraw();
        canvas.toBlob(onBlob, 'image/png');
      },
      dispose,
    };
  } catch (error) {
    for (const buffer of buffers) gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    throw error;
  }
}

export type Observatory = Awaited<ReturnType<typeof mountObservatory>>;
