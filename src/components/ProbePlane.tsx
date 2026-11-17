'use client';
import {useId, useState} from 'react';
import dynamic from 'next/dynamic';
import {baoFootprint, LIVE_RESULT_PLANCK_REFERENCE as planck, LIVE_RESULT_PROBES as probes, LIVE_RESULT_PROBE_IDS as ids, LIVE_RESULT_SCENARIOS as scenarios, liveResultNumber, type PlanePoint, type ProbeId, type ScenarioId} from '@/lib/live-result';
import type {Locale} from '@/lib/i18n';
import styles from './LiveResult.module.css';

const BaoSurface = dynamic(() => import('./BaoSurface'), {ssr: false});
const labels = {cmb:'Planck', bao:'DESI', des:'DES', pantheon:'Pantheon+', ladder:'SH0ES'};


export function ProbePlane({locale, scenario}: {locale: Locale; scenario: ScenarioId}) {
  const pt = locale === 'pt', clip = useId();
  const [zoom, setZoom] = useState(0);
  const [surface, setSurface] = useState(false);
  const [selected, setSelected] = useState<ProbeId[]>([]);
  const [focus, setFocus] = useState<ProbeId | null>(null);
  const toggle = (id: ProbeId) => setSelected(old=>old.includes(id) ? old.filter(v=>v!==id) : [...old,id]);
  const f = (v:number,n:number) => liveResultNumber(v,n,locale);
  const [xmin,xmax,ymin,ymax] = zoom===2 ? [.27,.34,65,73] : zoom===1 ? [.26,.38,62,76] : [.24,.40,60,78];
  const x = (v:number)=>51+(v-xmin)/(xmax-xmin)*348;
  const y = (v:number)=>240-(v-ymin)/(ymax-ymin)*211;
  const path = (points: readonly PlanePoint[])=>points.map((p,i)=>(i?'L':'M')+x(p.omegaM).toFixed(2)+' '+y(p.h0).toFixed(2)).join(' ')+'Z';
  const band = (x0:number,x1:number,y0:number,y1:number)=> 'M'+x(x0)+' '+y(y0)+'H'+x(x1)+'V'+y(y1)+'H'+x(x0)+'Z';
  const densities = [planck.omegaMh2+planck.sigmaOmegaMh2,planck.omegaMh2-planck.sigmaOmegaMh2];
  const cmb = densities.flatMap((d,j)=>Array.from({length:65},(_,i)=>{const m=xmin+(xmax-xmin)*(j ? 64-i : i)/64;return {omegaM:m,h0:100*Math.sqrt(d/m)};}));
  const anchor = scenarios[scenario].bao ?? probes.bao.anchor as PlanePoint;
  const joint = scenarios[scenario].joint;
  const region = (id:ProbeId) => {
    if (id==='bao') return <>{([95,68] as const).map(level=>{const pts=baoFootprint(scenario,level);return pts && <path key={level} data-level={level} d={path(pts)} fillOpacity={level===68 ? .14 : .05}/>;})}
      <circle cx={x(anchor.omegaM)} cy={y(anchor.h0)} r="3" fill="currentColor"/></>;
    if (id==='cmb') return <><path d={path(cmb)}/><circle cx={x(.3151)} cy={y(67.36)} r="2.7" fill="currentColor"/></>;
    const a=probes[id].anchor;
    return <path d={id==='ladder' ? band(xmin,xmax,a.h0!-a.sigmaH0!,a.h0!+a.sigmaH0!) : band(a.omegaM!-a.sigmaOmegaM!,a.omegaM!+a.sigmaOmegaM!,ymin,ymax)}/>;
  };
  const xticks = Array.from({length:9},(_,i)=>.24+.02*i).filter(n=>n>=xmin-1e-6 && n<=xmax+1e-6);
  const yticks = Array.from({length:10},(_,i)=>60+2*i).filter(n=>n>=ymin && n<=ymax);
  const cm=Math.max(xmin+.008,.267);
  const labelAt:Record<ProbeId,[number,number]>={
    cmb:[cm,100*Math.sqrt(planck.omegaMh2/cm)+.45],
    bao:[anchor.omegaM-.008,anchor.h0-1.65],des:[.352,ymin+.72],
    pantheon:[.331,ymin+1.55],ladder:[xmax-.012,73.04]
  };
  const baseline=probes.bao.anchor as PlanePoint;
  return <section className={styles.plot} aria-labelledby="live-plane-title">
    <div className={styles.plotHeader}><div><h2 id="live-plane-title">Ωₘ × H₀</h2><p>ΛCDM · {pt?'geometria plana':'flat geometry'}</p></div>
      <button type="button" className={styles.mode} aria-pressed={surface} onClick={()=>setSurface(v=>!v)}>{surface ? (pt?'Voltar a 2D':'Back to 2D') : '3D · BAO'}</button></div>
    {surface ? <BaoSurface locale={locale} cut={scenario==='withoutLrg2'}/> : <>
    <svg className={styles.plane} viewBox="0 0 418 277" role="img" aria-label={pt?'Restrições em Ωₘ e H₀ por sonda, vista superior':'Probe constraints in Ωₘ and H₀, top view'}>
      <defs><clipPath id={clip}><rect x="51" y="29" width="348" height="211"/></clipPath></defs>
      <text x="51" y="17" className={styles.axisTitle}>H₀ (km/s/Mpc)</text>
      {yticks.map(n=><g key={n}><path className={styles.grid} d={'M51 '+y(n)+'H399'}/><text x="44" y={y(n)+4} textAnchor="end">{n}</text></g>)}
      {xticks.map((n,i)=><g key={i}><path className={styles.grid} d={'M'+x(n)+' 29V240'}/>{(zoom>0 || i%2===0) && <text x={x(n)} y="255" textAnchor="middle">{f(n,2)}</text>}</g>)}
      <text x="225" y="273" textAnchor="middle" className={styles.axisTitle}>Ωₘ</text>
      <g clipPath={'url(#'+clip+')'}>
      {(['des','pantheon','ladder','cmb','bao'] as const).map(id=><g key={id} data-series={id} className={styles.series}
        opacity={(focus && focus!==id) || (!focus && selected.length>0 && !selected.includes(id)) ? .25 : 1}
        style={{color:'var(--'+id+')'}} onMouseEnter={()=>setFocus(id)} onMouseLeave={()=>setFocus(null)} onClick={()=>toggle(id)}>
        {region(id)}
        {id==='bao' && <path d={'M'+x(anchor.omegaM)+' '+(y(anchor.h0)+4)+'L'+x(labelAt.bao[0])+' '+(y(labelAt.bao[1])-5)} strokeWidth=".8" fill="none"/>}
        <text className={styles.direct} x={x(labelAt[id][0])} y={y(labelAt[id][1])} textAnchor="middle">{labels[id]}</text>

      </g>)}
      {scenario!=='baseline' && <g data-reference="bao" stroke="var(--ink)" strokeWidth="1.1" strokeDasharray="4 3" fill="none" pointerEvents="none">
        <path d={path(baoFootprint('baseline',68)!)}/><path d={path(baoFootprint('baseline',95)!)}/>
        <circle cx={x(baseline.omegaM)} cy={y(baseline.h0)} r="4.4"/></g>}
      {joint && <g><path d={'M'+x(joint.omegaM)+' '+(y(joint.h0)-4)+'l4 4 -4 4 -4 -4Z'} fill="var(--ink)"/><text x={x(joint.omegaM)+7} y={y(joint.h0)-4} className={styles.joint}>Planck + DESI</text></g>}
      </g><path d="M51 29V240H399" stroke="currentColor" fill="none"/>
    </svg>
    <div className={styles.toolbar}><button type="button" disabled={zoom===2} onClick={()=>setZoom(v=>v+1)} aria-label={pt?'Aproximar':'Zoom in'}>+</button><button type="button" disabled={!zoom} onClick={()=>setZoom(v=>v-1)} aria-label={pt?'Afastar':'Zoom out'}>−</button><button type="button" disabled={!zoom} onClick={()=>setZoom(0)}>{pt?'Restaurar escala':'Reset scale'}</button></div>
    <p className={styles.caption}>{pt?'DESI · contornos conjuntos de 68% e 95% com régua fixa. Faixas · ±1σ em uma grandeza. Pontos · valores da síntese.':'DESI · joint 68% and 95% contours at fixed ruler. Bands · ±1σ in one quantity. Points · synthesis values.'} {scenario!=='baseline' && <strong>{pt?'Tracejado · BAO de referência.':'Dashed · reference BAO.'}</strong>}</p>
    <ul className={styles.legend} aria-label={pt?'Selecionar sondas para comparar':'Select probes to compare'}>{ids.map(id=><li key={id}><button type="button" data-probe={id} aria-pressed={selected.includes(id)} onClick={()=>toggle(id)} onFocus={()=>setFocus(id)} onBlur={()=>setFocus(null)} onMouseEnter={()=>setFocus(id)} onMouseLeave={()=>setFocus(null)}><i aria-hidden="true"/>{probes[id].shortLabel[locale]}</button></li>)}</ul>
    </>}
  </section>;
}
