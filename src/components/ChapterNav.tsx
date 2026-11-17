'use client';
import {useEffect,useState} from 'react';
import type {Locale} from '@/lib/i18n';
const entries=[['em-foco','Expansão','Expansion'],['galaxias','Galáxias','Galaxies'],['perguntas','Perguntas','Questions'],['fontes','Fontes','Sources']] as const;
export function ChapterNav({locale}: {locale:Locale}) {
  const [active,setActive]=useState<string>('em-foco');
  useEffect(()=>{
    const sections=entries.map(([id])=>document.getElementById(id)).filter(el=>el!==null);
    const observer=new IntersectionObserver(items=>{const hit=items.filter(item=>item.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];if(hit)setActive(hit.target.id);},{rootMargin:'0px 0px -55% 0px'});
    sections.forEach(s=>observer.observe(s));return ()=>observer.disconnect();
  },[]);
  return <nav className="chapter-nav wrap" aria-label={locale==='pt'?'Capítulos':'Chapters'}>{entries.map(([id,pt,en])=><a key={id} href={'#'+id} aria-current={id===active?'location':undefined} onClick={()=>setActive(id)}>{locale==='pt'?pt:en}<svg aria-hidden="true" viewBox="0 0 100 2" preserveAspectRatio="none"><path d="M0 1H100"/></svg></a>)}</nav>;
}
