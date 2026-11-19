'use client';
import {useEffect, useId, useMemo, useRef, useState} from 'react';
import {scaleLinear} from 'd3-scale';
import {line} from 'd3-shape';
import {expansionPoint,referenceModel} from '@/lib/expansion';
import type {Locale} from '@/lib/i18n';
import {captureSvg, csvDownload} from './download';

type Observable = 'h'|'distance'|'a'|'residual';
const quantities:Record<Observable,[string,string,string]> = {
  h:['Taxa de expansão H(z)','Expansion rate H(z)','km/s/Mpc'],
  distance:['Distância comóvel','Comoving distance','Mpc'],
  a:['Fator de escala','Scale factor','a'],
  residual:['Diferença em H(z)','H(z) difference','%'],
};
export function ModelCurves({locale}:{locale:Locale}) {
  const pt=locale==='pt', title=useId(), svg=useRef<SVGSVGElement>(null);
  const [model,setModel]=useState({...referenceModel,w0:-.85,wa:.2});
  const [view,setView]=useState<Observable>('h'),[index,setIndex]=useState(40);
  const [captureError,setCaptureError]=useState(false);
  const f=(n:number,d=2)=>n.toLocaleString(pt?'pt-BR':'en-GB',{maximumFractionDigits:d});
  const data=useMemo(()=>Array.from({length:101},(_,i)=>{
    const z=i/50, ref=expansionPoint(z,{...model,w0:-1,wa:0}), alt=expansionPoint(z,model);
    return {z,ref,alt,residual:100*(alt.h/ref.h-1)};
  }),[model]);
  type Row = typeof data[number];
  const point=data[index]!, axisTime=view==='a', diff=view==='residual';
  const xv=(p:Row,alt:boolean)=>axisTime?(alt?p.alt:p.ref).lookback:p.z;
  const yv=(p:Row,alt:boolean)=>view==='residual'?(alt?p.residual:0):(alt?p.alt:p.ref)[view];
  const x=scaleLinear().domain([0,Math.max(...data.map(p=>Math.max(xv(p,true),xv(p,false))))]).range([65,482]);
  const ys=data.flatMap(p=>[yv(p,true),yv(p,false)]);
  const y=scaleLinear().domain([Math.min(0,...ys),Math.max(diff?.1:1,...ys)]).nice(4).range([187,24]);
  const path=(alt:boolean)=>line<Row>().x(p=>x(xv(p,alt))).y(p=>y(yv(p,alt)))(data)??'';
  useEffect(()=>{
    if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animations=Array.from(svg.current?.querySelectorAll<SVGPathElement>('[data-curve]')??[])
      .map(el=>el.animate([{opacity:.48},{opacity:1}],{duration:220,easing:'ease-out'}));
    return ()=>animations.forEach(a=>a.cancel());
  },[view,model]);
  const xLabel=axisTime?(pt?'Tempo de retrospecto (Gyr)':'Lookback time (Gyr)'):'Redshift z';
  const rows=[
    ['H(z) (km/s/Mpc)',point.ref.h,point.alt.h],
    ['D꜀ (Mpc)',point.ref.distance,point.alt.distance],
    [pt?'Retrospecto (Gyr)':'Lookback (Gyr)',point.ref.lookback,point.alt.lookback],
    ['a',point.ref.a,point.alt.a],
  ] as const;
  function saveCsv() {
    csvDownload('nexo-expansion-models',[
      ['z','a','Omega_m','H0_km_s_Mpc','w0_CPL','wa_CPL','H_LCDM','H_CPL','D_C_LCDM_Mpc','D_C_CPL_Mpc','lookback_LCDM_Gyr','lookback_CPL_Gyr','delta_H_percent'],
      ...data.map(p=>[p.z,p.alt.a,model.omegaM,model.h0,model.w0,model.wa,p.ref.h,p.alt.h,p.ref.distance,p.alt.distance,p.ref.lookback,p.alt.lookback,p.residual]),
    ]);
  }
  return <section id="expansion-models" className="model-lab" aria-labelledby={title}>
    <header><p className="nx-eyebrow">{pt?'Simulação ilustrativa':'Illustrative simulation'}</p>
      <h2 id={title}>{pt?'Como a energia escura muda a curva de expansão?':'How does dark energy change the expansion curve?'}</h2>
      <p>{pt?'Compare ΛCDM e CPL com a mesma densidade de matéria e o mesmo H₀. As curvas calculam as previsões de cada modelo para os parâmetros escolhidos.':'Compare ΛCDM and CPL at the same matter density and H₀. The curves calculate each model’s predictions at the selected parameters.'}</p></header>
    <div className="lab-columns"><div>
      <label className="lab-select">{pt?'Grandeza':'Observable'} <select aria-label={pt?'Grandeza':'Observable'} value={view} onChange={e=>setView(e.target.value as Observable)}>{(Object.entries(quantities) as [Observable,[string,string,string]][]).map(([id,q])=><option key={id} value={id}>{q[pt?0:1]}</option>)}</select></label>
      <svg viewBox="0 0 505 232" ref={svg} role="img" aria-label={quantities[view][pt?0:1]+' · '+xLabel}>
        <g fontSize="12" fill="currentColor"><text x="6" y="15">{quantities[view][2]}</text>
          {y.ticks(4).map(n=><g key={n}><path d={'M65 '+y(n)+'H482'} stroke="var(--line)" fill="none"/><text x="57" y={y(n)+4} textAnchor="end">{f(n,1)}</text></g>)}
          {x.ticks(5).map(n=><text key={n} x={x(n)} y="206" textAnchor="middle">{f(n,1)}</text>)}
          <text x="275" y="226" textAnchor="middle">{xLabel}</text></g>
        {[false,true].map(alt=><g key={String(alt)} stroke={alt?'var(--model-b)':'var(--accent)'} fill="none">
          <path data-curve="" d={path(alt)} strokeWidth="2.5" strokeDasharray={alt?'7 4':undefined}/>
          <circle cx={x(xv(point,alt))} cy={y(yv(point,alt))} r="4" strokeWidth="2" fill="var(--surface)"/></g>)}
      </svg>
      <p className="lab-legend"><span>━ ΛCDM</span><span>┄ CPL</span></p>
      <div className="experiment-sliders">
        <label>z = {f(point.z)} <input aria-label="Redshift z" type="range" min="0" max="100" step="1" value={index} onChange={e=>setIndex(Number(e.target.value))}/></label>
        {([['omegaM','Ωₘ',.15,.5,.01],['h0','H₀ (km/s/Mpc)',55,85,1],['w0','w₀',-1.5,-.5,.05],['wa','wₐ',-1,1,.05]] as const).map(([id,label,min,max,step])=><label key={id}>{label} = {f(model[id])}
          <input type="range" aria-label={label} min={min} max={max} step={step} value={model[id]} onChange={e=>setModel({...model,[id]:Number(e.target.value)})}/></label>)}
      </div></div>
      <aside><table className="lab-table"><caption>{pt?'Previsões em':'Predictions at'} z = {f(point.z)}</caption><thead><tr><th>{pt?'Grandeza':'Quantity'}</th><th>ΛCDM</th><th>CPL</th></tr></thead>
      <tbody>{rows.map(([label,a,b])=><tr key={label}><th scope="row">{label}</th><td>{f(a,3)}</td><td>{f(b,3)}</td></tr>)}</tbody></table>
      <p className="lab-reading">ΔH/H<sub>ΛCDM</sub> = {f(point.residual,3)}%</p>
      <p>{pt?'Geometria plana, matéria e energia escura. CPL usa w(a) = w₀ + wₐ(1 − a). A diferença percentual usa ΛCDM como referência.':'Flat geometry, matter and dark energy. CPL uses w(a) = w₀ + wₐ(1 − a). The percentage difference is relative to ΛCDM.'}</p>
      <p className="lab-sources"><a href="https://arxiv.org/abs/astro-ph/9905116">{pt?'Distâncias · Hogg':'Distances · Hogg'}</a> · <a href="https://arxiv.org/abs/astro-ph/0208512">CPL · Linder</a></p>
      <div className="experiment-tools"><button type="button" onClick={saveCsv}>{pt?'Exportar dados (CSV)':'Export data (CSV)'}</button>
      <button type="button" onClick={()=>{if(svg.current)captureSvg(svg.current,'nexo-expansion').catch(()=>setCaptureError(true));}}>{pt?'Capturar figura':'Save figure'}</button></div>
      {captureError && <span role="status">{pt?'Falha na captura.':'Capture failed.'}</span>}</aside></div>
  </section>;
}
