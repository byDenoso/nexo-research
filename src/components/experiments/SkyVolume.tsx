'use client';
import {useEffect, useMemo, useState, type ReactNode} from 'react';
import type {Locale} from '@/lib/i18n';
import {skyPositions, type SkyObject} from '@/lib/expansion';
import {ExperimentFrame} from './ExperimentFrame';
import {csvDownload} from './download';

export function SkyVolume({locale,children}:{locale:Locale;children:ReactNode}) {
  const pt=locale==='pt', f=(n:number,d=2)=>n.toLocaleString(pt?'pt-BR':'en-GB',{maximumFractionDigits:d});
  const [active,setActive]=useState(false), [objects,setObjects]=useState<SkyObject[]>([]);
  const [maxZ,setMaxZ]=useState(2.3),[index,setIndex]=useState(0),[retry,setRetry]=useState(0),[error,setError]=useState(false);
  useEffect(()=>{
    if(!active || objects.length) return;
    const controller=new AbortController();
    setError(false);
    fetch('/pantheon-positions.csv',{signal:controller.signal}).then(async r=>{
      if(!r.ok) throw Error('Catalogue unavailable');
      const rows=skyPositions(await r.text());
      if (rows.length!==1543) throw Error('Incomplete catalogue');
      if(!controller.signal.aborted) setObjects(rows);
    }).catch(()=>{if(!controller.signal.aborted)setError(true);});
    return ()=>controller.abort();
  },[active,objects.length,retry]);
  const visible=useMemo(()=>objects.map((_,i)=>i).filter(i=>objects[i]!.z<=maxZ),[objects,maxZ]);
  const selected=objects[index];
  const project=(p:SkyObject)=>[35+(360-p.ra)*510/360,22+(90-p.dec)*168/180] as const;
  const projection=useMemo(()=>visible.map(i=>{
    const [x,y]=project(objects[i]!);
    return 'M'+x.toFixed(2)+' '+y.toFixed(2)+'h.1';
  }).join(''),[objects,visible]);
  const label=pt?'Volume comóvel das supernovas Pantheon+':'Pantheon+ comoving supernova volume';
  return <div className="sky-volume">
    <button type="button" className="experiment-mode" aria-pressed={active} onClick={()=>setActive(!active)}>{active?(pt?'Voltar ao mapa 2D':'Back to 2D sky map'):'3D · Pantheon+'}</button>
    <ExperimentFrame key={retry} name="pantheon-sky" locale={locale} label={label} active={active} dataError={error} scene={objects.length?{kind:'sky',objects,maxZ,selected:index,onSelect:setIndex}:undefined}
      onExport={active && objects.length?()=>csvDownload('pantheon-selection',[['CID','RA_deg','DEC_deg','zCMB','D_C_Mpc_flat_Om0.3_H070'],...visible.map(i=>{const p=objects[i]!;return [p.cid,p.ra,p.dec,p.z,p.distance];})]):undefined}>{active && selected ? <svg viewBox="0 0 580 224" role="img" aria-label={pt?'Mapa celeste da seleção':'Sky map of selection'}>
        <path d="M35 22V190H545" stroke="currentColor" fill="none"/>
        <path d={projection} stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round"/>
        <circle cx={project(selected)[0]} cy={project(selected)[1]} r="4" stroke="currentColor" fill="none"/>
        <g fontSize="12" fill="currentColor"><text x="30" y="16">δ +90°</text><text x="35" y="211">α 360°</text><text x="510" y="211">α 0°</text></g>
      </svg>:children}</ExperimentFrame>
    {active && error && <button type="button" onClick={()=>setRetry(n=>n+1)}>{pt?'Recarregar catálogo':'Reload catalogue'}</button>}
    {active && <><p className="experiment-note">{pt?'Cada ponto é uma supernova observada. O raio representa a distância comóvel calculada em ΛCDM plano, Ωₘ = 0,3 e H₀ = 70 km/s/Mpc. Os anéis equatoriais marcam z = 0,1, 0,5, 1 e 2.':'Each point is an observed supernova. Radius is comoving distance in flat ΛCDM with Ωₘ = 0.3 and H₀ = 70 km/s/Mpc. Equatorial rings mark z = 0.1, 0.5, 1 and 2.'}</p>
    {selected && <div className="lab-columns"><div className="experiment-sliders">
      <label>z ≤ {f(maxZ)} <input type="range" aria-label={pt?'Redshift máximo':'Maximum redshift'} min=".05" max="2.3" step=".05" value={maxZ} onChange={e=>{const v=Number(e.target.value);setMaxZ(v);if(selected.z>v)setIndex(objects.findIndex(o=>o.z<=v));}}/></label>
      <label>{pt?'Supernova selecionada':'Selected supernova'} <select value={index} onChange={e=>setIndex(Number(e.target.value))}>{visible.map(i=><option key={i} value={i}>{objects[i]!.cid}</option>)}</select></label>
      <p>{pt?'Visíveis':'Visible'} · {f(visible.length)}</p>
    </div><table className="lab-table"><caption>{selected.cid}</caption><tbody>{[['α',f(selected.ra,5)+'°'],['δ',f(selected.dec,5)+'°'],['z (CMB)',f(selected.z,5)],['D꜀',f(selected.distance,2)+' Mpc']].map(([a,b])=><tr key={a}><th scope="row">{a}</th><td>{b}</td></tr>)}</tbody></table></div>}
    <a className="text-link" href="/pantheon-positions.csv" download>{pt?'Coordenadas do catálogo (CSV)':'Catalogue coordinates (CSV)'}</a></>}
  </div>;
}
