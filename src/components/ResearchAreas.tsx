'use client';
import {useState,type ReactNode} from 'react';
import {D,tr} from '@/lib/dict';
import {LINES,type Line,type Status} from '@/lib/schemas';
import type {Locale} from '@/lib/i18n';
import {LiveResult} from './LiveResult';

export function ResearchAreas({locale,areas,figure,output}: {locale:Locale;areas:{line:Line;statuses:Status[];content:ReactNode}[];figure:ReactNode;output:ReactNode}) {
  const pt=locale==='pt';
  const [theme,setTheme]=useState('all'), [evidence,setEvidence]=useState('all');
  const visible=areas.filter(a=>(theme==='all'||theme===a.line) && (evidence==='all'||a.statuses.some(s=>s===evidence)));
  return <div className="wrap page-body research-layout"><nav className="research-index" aria-labelledby="research-index-title">
    <h2 id="research-index-title" className="kicker">{pt?'Linhas de pesquisa':'Research areas'}</h2>
    <div className="area-filters"><label>{pt?'Tema':'Topic'}<select aria-label={pt?'Tema':'Topic'} value={theme} onChange={e=>setTheme(e.target.value)}><option value="all">{pt?'Todos':'All'}</option>{LINES.map(l=><option key={l} value={l}>{tr(D.lines.items[l].n,locale)}</option>)}</select></label>
    <label>{pt?'Evidência no catálogo':'Catalogue evidence'}<select aria-label={pt?'Evidência no catálogo':'Catalogue evidence'} value={evidence} onChange={e=>setEvidence(e.target.value)}><option value="all">{pt?'Todos os estados':'All statuses'}</option>{(Object.keys(D.status) as Status[]).map(s=><option key={s} value={s}>{tr(D.status[s].n,locale)}</option>)}</select></label></div>
    <ul role="list">{visible.map(({line})=><li key={line}><a href={'#'+line}>{tr(D.lines.items[line].n,locale)} ↓</a></li>)}</ul>
    <a className="text-link" href="#scenario-comparison">{pt?'Comparar cenários':'Compare scenarios'}</a></nav>
    <div className="research-content">{figure}<p className="kicker" role="status">{visible.length} {pt?'linhas de pesquisa':'research areas'}</p>{visible.map(a=><div key={a.line}>{a.content}</div>)}
    {!visible.length && <p>{pt?'Nenhuma linha tem registros com estes critérios.':'No area has records matching these criteria.'}</p>}
    {output}<details id="scenario-comparison" className="research-projects"><summary>{pt?'Comparar cenários de expansão':'Compare expansion scenarios'}</summary><LiveResult locale={locale}/></details></div>
    </div>;
}
