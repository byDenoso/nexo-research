'use client';
import {useMemo, useState} from 'react';
import {evaluateProfile} from '@/lib/live-result-bao';
import {liveResultNumber} from '@/lib/live-result';
import type {Locale} from '@/lib/i18n';
import styles from './LiveResult.module.css';

type Point = [number,number,number];
export default function BaoSurface({locale,cut}: {locale:Locale;cut:boolean}) {
  const pt=locale==='pt', [angle,rotate]=useState(35);
  const rows=useMemo(()=>{
    const minimum=evaluateProfile(cut ? .29961163 : .29746182,147.5,cut).chiSquared;
    return Array.from({length:31},(_,i)=>{
      const m=.272+i*.002, r=evaluateProfile(m,147.5,cut);
      return Array.from({length:41},(_,j):Point=>{
        const h=66+j*.15;
        return [m,h,r.chiSquared-minimum+r.inverseH0Curvature*(1/h-1/r.h0)**2];
      });
    });
  },[cut]);
  const a=angle*Math.PI/180;
  const project=([m,h,z]:Point):[number,number]=>{
    const u=(m-.302)/.03, v=(h-69)/3;
    return [213+99*(u*Math.cos(a)-v*Math.sin(a)),176+42*(u*Math.sin(a)+v*Math.cos(a))-z*9];
  };
  const meshes=[...rows,...rows[0]!.map((_,j)=>rows.map(row=>row[j]!))];
  const origin:Point=[.272,66,0];
  const axis=(end:Point,label:string)=>{
    const [ax,ay]=project(origin),[bx,by]=project(end);
    return <g><line x1={ax} y1={ay} x2={bx} y2={by} stroke="currentColor"/><text x={bx} y={by-5} textAnchor="middle">{label}</text></g>;
  };
  return <div><svg className={styles.plane} viewBox="0 0 430 265" role="img" aria-label={pt?'Superfície BAO, altura em Δχ²':'BAO surface, height in Δχ²'}>
    {meshes.map((row,i)=>{let pen=false; const d=row.map(p=>{if(p[2]!>10){pen=false;return '';}const start=pen?'L':'M';pen=true;return start+project(p).join(' ');}).join('');return <path key={i} d={d} stroke="var(--bao)" opacity=".65" strokeWidth=".85" fill="none"/>;})}
    {axis([.332,66,0],'Ωₘ '+liveResultNumber(.332,3,locale))}{axis([.272,72,0],'H₀ 72')}{axis([.272,66,10],'Δχ² 10')}
  </svg><div className={styles.toolbar}><label>{pt?'Rotação':'Rotation'} <input type="range" min="-45" max="135" value={angle} onChange={e=>rotate(Number(e.target.value))}/></label><button type="button" onClick={()=>rotate(35)}>{pt?'Recentrar':'Recenter'}</button></div>
  <p className={styles.caption}>{pt?'Altura = χ² − χ² mínimo (0–10). H₀ em km/s/Mpc. Distâncias BAO com régua fixa de 147,5 Mpc.':'Height = χ² − minimum χ² (0–10). H₀ in km/s/Mpc. BAO distances at fixed ruler 147.5 Mpc.'} <b>{cut?'DESI − LRG2':(pt?'DESI de referência':'Reference DESI')}</b></p></div>;
}
