'use client';
import {useEffect, useId, useRef, useState} from 'react';
import {ageAtScale, hubble, referenceModel, scaleAtAge} from '@/lib/expansion';
import type {Locale} from '@/lib/i18n';
import {ExperimentFrame} from './ExperimentFrame';
import {csvDownload} from './download';

const stages=[
  {a:1/3,pt:['Emissão','A luz parte quando a distância entre duas galáxias comóveis é um terço da atual.'],en:['Emission','Light leaves when two comoving galaxies are one third of their present separation.']},
  {a:2/3,pt:['Expansão','A distância física cresce com o fator de escala. A mesma expansão alonga a onda que viaja entre as galáxias.'],en:['Expansion','Physical distance grows with the scale factor. The same expansion stretches the travelling wave.']},
  {a:1,pt:['Observação','Uma linha emitida a 500 nm chega a 1.500 nm. O comprimento de onda triplicou desde a emissão.'],en:['Observation','A line emitted at 500 nm arrives at 1,500 nm. Its wavelength has tripled since emission.']},
] as const;
const start=ageAtScale(1/3), end=ageAtScale(1);
const positions=[[-2,-1],[-1,1],[1,1],[2,-1],[1,-1],[-2,1],[0,-1],[2,1]] as const;

export function ExpansionStory({locale}:{locale:Locale}) {
  const pt=locale==='pt',marker=useId(),section=useRef<HTMLElement>(null);
  const [age,setAge]=useState(start), [playing,play]=useState(false), [speed,setSpeed]=useState(1),[orbit,setOrbit]=useState(false);
  const [follow,setFollow]=useState(true), [reduced,setReduced]=useState(false);
  const a=scaleAtAge(age), z=1/a-1, wavelength=500*a*3;
  const velocityScale=a*hubble(z,referenceModel)/referenceModel.h0;
  const current=a<.5?0:a<5/6?1:2;
  const format=(n:number,d=2)=>n.toLocaleString(pt?'pt-BR':'en-GB',{maximumFractionDigits:d});
  useEffect(()=>{
    const query=matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>{setReduced(query.matches);if(query.matches)play(false);};
    update();query.addEventListener('change',update);
    return ()=>query.removeEventListener('change',update);
  },[]);
  useEffect(()=>{
    if(!section.current || !follow || reduced) return;
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((x,y)=>Math.abs(x.boundingClientRect.top)-Math.abs(y.boundingClientRect.top));
      const selected=visible[0]?.target.getAttribute('data-epoch');
      if(selected!=null)setAge(ageAtScale(stages[Number(selected)]!.a));
    },{rootMargin:'-20% 0px -48% 0px'});
    section.current.querySelectorAll('[data-epoch]').forEach(el=>observer.observe(el));
    return ()=>observer.disconnect();
  },[follow,reduced]);
  useEffect(()=>{
    if(!playing || !section.current) return;
    let frame=0,last=0;
    const tick=(now:number)=>{
      if(!last)last=now;
      const elapsed=now-last;
      if(elapsed>=40){setAge(t=>Math.min(end,t+Math.min(elapsed,100)*.00065*speed));last=now;}
      frame=requestAnimationFrame(tick);
    };
    const visibility=()=>{if(document.hidden)play(false);};
    const observer=new IntersectionObserver(entries=>{if(!entries[0]?.isIntersecting)play(false);});
    observer.observe(section.current);document.addEventListener('visibilitychange',visibility);
    frame=requestAnimationFrame(tick);
    return ()=>{cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);};
  },[playing,speed]);
  useEffect(()=>{if(age>=end)play(false);},[age]);
  function seek(next:number){setFollow(false);play(false);setAge(next);}
  const svgWave=Array.from({length:240},(_,i)=>[42+i*1.65,167+8*Math.sin(i*1.65/(12*a))].join(',')).join(' ');
  return <section className="expansion-story wrap" ref={section} aria-labelledby="expansion-story-title" id="expansao-em-etapas">
    <header><p className="nx-eyebrow">{pt?'Experimento de expansão':'Expansion experiment'}</p>
      <h2 id="expansion-story-title">{pt?'O que acontece com a luz no caminho?':'What happens to light along the way?'}</h2>
      <p>{pt?'Acompanhe uma linha espectral emitida em z = 2. O diagrama usa ΛCDM plano, Ωₘ = 0,3 e H₀ = 70 km/s/Mpc.':'Follow a spectral line emitted at z = 2. The diagram uses flat ΛCDM, Ωₘ = 0.3 and H₀ = 70 km/s/Mpc.'}</p></header>
    <div className="story-grid"><div className="story-steps">{stages.map((s,i)=><article key={i} data-epoch={i} data-selected={current===i}>
      <button type="button" aria-pressed={current===i} onClick={()=>seek(ageAtScale(s.a))}>{s[locale][0]}</button><p>{s[locale][1]}</p>
    </article>)}</div>
    <figure className="story-figure"><figcaption><strong>{pt?'Expansão de um volume comóvel':'Expansion of a comoving volume'}</strong>
      <button className="experiment-mode" type="button" aria-pressed={orbit} onClick={()=>setOrbit(!orbit)}>{orbit?(pt?'Voltar a 2D':'Back to 2D'):'3D · '+(pt?'Volume':'Volume')}</button></figcaption>
      <ExperimentFrame name="nexo-expansion" label={pt?'Volume em expansão 3D':'Expanding 3D volume'} active={orbit} locale={locale} scene={{kind:'flow',scale:a}}
        onExport={()=>csvDownload('nexo-expansion-time',[['t_Gyr','a','z_to_today','D_physical_Mpc','lambda_nm','H_km_s_Mpc'],...Array.from({length:121},(_,i)=>{const t=start+(end-start)*i/120,s=scaleAtAge(t),rz=1/s-1;return [t,s,rz,s*10,1500*s,hubble(rz,referenceModel)];})])}>
        <svg viewBox="0 0 480 205" role="img" aria-label={pt?'Separação física e comprimento de onda durante a expansão':'Physical separation and wavelength during expansion'}>
          <defs><marker id={marker} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L6 3L0 6" fill="var(--accent)"/></marker></defs>
          <g stroke="var(--line)" fill="none">{[1,2,3].map(r=><ellipse key={r} cx="240" cy="79" rx={56*r*a} ry={20*r*a}/>)}</g>
          {positions.map(([x,y])=>{
            const px=240+x*65*a,py=79+y*41*a;
            return <g key={x+','+y}><line x1={px} y1={py} x2={px+x*9*velocityScale} y2={py+y*7*velocityScale} stroke="var(--accent)" markerEnd={'url(#'+marker+')'}/>
              <circle cx={px} cy={py} r="4" fill="var(--accent)"/></g>;
          })}<circle cx="240" cy="79" r="4" fill="currentColor"/>
          <polyline points={svgWave} fill="none" stroke="var(--model-b)" strokeWidth="2"/>
          <text x="40" y="197" fill="currentColor" fontSize="13">λ = {format(wavelength,0)} nm</text>
        </svg>
      </ExperimentFrame>
      <p className="experiment-note">{pt?'Simulação ilustrativa. As setas indicam a recessão relativa. O anel de referência cresce com a distância física.':'Illustrative simulation. Arrows indicate relative recession. The reference ring expands with physical distance.'}</p>
      <label className="lab-time">{pt?'Tempo cósmico':'Cosmic time'} · {format(age)} Gyr<input aria-label={pt?'Tempo cósmico':'Cosmic time'} type="range" min={start} max={end} step=".01" value={age} onChange={e=>seek(Number(e.target.value))}/></label>
      <div className="experiment-tools"><button type="button" onClick={()=>{setFollow(false);if(age>=end)setAge(start);play(!playing);}}>{playing?(pt?'Pausar':'Pause'):(pt?'Reproduzir':'Play')}</button>
        <button type="button" onClick={()=>seek(start)}>{pt?'Reiniciar':'Restart'}</button>
        <label>{pt?'Velocidade':'Speed'} <select value={speed} onChange={e=>setSpeed(Number(e.target.value))}>{[.5,1,2].map(v=><option key={v} value={v}>{format(v)}×</option>)}</select></label>
        {!reduced && <button type="button" aria-pressed={follow} onClick={()=>{play(false);setFollow(!follow);}}>{pt?'Seguir rolagem':'Follow scroll'}</button>}
      </div>
      <table className="lab-table"><caption>{pt?'Época selecionada':'Selected epoch'}</caption><thead><tr><th>a</th><th>z</th><th>{pt?'Distância¹':'Distance¹'}</th><th>λ</th></tr></thead>
        <tbody><tr><td>{format(a,3)}</td><td>{format(z,3)}</td><td>{format(10*a)} Mpc</td><td>{format(wavelength,1)} nm</td></tr></tbody></table>
      <p className="lab-sources">{pt?'¹ Par com separação comóvel de 10 Mpc.':'¹ Pair with comoving separation of 10 Mpc.'} <a href="https://arxiv.org/abs/astro-ph/9905116">Hogg (1999)</a></p>
    </figure></div>
  </section>;
}
