'use client';
import {useEffect,useRef,useState} from 'react';
import type {Locale} from '@/lib/i18n';
import type {View,VolumeRenderer} from './experiments/survey-volume-renderer';
const root='/data/desi-erosita/';
const initial=():View=>({yaw:.06977550044982518,pitch:Math.PI/3,zoom:1,lo:.1,hi:.4,desi:true,ero:true});
type Backend='poster'|'loading'|'webgl'|'fallback';

export function SurveyVolume({locale}:{locale:Locale}){
  const pt=locale==='pt',t=(a:string,b:string)=>pt?a:b;
  const number=new Intl.NumberFormat(pt?'pt-BR':'en-GB');
  const figure=useRef<HTMLElement>(null),stage=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const engine=useRef<VolumeRenderer|null>(null),view=useRef<View>(initial());
  const pointers=useRef(new Map<number,{x:number;y:number}>());
  const [backend,setBackend]=useState<Backend>('poster'),[requested,request]=useState(false);
  const [spin,setSpin]=useState(false),[visible,setVisible]=useState(false),[expanded,setExpanded]=useState(false);
  const [filter,setFilter]=useState({lo:.1,hi:.4,desi:true,ero:true}),[counts,setCounts]=useState<[number,number]>([143633,941]);
  const [full,setFull]=useState(false);
  const redraw=()=>engine.current?.draw(view.current);
  useEffect(()=>{
    const host=stage.current;if(!host)return;
    const observer=new IntersectionObserver(entries=>setVisible(!!entries[0]?.isIntersecting),{threshold:.1});
    observer.observe(host);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    // Poster owns the initial paint. Mobile, save-data and reduced-motion require an explicit start.
    if(!visible||requested||!matchMedia('(min-width:900px)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
    const network=navigator as Navigator & {connection?:{saveData?:boolean};deviceMemory?:number};
    if(network.connection?.saveData||(network.deviceMemory??8)<=4)return;
    const timer=window.setTimeout(()=>{if(!document.hidden){setSpin(true);request(true);}},5000);
    return()=>clearTimeout(timer);
  },[visible,requested]);
  useEffect(()=>{
    const query=matchMedia('(prefers-reduced-motion:reduce)');
    const change=()=>{if(query.matches)setSpin(false);};query.addEventListener('change',change);
    const fullChange=()=>setFull(document.fullscreenElement===figure.current);
    document.addEventListener('fullscreenchange',fullChange);
    return()=>{query.removeEventListener('change',change);document.removeEventListener('fullscreenchange',fullChange);};
  },[]);
  useEffect(()=>{
    if(!requested||!canvas.current)return;
    const el=canvas.current,abort=new AbortController();let live=true,renderer:VolumeRenderer|undefined;
    setBackend('loading');
    const lost=(event:Event)=>{event.preventDefault();setBackend('fallback');setSpin(false);};
    el.addEventListener('webglcontextlost',lost);
    void import('./experiments/survey-volume-renderer').then(m=>m.createVolume(el,abort.signal)).then(r=>{
      if(!live){r.dispose();return;}renderer=r;engine.current=r;r.draw(view.current);setCounts(r.count(view.current));setBackend('webgl');
    }).catch(()=>{if(live){setBackend('fallback');setSpin(false);}});
    const resize=new ResizeObserver(()=>engine.current?.draw(view.current));resize.observe(el);
    return()=>{live=false;abort.abort();resize.disconnect();el.removeEventListener('webglcontextlost',lost);renderer?.dispose();engine.current=null;};
  },[requested]);
  useEffect(()=>{
    if(backend!=='webgl'||!spin||!visible)return;
    let frame=0,last=0;
    const draw=(now:number)=>{if(!document.hidden&&now-last>=33){view.current.yaw+=last?Math.min(now-last,50)*.00018:.003;engine.current?.draw(view.current);last=now;}frame=requestAnimationFrame(draw);};
    frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
  },[backend,spin,visible]);
  useEffect(()=>{
    const el=canvas.current;if(!el||backend!=='webgl')return;
    const wheel=(e:WheelEvent)=>{if(document.activeElement!==el&&!e.ctrlKey)return;e.preventDefault();setSpin(false);view.current.zoom=Math.max(.35,Math.min(8,view.current.zoom*Math.exp(-e.deltaY*.001)));engine.current?.draw(view.current);};
    el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel);
  },[backend]);
  useEffect(()=>{
    if(!expanded)return;const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')setExpanded(false);};
    document.addEventListener('keydown',esc);return()=>document.removeEventListener('keydown',esc);
  },[expanded]);
  function update(next:Partial<typeof filter>){
    Object.assign(view.current,next);const v=view.current;
    if(v.lo>v.hi){if('lo' in next)v.hi=v.lo;else v.lo=v.hi;}
    setFilter({lo:v.lo,hi:v.hi,desi:v.desi,ero:v.ero});
    if(engine.current)setCounts(engine.current.count(v));redraw();
  }
  function zoom(factor:number){view.current.zoom=Math.max(.35,Math.min(8,view.current.zoom*factor));redraw();}
  function tilt(x:number,y:number){view.current.yaw+=x;view.current.pitch=Math.max(-Math.PI/2+.03,Math.min(Math.PI/2-.03,view.current.pitch+y));redraw();}
  function reset(){view.current=initial();setSpin(false);update({lo:.1,hi:.4,desi:true,ero:true});}
  async function fullscreen(){
    if(full){await document.exitFullscreen().catch(()=>{});return;}
    if(expanded){setExpanded(false);return;}
    if(document.fullscreenEnabled&&figure.current?.requestFullscreen){try{await figure.current.requestFullscreen();return;}catch{/* CSS fallback */}}
    setExpanded(true);
  }
  function save(){
    redraw();canvas.current?.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='NEXO-DESI-eROSITA-3D.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');
  }
  const ready=backend==='webgl';
  const countLabel=number.format(counts[0])+' '+t('galáxias','galaxies')+' · '+number.format(counts[1])+' '+t('aglomerados/grupos','clusters/groups');
  const help=t('Arraste para girar. Use as setas e +/− com o teclado.','Drag to rotate. Use the arrow keys and +/− on the keyboard.');
  return <figure ref={figure} className={'survey-volume'+(expanded?' survey-expanded':'')} data-backend={backend} data-running={String(ready&&spin&&visible)} aria-label="DESI × eROSITA">
    <figcaption><strong>DESI × eROSITA</strong><span className="survey-range">0.1 ≤ z ≤ 0.4 · 418–1552 Mpc</span></figcaption>
    <div className="survey-stage" ref={stage}>
      <picture><source srcSet={root+'poster-640.webp 640w, '+root+'poster-1280.webp 1280w, '+root+'poster.webp 2560w'} sizes="(min-width:90rem) 710px, (min-width:56rem) 54vw, 94vw" type="image/webp"/>
        {/* The supplied static poster is generated and hashed at build time. No image optimization request on the critical path. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={root+'poster-640.webp'} width={2560} height={1440} loading="eager" fetchPriority="high" alt={t('Volume observacional: galáxias DESI em ciano e grupos e aglomerados eROSITA em âmbar.','Observational volume: DESI galaxies in cyan and eROSITA groups and clusters in amber.')}/>
      </picture>
      <canvas ref={canvas} role="img" aria-label={t('Volume tridimensional interativo. ','Interactive three-dimensional volume. ')+help} aria-hidden={!ready} tabIndex={ready?0:-1}
        onPointerDown={e=>{if(!ready)return;e.currentTarget.focus();e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});setSpin(false);}}
        onPointerMove={e=>{const old=pointers.current.get(e.pointerId);if(!old)return;const other=[...pointers.current].find(([id])=>id!==e.pointerId)?.[1];if(other){const a=Math.hypot(old.x-other.x,old.y-other.y),b=Math.hypot(e.clientX-other.x,e.clientY-other.y);if(a>0)zoom(b/a);}else tilt((e.clientX-old.x)*.006,(e.clientY-old.y)*.006);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});}}
        onPointerUp={e=>pointers.current.delete(e.pointerId)} onPointerCancel={e=>pointers.current.delete(e.pointerId)} onLostPointerCapture={e=>pointers.current.delete(e.pointerId)}
        onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))return;e.preventDefault();setSpin(false);if(e.key==='ArrowLeft')tilt(-.08,0);else if(e.key==='ArrowRight')tilt(.08,0);else if(e.key==='ArrowUp')tilt(0,-.08);else if(e.key==='ArrowDown')tilt(0,.08);else zoom(e.key==='-'?.89:1.12);}}/>
    </div>
    <div className="survey-controls survey-js">
      {!ready&&backend!=='fallback'&&<button type="button" className="survey-start" disabled={backend==='loading'} onClick={()=>{setSpin(!matchMedia('(prefers-reduced-motion:reduce)').matches);request(true);}}>{backend==='loading'?t('Carregando 3D…','Loading 3D…'):t('Explorar em 3D','Explore in 3D')}</button>}
      {ready&&<>
        <button type="button" aria-pressed={spin} onClick={()=>setSpin(!spin)}>{spin?t('Pausar rotação','Pause rotation'):t('Girar','Rotate')}</button>
        <button type="button" onClick={()=>{setSpin(false);zoom(1.2);}} aria-label={t('Aumentar zoom','Zoom in')}>+</button>
        <button type="button" onClick={()=>{setSpin(false);zoom(1/1.2);}} aria-label={t('Diminuir zoom','Zoom out')}>−</button>
        <button type="button" onClick={reset}>{t('Restaurar','Reset')}</button>
        <button type="button" onClick={()=>void fullscreen()}>{expanded||full?t('Fechar tela cheia','Exit fullscreen'):t('Tela cheia','Fullscreen')}</button>
        <button type="button" onClick={save}>PNG</button>
      </>}
    </div>
    <div className="survey-legend">
      {ready?<><label><input type="checkbox" checked={filter.desi} onChange={e=>update({desi:e.target.checked})}/><span className="survey-swatch" aria-hidden="true"/>DESI</label><label><input type="checkbox" checked={filter.ero} onChange={e=>update({ero:e.target.checked})}/><span className="survey-swatch ero" aria-hidden="true"/>eROSITA</label></>:<><span><i className="survey-swatch" aria-hidden="true"/> DESI</span><span><i className="survey-swatch ero" aria-hidden="true"/> eROSITA</span></>}
    </div>
    {ready&&<div className="survey-filters">
      <label>z min · {number.format(filter.lo)}<input type="range" min=".1" max=".4" step=".01" value={filter.lo} aria-label={t('Redshift mínimo','Minimum redshift')} onChange={e=>update({lo:+e.target.value})}/></label>
      <label>z max · {number.format(filter.hi)}<input type="range" min=".1" max=".4" step=".01" value={filter.hi} aria-label={t('Redshift máximo','Maximum redshift')} onChange={e=>update({hi:+e.target.value})}/></label>
    </div>}
    <div className="survey-footer">
      <p className="survey-counts" aria-live="polite">{countLabel}</p>
      {backend==='fallback'&&<p role="status" className="survey-status">{t('WebGL indisponível. Exibição estática preservada.','WebGL unavailable. Static view preserved.')}</p>}
      <details><summary>{t('Escala, fontes e créditos','Scale, sources and credits')}</summary>
        <p>{t('Recorte observacional: −10° ≤ declinação ≤ +10°. Posições comóveis em ΛCDM plano, H₀ = 70 km/s/Mpc, Ωₘ = 0,3. Cor e tamanho são escolhas de visualização; a cobertura difere entre levantamentos. Sem reconstrução da densidade ou cruzamento de catálogos.','Observational slice: −10° ≤ declination ≤ +10°. Comoving positions in flat ΛCDM, H₀ = 70 km/s/Mpc, Ωₘ = 0.3. Colour and size are display choices; survey coverage differs. No density reconstruction or catalogue crossmatch.')}</p>
        <p><a href="https://data.desi.lbl.gov/doc/releases/dr1/">DESI Collaboration · DR1 LSS v1.5 BGS</a> · <a href="https://erosita.mpe.mpg.de/dr1/AllSkySurveyData_dr1/Catalogues_dr1/BulbulE_DR1/erass1cl_primary_v3.2.html">eROSITA-DE · Bulbul et al. (2024), eRASS1 v3.2</a>. {t('Seleção, transformação para coordenadas cartesianas e visualização: NEXO Research.','Selection, Cartesian coordinate transformation and visualisation: NEXO Research.')}</p>
        <p><a href={root+'provenance.json'}>{t('Proveniência e hashes','Provenance and hashes')}</a> · <a href={root+'acknowledgments.txt'}>{t('Créditos completos e licença','Full acknowledgments and license')}</a> · <a href={root+'poster.webp'}>{t('Imagem original','Original image')}</a></p>
      </details>
      <a href={'/'+locale+'/data#pantheon-volume'}>Pantheon+ · {t('Atlas de supernovas','Supernova atlas')} →</a>
    </div>
  </figure>;
}
