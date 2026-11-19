'use client';
import {usePathname} from 'next/navigation';
import {useEffect,useRef} from 'react';

export function MotionObserver() {
  const pathname=usePathname(),previous=useRef(pathname);
  useEffect(()=>{
    const root=document.documentElement;
    const changed=previous.current!==pathname;
    previous.current=pathname;
    if(pathname.split('/')[2]==='publications') {delete root.dataset.labMotion;return;}
    root.dataset.labMotion='';
    const navLinks=Array.from(document.querySelectorAll<HTMLAnchorElement>('.primary-nav a,.site-menu-panel a'));
    navLinks.forEach(link=>{
      const route=new URL(link.href);
      if(route.origin===location.origin && (pathname===route.pathname || pathname.startsWith(route.pathname+'/')))link.setAttribute('aria-current',pathname===route.pathname?'page':'location');
    });
    const query=matchMedia('(prefers-reduced-motion: reduce)');
    let observer:IntersectionObserver|undefined, cancelled=false;
    const running=new Set<{stop:()=>void}>();
    const marked=document.querySelectorAll<HTMLElement>('[data-inview=""]');
    marked.forEach(n=>{n.dataset.inview='in';});
    async function observe(){
      observer?.disconnect();running.forEach(a=>a.stop());running.clear();
      if(query.matches)return;
      const {animate}=await import('motion/mini');
      if(cancelled || query.matches)return;
      if(changed){
        const main=document.querySelector('main');
        if(main) running.add(animate(main,{opacity:[.94,1]},{duration:.19}));
      }
      observer=new IntersectionObserver(entries=>entries.filter(e=>e.isIntersecting).forEach((e,i)=>{
        const result=animate(e.target as HTMLElement,{transform:['translateY(7px)','translateY(0)']},{duration:.42,delay:Math.min(i,3)*.045,ease:[.22,.72,.25,1]});
        running.add(result);void result.then(()=>running.delete(result));
        observer?.unobserve(e.target);
      }),{threshold:.08});
      document.querySelectorAll('.nx-home .section-masthead,.nx-observation > div,.expansion-story > header,.model-lab > header,.nx-lead-copy').forEach(n=>observer?.observe(n));
    }
    void observe();query.addEventListener('change',observe);
    return ()=>{cancelled=true;query.removeEventListener('change',observe);observer?.disconnect();running.forEach(a=>a.stop());navLinks.forEach(a=>a.removeAttribute('aria-current'));delete root.dataset.labMotion;};
  },[pathname]);
  return null;
}
export function CountUp({value, locale, digits=0}:{value:number;locale:string;digits?:number;duration?:number}) {
  return <span className="count-up">{new Intl.NumberFormat(locale,{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value)}</span>;
}
