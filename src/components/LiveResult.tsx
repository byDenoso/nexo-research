'use client';

import {useEffect, useRef, useState, type KeyboardEvent} from 'react';
import type {Locale} from '@/lib/i18n';
import {
  LIVE_RESULT_BAO_CONTOUR_NOTE, LIVE_RESULT_COMPARISONS, LIVE_RESULT_IMPLIED,
  LIVE_RESULT_PLANCK_REFERENCE, LIVE_RESULT_PROBE_IDS, LIVE_RESULT_PROBES,
  LIVE_RESULT_SCENARIO_IDS, LIVE_RESULT_SCENARIOS, LIVE_RESULT_SOURCE_LINKS, LIVE_RESULT_STATUS,
  liveResultNumber, type LiveResultSourceId, type ProbeAnchor, type ProbeId, type ScenarioId
} from '@/lib/live-result';
import type {createLiveResultScene} from './live-result-scene';
import styles from './LiveResult.module.css';

type Scene = Awaited<ReturnType<typeof createLiveResultScene>>;
type Engine = 'loading' | 'webgpu' | 'webgl2' | 'unavailable';
const EMPTY: ReadonlySet<ProbeId> = new Set();

function SourceLink({id, locale}: {id: LiveResultSourceId; locale: Locale}) {
  const source = LIVE_RESULT_SOURCE_LINKS[id];
  return 'href' in source ? <a href={source.href}>{source.label[locale]}</a> : <span>{source.label[locale]}</span>;
}

function readAnchor(anchor: ProbeAnchor, locale: Locale) {
  const format = (value: number, places: number) => liveResultNumber(value,places,locale);
  const get = (value: number | undefined, sigma: number | undefined, places: number, variable: string) =>
    value === undefined ? null : `${variable} ${format(value,places)}${sigma === undefined ? '' : ` ± ${format(sigma,places)}`}`;
  return [get(anchor.omegaM,anchor.sigmaOmegaM,anchor.sigmaOmegaM === undefined ? 4 : 3,'Ωₘ'),get(anchor.h0,anchor.sigmaH0,2,'H₀')].filter(Boolean).join(' · ');
}

export function LiveResult({locale}: {locale: Locale}) {
  const pt = locale === 'pt';
  const [scenario, setScenario] = useState<ScenarioId>('baseline');
  const [hidden,setHidden] = useState<ReadonlySet<ProbeId>>(EMPTY);
  const [light,setLight] = useState(false);
  const [engine,setEngine] = useState<Engine>('loading');
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const omegaAxis = useRef<HTMLSpanElement>(null);
  const hAxis = useRef<HTMLSpanElement>(null);
  const scene = useRef<Scene | null>(null);
  const latest = useRef({scenario,hidden});
  const current = LIVE_RESULT_SCENARIOS[scenario];
  const active3d = !light && (engine === 'webgpu' || engine === 'webgl2');
  const f = (value: number,places: number) => liveResultNumber(value,places,locale);
  const anchorFor = (id: ProbeId) => id === 'bao' && current.bao ? current.bao : LIVE_RESULT_PROBES[id].anchor;

  useEffect(() => {
    latest.current = {scenario,hidden};
    scene.current?.setView({...latest.current,dark:document.documentElement.dataset.theme === 'dark',reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
  },[scenario,hidden]);

  useEffect(() => {
    const root = frame.current, element = canvas.current, x = omegaAxis.current, z = hAxis.current;
    if (light || !root || !element || !x || !z) return;
    let cancelled = false, abandoned = false;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const readView = () => ({...latest.current,dark:document.documentElement.dataset.theme === 'dark',reducedMotion:motion.matches});
    const sync = () => scene.current?.setView(readView());
    const theme = new MutationObserver(sync);
    const fail = () => {
      if (cancelled || abandoned) return;
      abandoned = true;
      clearTimeout(watchdog);
      scene.current?.dispose();
      scene.current = null;
      setEngine('unavailable');
    };
    const watchdog = window.setTimeout(fail,8500);
    theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    motion.addEventListener('change',sync);
    import('./live-result-scene').then(({createLiveResultScene}) => {
      if (cancelled || abandoned) return;
      return createLiveResultScene(element,root,[x,z],readView(),fail);
    }).then(created => {
      if (!created) return;
      if (cancelled || abandoned) { created.dispose(); return; }
      clearTimeout(watchdog);
      scene.current = created;
      sync();
      setEngine(created.backend);
    }).catch(fail);
    return () => {
      cancelled = true;
      clearTimeout(watchdog);
      scene.current?.dispose();
      scene.current = null;
      theme.disconnect();
      motion.removeEventListener('change',sync);
    };
  },[light]);

  function choose(next: ScenarioId) {
    const target = scenario === next ? 'baseline' : next;
    const show = target === 'desOffset' ? 'des' : LIVE_RESULT_SCENARIOS[target].bao ? 'bao' : null;
    if (show && hidden.has(show)) setHidden(previous => new Set([...previous].filter(id => id !== show)));
    setScenario(target);
  }

  function toggleProbe(probe: ProbeId) {
    setHidden(previous => {
      const next = new Set(previous);
      if (next.has(probe)) next.delete(probe);
      else next.add(probe);
      return next;
    });
  }

  function onCameraKey(event: KeyboardEvent<HTMLCanvasElement>) {
    const view = scene.current;
    if (!view) return;
    switch (event.key) {
      case 'ArrowLeft': view.move(0.16,0); break;
      case 'ArrowRight': view.move(-0.16,0); break;
      case 'ArrowUp': view.move(0,-0.12); break;
      case 'ArrowDown': view.move(0,0.12); break;
      case '+': case '=': view.move(0,0,-0.14); break;
      case '-': view.move(0,0,0.14); break;
      case 'Home': view.reset(); break;
      default: return;
    }
    event.preventDefault();
  }

  const planck = LIVE_RESULT_PLANCK_REFERENCE;
  const references = [...new Set<LiveResultSourceId>([...LIVE_RESULT_PROBE_IDS.flatMap(id=>LIVE_RESULT_PROBES[id].sourceIds),...current.sourceIds])];
  const controls = () => <div className={styles.options} role="group" aria-label={pt ? 'Cenários de comparação' : 'Comparison scenarios'}>
    {LIVE_RESULT_SCENARIO_IDS.filter(id=>id!=='baseline').map(id=><button key={id} type="button" aria-pressed={scenario===id} onClick={()=>choose(id)}>
      <span>{LIVE_RESULT_SCENARIOS[id].label[locale]}</span><i aria-hidden="true"/>
    </button>)}
  </div>;
  return <div className={styles.experience}>
    <div className={styles.workspace}>
      <section className={styles.plot} aria-labelledby="live-plane-title">
        <div className={styles.plotHeader}>
          <div><h2 id="live-plane-title">Ωₘ × h</h2><p>{pt ? 'Matéria e expansão no ΛCDM plano' : 'Matter and expansion in flat ΛCDM'}</p></div>
          <button className={styles.mode} type="button" aria-pressed={light || engine === 'unavailable'}
            disabled={engine === 'unavailable' && !light} onClick={() => { if (light) setEngine('loading'); setLight(!light); }}>
            {light ? (pt ? 'Abrir em 3D' : 'Open in 3D') : (pt ? 'Modo leve' : 'Lite mode')}
          </button>
        </div>
        <div className={styles.stage} ref={frame} data-renderer={active3d ? engine : 'text'}>
          <canvas key={light ? 'lite' : 'gpu'} className={styles.canvas} ref={canvas} data-active={active3d} tabIndex={active3d ? 0 : -1}
            role="img" aria-hidden={!active3d} aria-describedby="live-gesture" onKeyDown={onCameraKey}
            aria-label={pt ? 'Cena tridimensional comparando sondas em Ωₘ e h' : 'Three-dimensional scene comparing probes in Ωₘ and h'}/>
          <span ref={omegaAxis} className={styles.axis} hidden={!active3d} aria-hidden="true">Ωₘ</span>
          <span ref={hAxis} className={styles.axis} hidden={!active3d} aria-hidden="true">h</span>
          {active3d ? <div className={styles.camera} aria-label={pt ? 'Controles da câmera' : 'Camera controls'} role="group">
            <button aria-label={pt ? 'Aproximar' : 'Zoom in'} title={pt ? 'Aproximar' : 'Zoom in'} onClick={()=>scene.current?.move(0,0,-0.14)} type="button">+</button>
            <button aria-label={pt ? 'Afastar' : 'Zoom out'} title={pt ? 'Afastar' : 'Zoom out'} onClick={()=>scene.current?.move(0,0,0.14)} type="button">−</button>
            <button aria-label={pt ? 'Recentrar câmera' : 'Recenter camera'} title={pt ? 'Recentrar câmera' : 'Recenter camera'} onClick={()=>scene.current?.reset()} type="button">↺</button>
          </div> : <div className={styles.readout}>
            <p>{light || engine === 'unavailable' ? (pt ? 'Leitura sem 3D' : 'Read without 3D') : (pt ? 'Leitura dos dados' : 'Data readout')}</p>
            <dl>
              {LIVE_RESULT_PROBE_IDS.filter(id=>!hidden.has(id)).map(id=><div key={id}><dt>{LIVE_RESULT_PROBES[id].shortLabel[locale]}</dt><dd>{readAnchor(anchorFor(id),locale)}</dd></div>)}
              {current.joint && <div><dt>Planck + DESI</dt><dd>{readAnchor(current.joint,locale)}</dd></div>}
            </dl>
            {hidden.size === LIVE_RESULT_PROBE_IDS.length && <p>{pt ? 'Use a legenda para mostrar uma sonda.' : 'Use the legend to show a probe.'}</p>}
          </div>}
        </div>
        <div className={styles.mobileOptions}>
          <h3>{pt ? 'O que muda se…' : 'What changes if…'}</h3>
          {controls()}
          <p aria-live="polite">{current.consequence[locale]}</p>
        </div>
        <p id="live-gesture" className={styles.gesture}>{pt ? 'Arraste para girar. No teclado, use as setas e as teclas + e −.' : 'Drag to orbit. On a keyboard, use the arrows and the + and − keys.'}</p>
        <ul className={styles.legend} aria-label={pt ? 'Sondas visíveis' : 'Visible probes'}>
          {LIVE_RESULT_PROBE_IDS.map(id => <li key={id}><button type="button" data-probe={id} aria-pressed={!hidden.has(id)} onClick={()=>toggleProbe(id)}>
            <i aria-hidden="true"/><span>{LIVE_RESULT_PROBES[id].shortLabel[locale]}</span>
          </button></li>)}
        </ul>
      </section>

      <section className={styles.side} aria-labelledby="live-scenarios-title">
        <div className={styles.desktopOptions}>
          <h2 id="live-scenarios-title">{pt ? 'O que muda se…' : 'What changes if…'}</h2>
          <p className={styles.sideIntro}>{pt ? 'Compare uma hipótese por vez.' : 'Compare one assumption at a time.'}</p>
          {controls()}
        </div>
        <div className={styles.effect} aria-live="polite" data-scenario={scenario}>
          <h2 className={styles.mobileEffect}>{pt ? 'Detalhes do cenário' : 'Scenario details'}</h2>
          <p className={styles.status} data-status={current.status}>{LIVE_RESULT_STATUS[current.status][locale]}</p>
          <p className={styles.consequence}>{current.consequence[locale]}</p>
          {(current.bao || current.joint) && <p className={styles.changedAnchor}>
            {current.joint ? 'Planck + DESI' : 'BAO'} <span>{readAnchor(current.bao ?? current.joint!,locale)}</span>
          </p>}
          {current.metrics.length>0 && <dl className={styles.metrics}>
            {current.metrics.map(metric=><div key={metric.label.en}><dt>{metric.label[locale]}</dt><dd>
              {metric.previous !== undefined && <><span>{f(metric.previous,metric.decimals)}</span><b aria-hidden="true"> → </b></>}
              <strong>{f(metric.value,metric.decimals)}</strong>{metric.unit && ` ${metric.unit}`}
            </dd></div>)}
          </dl>}
          {scenario==='shortRuler' && <p className={styles.adjustment}>{pt ? 'BAO × escada' : 'BAO × ladder'} <strong>
            {f(LIVE_RESULT_COMPARISONS.find(item=>item.scenario==='baseline' && item.label.en==='BAO × ladder')!.sigma,2)} → {f(LIVE_RESULT_COMPARISONS.find(item=>item.scenario==='shortRuler')!.sigma,2)} σ
          </strong></p>}
          <p className={styles.variantDetail}>{current.description[locale]}</p>
        </div>
      </section>
    </div>
    <div className={styles.documentation}>
      <div className={styles.paramNote}>
        <p>{pt ? 'Ωₘ é a fração de matéria. h expressa H₀ em unidades de 100 km/s/Mpc. Os valores de H₀ abaixo estão em km/s/Mpc.' : 'Ωₘ is the matter fraction. h expresses H₀ in units of 100 km/s/Mpc. H₀ values below are in km/s/Mpc.'}</p>
        <p>{pt ? 'A altura das faixas ajuda a enxergar onde elas se cruzam. A concordância estatística depende das incertezas e das hipóteses do ajuste.' : 'The bands have height so their intersections are visible. Statistical agreement depends on the uncertainties and assumptions of the fit.'}</p>
        {(scenario==='shortRuler' || scenario==='withoutLrg2') && <p>{pt ? 'O traço fino em ciano marca a posição de referência do BAO.' : 'The thin teal outline marks the reference BAO position.'}</p>}
      </div>
      <details>
        <summary>{pt ? 'Valores, faixas e comparações' : 'Values, bands and comparisons'}</summary>
        <div className={styles.detailsBody}>
          {LIVE_RESULT_PROBE_IDS.map(id => {
            const probe = LIVE_RESULT_PROBES[id];
            return <div className={styles.probeDetails} key={id}>
              <h3>{probe.label[locale]}</h3><p className={styles.data}>{readAnchor(anchorFor(id),locale)}</p>
              <p>{probe.description[locale]} {id==='bao' && LIVE_RESULT_BAO_CONTOUR_NOTE[locale]}</p>
              {id==='cmb' && <p className={styles.data}>Ωₘh² {f(planck.omegaMh2,4)} ± {f(planck.sigmaOmegaMh2,4)} · 100θ* {f(planck.theta100,5)} ± {f(planck.sigmaTheta100,5)}</p>}
              <p className={styles.sourceLabel}>{LIVE_RESULT_STATUS[probe.status][locale]}</p>
            </div>;
          })}
          <div className={styles.probeDetails}>
            <h3>{pt ? 'H₀ se a densidade física for a do Planck' : 'H₀ at the Planck physical matter density'}</h3>
            <p>{pt ? 'Valores condicionados a Ωₘh² fixo. A referência BAO usa a régua padrão.' : 'Values conditioned on fixed Ωₘh². The BAO reference uses the standard ruler.'}</p>
            <dl className={styles.readings}>{LIVE_RESULT_IMPLIED.map(({probe,h0})=><div key={probe}><dt>{LIVE_RESULT_PROBES[probe].shortLabel[locale]}</dt><dd>{f(h0,1)}</dd></div>)}</dl>
          </div>
          <div className={styles.probeDetails}>
            <h3>{pt ? 'Distâncias entre pares' : 'Pairwise separations'}</h3>
            <p>{pt ? 'Comparações provisórias da configuração de referência e do cenário de régua curta.' : 'Provisional comparisons for the reference and short-ruler scenarios.'}</p>
            <dl className={styles.readings}>{LIVE_RESULT_COMPARISONS.map(item=><div key={item.label.en}><dt>{item.label[locale]}</dt><dd>{f(item.sigma,2)} σ</dd></div>)}</dl>
          </div>
        </div>
      </details>
      <details>
        <summary>{pt ? 'Fontes e estado da evidência' : 'Sources and evidence status'}</summary>
        <div className={styles.detailsBody}>
          <p>{pt ? 'As referências publicadas dão as medidas das sondas. As comparações de sensibilidade do NEXO são provisórias, com o teste do offset do DES submetido à Physical Review D.' : 'Published references give the probe measurements. The NEXO sensitivity comparisons are provisional. The DES offset analysis has been submitted to Physical Review D.'}</p>
          <ul>{references.map(id=><li key={id}><SourceLink id={id} locale={locale}/></li>)}</ul>
        </div>
      </details>
    </div>
  </div>;
}
