'use client';
import {useMemo, useState} from 'react';
import {line} from 'd3-shape';
import {BAO_LEVEL, baoDelta, evaluateProfile, makeBaoFootprint} from '@/lib/live-result-bao';
import {baoGrid, baoMarginal} from '@/lib/bao-grid';
import {LIVE_RESULT_SOURCE_LINKS as sources, liveResultNumber} from '@/lib/live-result';
import type {Locale} from '@/lib/i18n';
import {ExperimentFrame} from './experiments/ExperimentFrame';
import {csvDownload} from './experiments/download';

export default function BaoSurface({locale,cut}: {locale:Locale;cut:boolean}) {
  const pt=locale==='pt', f=(n:number,d:number)=>liveResultNumber(n,d,locale);
  const {best,rows}=useMemo(()=>baoGrid(cut),[cut]);
  const [selection,select]=useState<{omegaM:number;h0:number}|null>(null);
  const [showPosterior,setPosterior]=useState(false),[densityIndex,setDensityIndex]=useState(60);
  const posterior=useMemo(()=>showPosterior?baoMarginal(cut):[],[showPosterior,cut]);
  const {omegaM,h0}=selection??best;
  const delta=baoDelta(evaluateProfile(omegaM,147.5,cut),h0,best.chiSquared);
  const setPoint=(m:number,h:number)=>select({omegaM:m,h0:h});
  const contours=useMemo(()=>[68,95].map(level=>{
    const delta=BAO_LEVEL[level as 68|95];
    return makeBaoFootprint(147.5,cut,delta).map(p=>({...p,delta}));
  }),[cut]);
  const label=pt?'Superfície BAO, altura em Δχ²':'BAO surface, height in Δχ²';
  const project=(p:{omegaM:number;h0:number;delta:number}):[number,number]=>{
    const u=(p.omegaM-.302)/.036, v=(p.h0-68.75)/3.75;
    return [240+111*u-92*v,155+40*u+39*v-11*p.delta];
  };
  const meshLine=line<typeof rows[number][number]>().defined(p=>p.delta<=10).x(p=>project(p)[0]).y(p=>project(p)[1]);
  const curves=[...rows.filter((_,i)=>i%2===0),...rows[0]!.map((_,i)=>rows.map(r=>r[i]!)).filter((_,i)=>i%2===0)];
  const maxDensity=Math.max(1,...posterior.map(p=>p.density));
  return <div className="bao-lab">
    <p className="experiment-note">{pt?'DESI DR2 · ΛCDM plano · régua fixa':'DESI DR2 · flat ΛCDM · fixed ruler'} r<sub>d</sub> = {f(147.5,1)} Mpc · {cut?(pt?'sem LRG2':'without LRG2'):(pt?'todos os traçadores':'all tracers')}</p>
    <ExperimentFrame active label={label} locale={locale} name="desi-bao" scene={{kind:'bao',rows,selected:{omegaM,h0,delta},onSelect:setPoint}} onExport={()=>
      csvDownload(cut?'desi-bao-without-lrg2':'desi-bao-all',[['Omega_m','H0_km_s_Mpc','delta_chi2','r_d_Mpc','omit_LRG2'],...rows.flat().map(p=>[p.omegaM,p.h0,p.delta,147.5,Number(cut)])])}>
      <svg viewBox="0 0 480 260" role="img" aria-label={label}>
        {curves.map((r,i)=><path key={i} d={meshLine(r)??''} fill="none" stroke="var(--accent)" strokeWidth=".9"/>)}
        {contours.map((r,i)=><path key={i} d={(meshLine(r)??'')+'Z'} fill="none" stroke="currentColor" strokeWidth="1.8" strokeDasharray={i?'5 3':undefined}/>)}
        <g fill="currentColor" fontSize="13"><text x="22" y="210">H₀</text><text x="420" y="220">Ωₘ</text><text x="26" y="35">Δχ²</text></g>
      </svg>
    </ExperimentFrame>
    <p className="experiment-note">{pt?'Altura em Δχ² de 0 a 10. As linhas claras marcam os contornos conjuntos de 68% e 95%. Selecione um ponto na malha ou ajuste os parâmetros.':'Height in Δχ² from 0 to 10. Light lines trace the joint 68% and 95% contours. Pick a mesh point or adjust the parameters.'}</p>
    <div className="lab-columns"><div className="experiment-sliders">
      <label>Ωₘ <input type="range" min=".266" max=".338" step=".0001" value={omegaM} onChange={e=>setPoint(Number(e.target.value),h0)}/></label>
      <label>H₀ (km/s/Mpc) <input type="range" min="65" max="72.5" step=".01" value={h0} onChange={e=>setPoint(omegaM,Number(e.target.value))}/></label>
      <button type="button" onClick={()=>select(null)}>{pt?'Selecionar o mínimo':'Select minimum'}</button>
    </div><div><table className="lab-table"><caption>{pt?'Ponto selecionado':'Selected point'}</caption><tbody>
      <tr><th scope="row">Ωₘ</th><td>{f(omegaM,5)}</td></tr><tr><th scope="row">H₀ (km/s/Mpc)</th><td>{f(h0,3)}</td></tr><tr><th scope="row">Δχ²</th><td>{f(delta,4)}</td></tr>
    </tbody></table><p className="lab-sources"><a href={sources.baoMean.href}>{pt?'Vetor DESI':'DESI vector'}</a> · <a href={sources.baoCovariance.href}>{pt?'Covariância':'Covariance'}</a></p></div></div>
    <details className="lab-details" onToggle={e=>setPosterior(e.currentTarget.open)}><summary>{pt?'Posterior marginal de Ωₘ':'Marginal posterior of Ωₘ'}</summary>
      {showPosterior && <><p>{pt?'Integral de exp(−Δχ²/2) em H₀. Priors uniformes em Ωₘ de 0,18 a 0,42 e em H₀ de 55 a 85 km/s/Mpc. Densidade normalizada na grade.':'Integral of exp(−Δχ²/2) over H₀. Uniform priors on Ωₘ from 0.18 to 0.42 and H₀ from 55 to 85 km/s/Mpc. Density normalised on the grid.'}</p>
        <svg viewBox="0 0 420 138" role="img" aria-label={pt?'Densidade posterior de Ωₘ':'Posterior density of Ωₘ'}>
          <path d="M35 10V108H395" stroke="currentColor" fill="none"/><path d={line<typeof posterior[number]>().x(p=>35+(p.omegaM-.18)*1500).y(p=>108-89*p.density/maxDensity)(posterior)??''} stroke="var(--accent)" strokeWidth="2.5" fill="none"/>
          <g fill="currentColor" fontSize="11"><text x="4" y="19">{f(maxDensity,1)}</text><text x="20" y="108">0</text><text x="35" y="128">{f(.18,2)}</text><text x="207" y="128">Ωₘ</text><text x="371" y="128">{f(.42,2)}</text></g>
        </svg><label className="lab-time">{pt?'Consultar densidade':'Inspect density'} <input aria-label={pt?'Ωₘ da posterior':'Posterior Ωₘ'} type="range" min="0" max={posterior.length-1} value={densityIndex} onChange={e=>setDensityIndex(Number(e.target.value))}/></label>
        <table className="lab-table"><caption>{pt?'Posterior na grade':'Posterior on the grid'}</caption><thead><tr><th>Ωₘ</th><th>p(Ωₘ | BAO)</th></tr></thead><tbody><tr><td>{f(posterior[densityIndex]!.omegaM,3)}</td><td>{f(posterior[densityIndex]!.density,4)}</td></tr></tbody></table>
        <button type="button" onClick={()=>csvDownload('desi-posterior',[['Omega_m','density','omit_LRG2'],...posterior.map(p=>[p.omegaM,p.density,Number(cut)])])}>{pt?'Exportar posterior (CSV)':'Export posterior (CSV)'}</button></>}
    </details>
  </div>;
}
