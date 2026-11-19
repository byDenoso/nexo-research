'use client';
import {useEffect,useRef,useState} from 'react';
import type {Locale} from '@/lib/i18n';
import type {FieldRenderer} from './experiments/cosmic-renderer';

export function CosmicCover({locale}:{locale:Locale}) {
  const mount=useRef<HTMLDivElement>(null),[paused,setPaused]=useState(false),[available,setAvailable]=useState(false);
  const pausedNow=useRef(false), refresh=useRef<()=>void>(()=>{});
  useEffect(()=>{pausedNow.current=paused;refresh.current();},[paused]);
  useEffect(()=>{
    const host=mount.current,cover=host?.parentElement;
    if(!host || !cover) return;
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    const net=navigator as Navigator & {connection?:{saveData?:boolean};deviceMemory?:number};
    let active=true, visible=false, renderer:FieldRenderer|null=null, initializing=false;
    let frame=0, last=0, elapsed=0, x=0, y=0, targetX=0, targetY=0;
    const low=(net.deviceMemory??8)<=4 || innerWidth<600;
    let resolution=low?.65:1;
    const values=new Float32Array(4);
    function resize(){
      if(!renderer || !host) return;
      const r=host.getBoundingClientRect();
      renderer.canvas.width=Math.max(1,Math.round(r.width*resolution));
      renderer.canvas.height=Math.max(1,Math.round(r.height*resolution));
    }
    function draw(now:number) {
      if(!renderer || !visible || pausedNow.current || motion.matches || document.hidden)return;
      if(!last) last=now;
      const dt=now-last;
      if(dt>=(low?32:15)){
        elapsed+=Math.min(dt,80)/1000;last=now;
        x+=(targetX-x)*.09;y+=(targetY-y)*.09;
        values.set([renderer.canvas.width/renderer.canvas.height,elapsed,x,y+Math.min(1,scrollY/Math.max(1,cover!.offsetHeight))]);
        renderer.draw(values);
        if(dt>65 && resolution>.5){resolution=Math.max(.5,resolution-.05);resize();}
      }
      frame=requestAnimationFrame(draw);
    }
    async function update(){
      cancelAnimationFrame(frame);last=0;
      const allowed=!motion.matches && !net.connection?.saveData;
      setAvailable(allowed);
      if(!allowed || !visible || pausedNow.current || document.hidden){if(renderer)renderer.canvas.hidden=!allowed;return;}
      if(!renderer){
        if(initializing)return;
        initializing=true;
        try {const mod=await import('./experiments/cosmic-renderer');renderer=await mod.createField();} catch {renderer=null;}
        initializing=false;
        if(!active){renderer?.dispose();return;}
        if(!renderer){setAvailable(false);return;}
        renderer.canvas.setAttribute('aria-hidden','true');host!.replaceChildren(renderer.canvas);host!.dataset.renderer=renderer.backend;resize();
        if(!visible || motion.matches || pausedNow.current || document.hidden){renderer.canvas.hidden=motion.matches;return;}
      }
      renderer.canvas.hidden=false;frame=requestAnimationFrame(draw);
    }
    function point(e:PointerEvent){const r=cover!.getBoundingClientRect();targetX=2*(e.clientX-r.left)/r.width-1;targetY=1-2*(e.clientY-r.top)/r.height;}
    refresh.current=()=>{void update();};
    const viewport=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;void update();});viewport.observe(cover);
    const dimensions=new ResizeObserver(resize);dimensions.observe(host);
    cover.addEventListener('pointermove',point,{passive:true});motion.addEventListener('change',update);document.addEventListener('visibilitychange',update);
    return ()=>{active=false;refresh.current=()=>{};cancelAnimationFrame(frame);viewport.disconnect();dimensions.disconnect();motion.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);cover.removeEventListener('pointermove',point);renderer?.dispose();host.replaceChildren();delete host.dataset.renderer;};
  },[]);
  return <><div className="cosmic-field" ref={mount} aria-hidden="true"/>{available && <button type="button" className="cover-motion-switch" aria-pressed={paused} onClick={()=>setPaused(!paused)}>
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d={paused?'M4 2l9 6-9 6z':'M3 2h3v12H3zM10 2h3v12h-3z'}/></svg>
    {locale==='pt'?(paused?'Ativar fundo':'Pausar fundo'):(paused?'Play background':'Pause background')}</button>}</>;
}
