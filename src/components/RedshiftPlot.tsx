'use client';
import {useState} from 'react';
import type {Locale} from '@/lib/i18n';
export function RedshiftPlot({rows, locale}: {rows:{label:string;values:(number|undefined)[]}[];locale:Locale}) {
 const [selected,select]=useState<number|null>(null),[emphasis,highlight]=useState<number|null>(null);
 const keyButton=(id:number,name:string)=><button type="button" aria-pressed={selected===id} onClick={()=>select(selected===id?null:id)} onFocus={()=>highlight(id)} onBlur={()=>highlight(null)} onMouseEnter={()=>highlight(id)} onMouseLeave={()=>highlight(null)}><i className={'nx-swatch '+(id===0?'nx-solid':'nx-hatched')}/>{name}</button>;
 const missing=locale==='pt'?'Sem ajuste':'No fit';
 const number=new Intl.NumberFormat(locale==='pt'?'pt-BR':'en',{minimumFractionDigits:2,maximumFractionDigits:2});
 const ticks=[0,2,4,6,8,10], maximum=10;
 return (      <div className="nx-plot" data-emphasis={emphasis ?? selected ?? "both"}>
        <div className="nx-plot-legend">
          {keyButton(0,"DES-SN5YR")}
          {keyButton(1,"Union3")}
        </div>
        <div className="nx-plot-axis">
          <span>Δχ²</span>
          <div>{ticks.map(tick => <span key={tick}>{tick}</span>)}</div>
        </div>
        {rows.map((row, index) => (
          <div key={row.label} className={`nx-plot-row${index === 1 ? ' nx-plot-emphasis' : ''}`}>
            <div className="nx-plot-label">{row.label}</div>
            <div className="nx-plot-pair">
              {row.values.map((value, series) => (
                <div className="nx-plot-track" data-series={series} key={series} onMouseEnter={()=>highlight(series)} onMouseLeave={()=>highlight(null)}>
                  {value === undefined
                    ? <span className="nx-plot-missing">{missing}</span>
                    : <><span className={series === 0 ? 'nx-solid' : 'nx-hatched'} style={{width: `${value / maximum * 100}%`}} /><b>{number.format(value)}</b></>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
);
}
