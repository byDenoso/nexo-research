'use client';
import {useState} from 'react';
import type {Locale} from '@/lib/i18n';

export function TracerSelector({locale,rows}:{locale:Locale;rows:{label:string;fits:{gain:number;shift:number}[]}[]}) {
  const [selected,select]=useState(0);
  const row=rows[selected]!,pt=locale==='pt';
  const number=(n:number,signed=false)=>new Intl.NumberFormat(pt?'pt-BR':'en-GB',{minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:signed?'exceptZero':'auto'}).format(n);
  return <div className="tracer-selector"><label>{pt?'Examinar retirada':'Inspect omission'} <select value={selected} onChange={e=>select(Number(e.target.value))}>{rows.map((r,i)=><option value={i} key={r.label}>{r.label}</option>)}</select></label>
    <output>{row.fits.map((fit,i)=><span key={i}>{i?'Union3':'DES-SN5YR'} · Δχ² {number(fit.gain)} ({number(fit.shift,true)}) </span>)}</output></div>;
}
