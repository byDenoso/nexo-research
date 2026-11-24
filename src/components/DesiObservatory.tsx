'use client';

import {useEffect, useRef, useState} from 'react';
import type {KeyboardEvent, PointerEvent} from 'react';
import type {Locale} from '@/lib/i18n';
import {downloadBlob} from './experiments/download';
import type {Observatory, Selection} from './experiments/observatory-renderer';

const defaultSelection: Selection = {min: 0.1, max: 0.4, layers: [true, true]};
const layerNames = ['DESI DR1', 'eROSITA eRASS1'] as const;
const words = {
  pt: {
    title: 'Observatório de estruturas cósmicas',
    preview: 'Projeção inicial em ciano e âmbar das galáxias e aglomerados observados',
    viewport: 'Mapa tridimensional DESI e eROSITA', activate: 'Ativar 3D',
    loading: 'Carregando catálogos…', fallback: 'Prévia estática. A visualização 3D está indisponível neste dispositivo.',
    instructions: 'Arraste ou use as setas para girar. Use a pinça, a roda com o mapa em foco ou os botões para ampliar.',
    redshift: 'Redshift', min: 'Redshift mínimo', max: 'Redshift máximo', catalogues: 'Camadas e objetos visíveis',
    galaxies: 'galáxias', clusters: 'grupos e aglomerados',
    pause: 'Pausar rotação', play: 'Retomar rotação', reset: 'Restaurar câmera',
    zoomIn: 'Ampliar', zoomOut: 'Reduzir', full: 'Tela cheia', close: 'Sair da tela cheia',
    export: 'Exportar PNG', exportFailed: 'Não foi possível exportar o PNG.',
    details: 'Seleção, fontes e créditos',
    method: 'Posições observadas em distâncias comóveis. Redshift entre 0,1 e 0,4, declinação entre −10° e +10°. Modelo ΛCDM plano, H₀ = 70 km/s/Mpc e Ωₘ = 0,3.',
    limits: 'Os catálogos têm seleções e coberturas distintas. A sobreposição mostra posição, sem estabelecer associação física. A contagem considera os centros dentro do enquadramento.',
    provenance: 'Proveniência e SHA-256', credits: 'Créditos completos',
  },
  en: {
    title: 'Cosmic structure observatory',
    preview: 'Initial cyan and amber projection of observed galaxies and clusters',
    viewport: 'Three-dimensional DESI and eROSITA map', activate: 'Enable 3D',
    loading: 'Loading catalogues…', fallback: 'Static preview. The 3D view is unavailable on this device.',
    instructions: 'Drag or use the arrow keys to rotate. Zoom with a pinch, with the wheel while the map is focused, or with the buttons.',
    redshift: 'Redshift', min: 'Minimum redshift', max: 'Maximum redshift', catalogues: 'Layers and visible objects',
    galaxies: 'galaxies', clusters: 'groups and clusters',
    pause: 'Pause rotation', play: 'Resume rotation', reset: 'Reset camera',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', full: 'Fullscreen', close: 'Exit fullscreen',
    export: 'Export PNG', exportFailed: 'PNG export failed.',
    details: 'Selection, sources and credits',
    method: 'Observed positions in comoving distances. Redshift between 0.1 and 0.4, declination between −10° and +10°. Flat ΛCDM model, H₀ = 70 km/s/Mpc and Ωₘ = 0.3.',
    limits: 'The catalogues have different selections and coverage. The overlay shows position without establishing a physical association. Counts include centres in the camera frame.',
    provenance: 'Provenance and SHA-256', credits: 'Full acknowledgments',
  },
} as const;

const icons = {
  minus: <path d="M5 12h14"/>,
  plus: <path d="M5 12h14m-7-7v14"/>,
  pause: <path d="M9 5v14m6-14v14"/>,
  play: <path d="m9 5 11 7-11 7z"/>,
  reset: <path d="M4 11a8 8 0 1 1 3 7M4 6v5h5"/>,
  expand: <path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/>,
  shrink: <path d="M4 9h5V4m6 0v5h5M9 20v-5H4m11 5v-5h5"/>,
  download: <path d="M12 4v11m-4-4 4 4 4-4M5 15v5h14v-5"/>,
};

function Tool({icon, label, onClick, disabled, pressed}: {
  icon: keyof typeof icons; label: string; onClick: () => void; disabled?: boolean; pressed?: boolean;
}) {
  return <button className="desi-tool" type="button" aria-label={label} aria-pressed={pressed} title={label} disabled={disabled} onClick={onClick}>
    <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{icons[icon]}</svg>
  </button>;
}

export function DesiObservatory({locale}: {locale: Locale}) {
  const t = words[locale];
  const pt = locale === 'pt';
  const number = new Intl.NumberFormat(pt ? 'pt-BR' : 'en-US');
  const zNumber = new Intl.NumberFormat(pt ? 'pt-BR' : 'en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const figure = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const observer = useRef<Observatory>(null);
  const start = useRef<() => void>(() => {});
  const pointers = useRef(new Map<number, {x: number; y: number}>());
  const interacting = useRef(false);
  const [mode, setMode] = useState<'preview' | 'loading' | 'live' | 'fallback'>('preview');
  const [playing, setPlaying] = useState(false);
  const [selection, setSelection] = useState(defaultSelection);
  const [counts, setCounts] = useState<[number, number]>([143633, 941]);
  const [expanded, setExpanded] = useState(false);
  const [localFull, setLocalFull] = useState(false);
  const [exportFailed, setExportFailed] = useState(false);
  const live = mode === 'live';

  useEffect(() => {
    const host = stage.current!;
    const frame = figure.current!;
    const abort = new AbortController();
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let started = false;

    const fail = () => {
      observer.current = null;
      setCounts([143633, 941]);
      setSelection(defaultSelection);
      setMode('fallback');
      setPlaying(false);
    };

    const begin = async () => {
      if (started || abort.signal.aborted) return;
      started = true;
      setMode('loading');
      try {
        const {mountObservatory} = await import('./experiments/observatory-renderer');
        const engine = await mountObservatory(host, {
          counts: setCounts,
          running: running => { host.dataset.running = String(running); },
          failed: fail,
        }, abort.signal);
        if (abort.signal.aborted) {
          engine.dispose();
          return;
        }
        observer.current = engine;
        setPlaying(!motion.matches);
        setMode('live');
      } catch {
        if (!abort.signal.aborted) fail();
      }
    };

    start.current = begin;
    const onMotion = () => {
      if (motion.matches) setPlaying(false);
    };
    const onFullscreen = () => setExpanded(document.fullscreenElement === frame);
    motion.addEventListener('change', onMotion);
    document.addEventListener('fullscreenchange', onFullscreen);
    const wheel = (event: WheelEvent) => {
      if (!observer.current || document.activeElement !== host || event.ctrlKey) return;
      event.preventDefault();
      observer.current.zoomBy(Math.exp(-event.deltaY * 0.0015));
    };
    host.addEventListener('wheel', wheel, {passive: false});
    return () => {
      abort.abort();
      motion.removeEventListener('change', onMotion);
      document.removeEventListener('fullscreenchange', onFullscreen);
      host.removeEventListener('wheel', wheel);
      observer.current?.dispose();
      observer.current = null;
    };
  }, []);

  useEffect(() => { observer.current?.select(selection); }, [selection, live]);
  useEffect(() => { observer.current?.play(playing && !interacting.current); }, [playing, live]);

  useEffect(() => {
    if (!localFull) return;
    const frame = figure.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    stage.current?.focus();
    function key(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setLocalFull(false);
      if (event.key !== 'Tab') return;
      const focusables = Array.from(frame.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"], summary, details[open] a[href]'));
      const edge = event.shiftKey ? focusables[0] : focusables.at(-1);
      if (document.activeElement === edge || !frame.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? focusables.at(-1) : focusables[0])?.focus();
      }
    }
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener('keydown', key);
      previousFocus?.focus();
    };
  }, [localFull]);

  useEffect(() => {
    if (!expanded) return;
    stage.current?.focus();
  }, [expanded]);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!observer.current || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus({preventScroll: true});
    pointers.current.set(event.pointerId, {x: event.clientX, y: event.clientY});
    interacting.current = true;
    observer.current.play(false);
  }

  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size) return;
    interacting.current = false;
    observer.current?.play(playing);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const old = pointers.current.get(event.pointerId);
    if (!old || !observer.current) return;
    const next = {x: event.clientX, y: event.clientY};
    pointers.current.set(event.pointerId, next);
    const pair = [...pointers.current.entries()].find(([id]) => id !== event.pointerId)?.[1];
    if (pair) observer.current.zoomBy(Math.hypot(next.x - pair.x, next.y - pair.y) / Math.max(1, Math.hypot(old.x - pair.x, old.y - pair.y)));
    else observer.current.rotate(next.x - old.x, next.y - old.y);
  }

  function onMapKey(event: KeyboardEvent<HTMLDivElement>) {
    const orbit = observer.current;
    if (!orbit) return;
    switch (event.key) {
      case 'ArrowLeft': orbit.rotate(-10, 0); break;
      case 'ArrowRight': orbit.rotate(10, 0); break;
      case 'ArrowUp': orbit.rotate(0, -10); break;
      case 'ArrowDown': orbit.rotate(0, 10); break;
      case '+': case '=': orbit.zoomBy(1.22); break;
      case '-': orbit.zoomBy(1 / 1.22); break;
      default: return;
    }
    event.preventDefault();
  }

  async function toggleFull() {
    if (localFull) return setLocalFull(false);
    if (expanded) return void document.exitFullscreen();
    try {
      await figure.current!.requestFullscreen();
    } catch {
      setLocalFull(true);
    }
  }

  function exportPNG() {
    setExportFailed(false);
    observer.current?.exportPNG(blob => {
      if (blob?.size) downloadBlob(blob, 'NEXO-DESI-eROSITA-3D.png');
      else setExportFailed(true);
    });
  }

  return <figure ref={figure} className="desi-observatory" data-mode={mode} data-expanded={localFull || undefined}
    role={localFull ? 'dialog' : undefined} aria-modal={localFull || undefined} aria-labelledby="desi-title">
    <div className="desi-heading">
      <h2 id="desi-title">{t.title}</h2>
      <span translate="no">DESI × eROSITA</span>
    </div>
    <div className="desi-stage" ref={stage} tabIndex={live ? 0 : undefined} role="group" aria-label={t.viewport}
      aria-describedby={live ? 'desi-instructions' : undefined} data-backend={live ? 'webgl2' : undefined}
      onKeyDown={onMapKey} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
      onPointerUp={pointerUp} onPointerCancel={pointerUp} onLostPointerCapture={pointerUp}>
      {/* The static poster is also the first meaningful paint on clients without WebGL. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/observatory/observatory.webp"
        srcSet="/observatory/observatory-small.webp 720w, /observatory/observatory.webp 1440w"
        sizes="(min-width: 78rem) 730px, (min-width: 56rem) 58vw, 92vw" width="1440" height="810"
        fetchPriority="high" loading="eager" alt={t.preview} aria-hidden={live || undefined} />
      {!live && <div className="desi-stage-status" role="status">
        {mode === 'preview' && <button type="button" className="desi-activate" onClick={() => start.current()}><span aria-hidden="true">◇</span> {t.activate}</button>}
        {mode === 'loading' && <span className="desi-loading"><span aria-hidden="true" />{t.loading}</span>}
        {mode === 'fallback' && <p>{t.fallback}</p>}
      </div>}
    </div>
    <span id="desi-instructions" className="sr-only">{t.instructions}</span>
    <div className="desi-console">
      <div className="desi-layers" role="group" aria-label={t.catalogues}>
        {layerNames.map((name, i) => <label key={name} className="desi-layer" data-catalog={i} data-selected={selection.layers[i]}>
          <input type="checkbox" checked={selection.layers[i]} disabled={!live} onChange={event => {
            const checked = event.target.checked;
            setSelection(current => ({...current, layers: i === 0 ? [checked, current.layers[1]] : [current.layers[0], checked]}));
          }} aria-label={name} />
          <span className="desi-dot" aria-hidden="true"/>
          <span>{name}<small>{i === 0 ? t.galaxies : t.clusters}</small></span>
          <output aria-live="off" data-count={counts[i]}>{number.format(counts[i]!)}</output>
        </label>)}
      </div>
      <div className="desi-toolbar">
        <div className="desi-ranges" role="group" aria-label={t.redshift}>
          <span aria-hidden="true">{t.redshift} <b>{zNumber.format(selection.min)}–{zNumber.format(selection.max)}</b></span>
          <div>
            <input aria-label={t.min} aria-valuetext={zNumber.format(selection.min)} type="range" min="0.1" max="0.4" step="0.01" disabled={!live} value={selection.min}
              onChange={event => { const min = event.target.valueAsNumber; setSelection(current => ({...current, min: Math.min(min, current.max)})); }} />
            <input aria-label={t.max} aria-valuetext={zNumber.format(selection.max)} type="range" min="0.1" max="0.4" step="0.01" disabled={!live} value={selection.max}
              onChange={event => { const max = event.target.valueAsNumber; setSelection(current => ({...current, max: Math.max(max, current.min)})); }} />
          </div>
        </div>
        <div className="desi-tools">
          <Tool icon="minus" label={t.zoomOut} disabled={!live} onClick={() => observer.current?.zoomBy(1 / 1.22)} />
          <Tool icon="plus" label={t.zoomIn} disabled={!live} onClick={() => observer.current?.zoomBy(1.22)} />
          <Tool icon={playing ? 'pause' : 'play'} label={playing ? t.pause : t.play} disabled={!live} onClick={() => setPlaying(v => !v)} />
          <Tool icon="reset" label={t.reset} disabled={!live} onClick={() => observer.current?.reset()} />
          <Tool icon={expanded || localFull ? 'shrink' : 'expand'} label={expanded || localFull ? t.close : t.full} onClick={toggleFull} />
          <Tool icon="download" label={t.export} disabled={!live} onClick={exportPNG} />
        </div>
      </div>
      {exportFailed && <p role="status">{t.exportFailed}</p>}
    </div>
    <figcaption>
      <details><summary>{t.details}</summary>
        <p>{t.method}</p>
        <p>{t.limits}</p>
        <p><a href="https://data.desi.lbl.gov/doc/releases/dr1/">DESI Collaboration · DR1</a> · <a href="https://erosita.mpe.mpg.de/dr1/AllSkySurveyData_dr1/AllSkySurveyData_dr1_info/">eROSITA-DE · eRASS1</a></p>
        <p><a href="/observatory/provenance.json">{t.provenance}</a> · <a href="/observatory/credits.txt">{t.credits}</a></p>
      </details>
    </figcaption>
  </figure>;
}
