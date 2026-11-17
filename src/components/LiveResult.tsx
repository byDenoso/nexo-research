'use client';

import {useEffect, useMemo, useState} from 'react';
import type {Locale} from '@/lib/i18n';
import {
  LIVE_RESULT_BAO_CONTOUR_NOTE, LIVE_RESULT_COMPARISONS, LIVE_RESULT_IMPLIED,
  LIVE_RESULT_PLANCK_REFERENCE, LIVE_RESULT_PROBE_IDS, LIVE_RESULT_PROBES,
  LIVE_RESULT_SCENARIO_IDS, LIVE_RESULT_SCENARIOS, LIVE_RESULT_SOURCE_LINKS, LIVE_RESULT_STATUS,
  liveResultNumber, type LiveResultSourceId, type ProbeAnchor, type ProbeId, type ScenarioId
} from '@/lib/live-result';
import {pairedLrg2Shift} from '@/lib/live-result-bao';
import {ProbePlane} from './ProbePlane';
import styles from './LiveResult.module.css';

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
  const paired = useMemo(()=>scenario==='withoutLrg2' ? pairedLrg2Shift() : null,[scenario]);
  const current = LIVE_RESULT_SCENARIOS[scenario];
  const f = (value: number,places: number) => liveResultNumber(value,places,locale);
  const anchorFor = (id: ProbeId) => id === 'bao' && current.bao ? current.bao : LIVE_RESULT_PROBES[id].anchor;

  useEffect(()=>{
    const read=()=>{const value=new URLSearchParams(location.search).get('scenario');setScenario(LIVE_RESULT_SCENARIO_IDS.find(id=>id===value) ?? 'baseline');};
    read(); window.addEventListener('popstate',read); return ()=>window.removeEventListener('popstate',read);
  },[]);
  function changeScenario(id:ScenarioId) {
    setScenario(id);
    const url=new URL(location.href);
    if(id==='baseline') url.searchParams.delete('scenario'); else url.searchParams.set('scenario',id);
    history.replaceState(history.state,'',url);
  }
  const planck = LIVE_RESULT_PLANCK_REFERENCE;
  const references = [...new Set<LiveResultSourceId>([...LIVE_RESULT_PROBE_IDS.flatMap(id=>LIVE_RESULT_PROBES[id].sourceIds),...current.sourceIds])];
  return <div className={styles.experience}>
    <div className={styles.selector}><label>{pt?'Cenário':'Scenario'} <select value={scenario} onChange={e=>changeScenario(e.target.value as ScenarioId)}>{LIVE_RESULT_SCENARIO_IDS.map(id=><option key={id} value={id}>{LIVE_RESULT_SCENARIOS[id].label[locale]}</option>)}</select></label>
      <span className={styles.status}>{pt?'Resultado provisório':'Provisional result'}</span></div>
    <div className={styles.workspace}><ProbePlane locale={locale} scenario={scenario}/>
      <section className={styles.side} aria-label={pt?'Comparação com a referência':'Comparison with reference'}>
        <div className={styles.effect} aria-live="polite" data-scenario={scenario}>
          <h2>{pt ? 'Detalhes do cenário' : 'Scenario details'}</h2>
          <p className={styles.status} data-status={current.status}>{LIVE_RESULT_STATUS[current.status][locale]}</p>
          <p className={styles.consequence}>{current.consequence[locale]}</p>
          {(current.bao || current.joint) && <p className={styles.changedAnchor}>
            {current.joint ? 'Planck + DESI' : 'BAO'} <span>{readAnchor(current.bao ?? current.joint!,locale)}</span>
          </p>}
          {paired && <div className={styles.shift}><strong>{pt?'Deslocamento do mínimo BAO':'BAO minimum shift'}</strong>
            <p>ΔH₀ = {f(paired.h0,2)} ± {f(paired.sigmaH0,2)} km/s/Mpc</p><p>ΔΩₘ = +{f(paired.omegaM,4)} ± {f(paired.sigmaOmegaM,4)}</p>
            <small>{pt?'1σ pareado, aproximação linear. Covariância do deslocamento = F⁻¹ do corte − F⁻¹ completo, no mínimo de referência.':'Paired 1σ, linear approximation. Shift covariance = cut F⁻¹ minus full F⁻¹ at the reference minimum.'}</small></div>}
          {scenario==='shortRuler' && <div className={styles.shift}><strong>{pt?'Deslocamento dos pontos da síntese':'Shift of synthesis points'}</strong><p>ΔH₀ = +{f(current.bao!.h0-LIVE_RESULT_PROBES.bao.anchor.h0!,2)} km/s/Mpc · ΔΩₘ = {f(0,4)}</p><small>{pt?'Incertezas pareadas indisponíveis na síntese.':'Paired uncertainties unavailable in the synthesis.'}</small></div>}
          {(scenario==='masslessNeutrinos' || scenario==='desOffset') && <p className={styles.shift}>{scenario==='masslessNeutrinos' ? (pt?'ΔH₀ e ΔΩₘ indisponíveis. Falta o ponto conjunto de referência Planck + DESI e sua covariância pareada.':'ΔH₀ and ΔΩₘ unavailable. The joint Planck + DESI reference point and paired covariance are missing.') : (pt?'ΔH₀ e ΔΩₘ indisponíveis. A análise informa o ganho de ajuste em cada calibração.':'ΔH₀ and ΔΩₘ unavailable. The analysis reports fit gain for each calibration.')}</p>}
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
        <p>{LIVE_RESULT_BAO_CONTOUR_NOTE[locale]}</p>
        <p>{pt?'Planck restringe Ωₘh², com h = H₀/100. As supernovas restringem Ωₘ e a escada SH0ES mede H₀.':'Planck constrains Ωₘh², with h = H₀/100. Supernovae constrain Ωₘ and the SH0ES ladder measures H₀.'}</p>
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
