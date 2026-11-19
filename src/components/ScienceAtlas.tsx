'use client';

import Link from 'next/link';
import {useState} from 'react';
import {SkyVolume} from './experiments/SkyVolume';
import {type Locale} from '@/lib/i18n';
import sample from '../../data/source/pantheon-sky-summary.json';

const views = [
  ['sky', 'Mapa celeste', 'Sky map'],
  ['distribution', 'Distribuição de redshift', 'Redshift distribution'],
  ['expansion', 'Expansão e modelos', 'Expansion and models'],
  ['spectrum', 'Espectro e redshift', 'Spectrum and redshift'],
] as const;
type View = typeof views[number][0];
const left = 55, top = 24, width = 500, height = 180;

function pathFor(curve: (x: number) => number, xmax: number, ymax: number) {
  return Array.from({length: 401}, (_, i) => {
    const y = curve(i / 400 * xmax);
    return (i ? 'L' : 'M') + (left + i / 400 * width).toFixed(2) + ' ' + (top + height * (1 - y / ymax)).toFixed(2);
  }).join(' ');
}

export function ScienceAtlas({locale}: {locale: Locale}) {
  const pt = locale === 'pt';
  const [view, setView] = useState<View>('sky');
  const [model,setModel]=useState<number|null>(null),[hover,setHover]=useState<number|null>(null);
  const [bin,setBin]=useState(0);
  const [z, setZ] = useState(0.3);
  const f = (n: number) => n.toLocaleString(pt ? 'pt-BR' : 'en-GB', {maximumFractionDigits: 2});
  const sky = view === 'sky', dist = view === 'distribution', expansion = view === 'expansion';
  const observed = 656.28 * (1 + z);
  const yMax = dist ? Math.ceil(Math.max(...sample.redshiftCounts) / 200) * 200 : expansion ? 6 : 1;
  const xticks = sky ? [360,270,180,90,0] : dist ? [0,.5,1,1.5,2,2.5] : expansion ? [0,.5,1,1.5,2] : [600,750,900,1050,1200,1350];
  const yticks = sky ? [-90,-45,0,45,90] : [0,yMax/2,yMax];
  const xLabel = sky ? (pt ? 'Ascensão reta (°)' : 'Right ascension (°)') : view === 'spectrum' ? (pt ? 'Comprimento de onda (nm)' : 'Wavelength (nm)') : 'Redshift z';
  const yLabel = sky ? (pt ? 'Declinação (°)' : 'Declination (°)') : dist ? (pt ? 'Supernovas por faixa' : 'Supernovae per bin') : expansion ? 'H(z) / H₀' : (pt ? 'Intensidade relativa' : 'Relative intensity');
  const notes = {
    sky: pt ? 'Um ponto por supernova. A projeção equatorial retangular mostra a cobertura angular. Fontes próximas na imagem podem estar a distâncias diferentes.' : 'One point per supernova. The rectangular equatorial projection shows angular coverage. Neighbouring points can be at different distances.',
    distribution: pt ? 'Contagem de objetos únicos por CID, em intervalos de 0,25 de redshift no referencial do CMB. O limite inferior pertence ao intervalo.' : 'Unique objects by CID in bins of width 0.25 in CMB-frame redshift. Each bin includes its lower edge.',
    expansion: pt ? 'Exemplo teórico de Friedmann. A linha contínua usa ΛCDM plano com Ωₘ = 0,3. A tracejada usa apenas matéria, Ωₘ = 1. Ambas partem do mesmo H₀. Radiação desprezada.' : 'Friedmann model illustration. The solid line uses flat ΛCDM with Ωₘ = 0.3. The dashed line uses matter alone, Ωₘ = 1. Both start at the same H₀. Radiation is neglected.',
    spectrum: pt ? 'Linha Hα ilustrativa. O pico de repouso em 656,28 nm se desloca para λ = λ₀(1 + z). O perfil gaussiano tem largura observada fixa de 10 nm (σ) e altura normalizada.' : 'Illustrative Hα line. Its rest peak at 656.28 nm shifts to λ = λ₀(1 + z). The Gaussian profile has fixed observed width of 10 nm (σ) and normalised height.',
  };
  const source = sky || dist ? sample.source : expansion ? 'https://arxiv.org/abs/astro-ph/9905116' : 'https://physics.nist.gov/PhysRefData/Handbook/Tables/hydrogentable2.htm';
  const sourceName = sky || dist ? 'Pantheon+ · Pantheon+SH0ES.dat' : expansion ? 'Hogg (1999)' : 'NIST · H I';
  const title = views.find(entry => entry[0] === view)![pt ? 1 : 2];
  const chart = (
      <svg viewBox="0 0 580 248" role="img" aria-label={title+', '+yLabel+' / '+xLabel}>
        {yticks.map((v,i) => {const y=top+height*(1-i/(yticks.length-1));return <g key={v}><line className="axis-rule" x1={left} x2={left+width} y1={y} y2={y}/><text x={left-8} y={y+4} textAnchor="end">{f(v)}</text></g>;})}
        {xticks.map((v,i) => <text key={v} x={left+width*i/(xticks.length-1)} y="228" textAnchor="middle">{f(v)}</text>)}
        {sky && <image x="0" y="0" width="580" height="248" href="/images/pantheon-sky.svg"/>}
        {dist && sample.redshiftCounts.map((n,i) => <rect key={i} onMouseEnter={()=>setBin(i)} onClick={()=>setBin(i)} opacity={i===bin?1:.48} fill="var(--accent)" x={left+i*50+1} y={top+height*(1-n/yMax)} width="48" height={height*n/yMax}/>)}
        {expansion && [0.3,1].map(m => <path key={m} opacity={(hover??model)===null || (hover??model)===m ? 1 : .24} onMouseEnter={()=>setHover(m)} onMouseLeave={()=>setHover(null)} onClick={()=>setModel(m===model?null:m)} className="atlas-line" strokeDasharray={m===1 ? '7 4' : undefined} d={pathFor(x => Math.sqrt(m*(1+x)**3+1-m),2,yMax)}/>)}
        {view==='spectrum' && <path className="atlas-line" d={pathFor(x=>Math.exp(-.5*((600+x-observed)/10)**2),750,1)}/>}
      </svg>
  );
  return <section id="atlas" className="atlas" aria-labelledby="atlas-heading">
    <div className="atlas-intro"><h2 id="atlas-heading">{pt ? 'Atlas de observáveis' : 'Observable atlas'}</h2>
      <label htmlFor="atlas-view">{pt ? 'Visualização' : 'View'}</label>
      <select id="atlas-view" value={view} onChange={event => setView(event.target.value as View)}>{views.map(entry => <option value={entry[0]} key={entry[0]}>{entry[pt ? 1 : 2]}</option>)}</select>
      <p>{notes[view]}</p>
      <a className="text-link" href={source}>{sourceName}</a>
      <Link className="text-link" href={'/'+locale+'/resultado-vivo'}>{pt ? 'Plano Ωₘ × H₀ e incertezas das sondas' : 'Ωₘ × H₀ plane and probe uncertainties'}</Link>
    </div>
    <figure><figcaption><strong>{title}</strong><span>{sky || dist ? 'Pantheon+ · N = '+f(sample.uniqueCID) : pt ? 'Modelo ilustrativo' : 'Illustrative model'}</span></figcaption>
      <p className="axis-note">{yLabel}</p>
      {sky ? <SkyVolume locale={locale}>{chart}</SkyVolume> : chart}
      <p className="axis-note axis-x">{xLabel}</p>
      {view === 'spectrum' && <label className="spectrum-control"><span>z = {f(z)} · λ = {f(observed)} nm</span><input type="range" min="0" max="1" step=".01" value={z} aria-label="Redshift" onChange={event=>setZ(Number(event.target.value))}/></label>}
      {expansion && <div className="model-legend">{[.3,1].map(m=><button key={m} type="button" aria-pressed={model===m} onFocus={()=>setHover(m)} onBlur={()=>setHover(null)} onMouseEnter={()=>setHover(m)} onMouseLeave={()=>setHover(null)} onClick={()=>setModel(m===model?null:m)}>Ωₘ = {f(m)}</button>)}</div>}
      {dist && <label className="spectrum-control"><span>{f(bin*.25)} ≤ z &lt; {f((bin+1)*.25)} · N = {sample.redshiftCounts[bin]}</span><input type="range" min="0" max={sample.redshiftCounts.length-1} step="1" value={bin} aria-label={pt?'Faixa de redshift':'Redshift bin'} onChange={e=>setBin(Number(e.target.value))}/></label>}
      {dist && <details><summary>{pt ? 'Contagens por intervalo' : 'Counts by bin'}</summary><dl>{sample.redshiftCounts.map((n,i)=><div key={i}><dt>{f(i*.25)} ≤ z &lt; {f((i+1)*.25)}</dt><dd>{n}</dd></div>)}</dl></details>}
    </figure>
  </section>;
}
