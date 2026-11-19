'use client';
import {useMemo,useState} from 'react';
import {scaleLinear} from 'd3-scale';
import type {Locale} from '@/lib/i18n';
import {baoResiduals} from '@/lib/bao-residuals';
import type {Cosmology} from '@/lib/expansion';
import {LIVE_RESULT_SOURCE_LINKS as sources} from '@/lib/live-result';
import {csvDownload} from './download';

export function BaoResiduals({locale,model}:{locale:Locale;model:Cosmology}) {
  const pt=locale==='pt',f=(n:number,d=2)=>n.toLocaleString(pt?'pt-BR':'en-GB',{minimumFractionDigits:d,maximumFractionDigits:d});
  const [filter,setFilter]=useState('all');
  const rows=useMemo(()=>{
    const ref=baoResiduals({...model,w0:-1,wa:0}),alt=baoResiduals(model);
    return ref.map((p,i)=>({...p,alt:alt[i]!})).filter(p=>filter==='all'||p.observable===filter);
  },[model,filter]);
  const bound=Math.max(2,Math.ceil(Math.max(...rows.flatMap(p=>[Math.abs(p.standardized),Math.abs(p.alt.standardized)]))));
  const x=scaleLinear().domain([-bound,bound]).range([115,475]);
  const height=rows.length*19+52;
  return <div className="bao-residuals">
    <p>{pt?'Cada ponto mostra (observado − previsto) / σᵢ para as distâncias BAO divididas por r_d, fixo em 147,5 Mpc. Os dois modelos usam os parâmetros dos controles acima. σᵢ é a incerteza marginal de cada medida. Dₘ e Dₕ no mesmo redshift têm covariância.':'Each point shows (observed − predicted) / σᵢ for BAO distances divided by r_d, fixed at 147.5 Mpc. Both models use the controls above. σᵢ is each measurement’s marginal uncertainty. Dₘ and Dₕ at the same redshift have covariance.'}</p>
    <label className="lab-select">{pt?'Medida BAO':'BAO observable'} <select aria-label={pt?'Medida BAO':'BAO observable'} value={filter} onChange={e=>setFilter(e.target.value)}>
      <option value="all">{pt?'Todas as medidas':'All measurements'}</option>{['DV','DM','DH'].map(v=><option key={v} value={v}>{v} / r_d</option>)}</select></label>
    <div className="lab-columns"><div>
      <svg viewBox={'0 0 500 '+height} role="img" aria-label={pt?'Resíduos das distâncias DESI por medida e redshift':'DESI distance residuals by observable and redshift'}>
        <path d={'M'+x(0)+' 17V'+(height-30)} stroke="var(--control-line)" strokeDasharray="3 3"/>
        {rows.map((p,i)=>{
          const y=22+i*19,ref=x(p.standardized),alt=x(p.alt.standardized);
          return <g key={p.z+p.observable}><text x="4" y={y+4} fontSize="12" fill="currentColor">{p.observable} · {f(p.z,3)}</text>
            <path d={'M'+ref+' '+y+'H'+alt} stroke="var(--control-line)"/>
            <circle cx={ref} cy={y} r="3.5" fill="var(--accent)"/>
            <path d={'M'+alt+' '+(y-4)+'l4 4 -4 4 -4 -4Z'} fill="var(--surface)" stroke="var(--model-b)" strokeWidth="1.8"/></g>;
        })}
        {[-bound,0,bound].map(n=><text key={n} x={x(n)} y={height-12} textAnchor="middle" fill="currentColor" fontSize="12">{n} σ</text>)}
      </svg>
      <p className="lab-legend"><span>● ΛCDM</span><span>◇ CPL</span></p>
      <div className="experiment-tools"><button type="button" onClick={()=>csvDownload('desi-bao-residuals',[
        ['z','observable_over_rd','observed','sigma','prediction_LCDM','residual_LCDM','residual_LCDM_sigma','prediction_CPL','residual_CPL','residual_CPL_sigma','rd_Mpc','Omega_m','H0_km_s_Mpc','w0_CPL','wa_CPL'],
        ...rows.map(p=>[p.z,p.observable,p.value,p.sigma,p.prediction,p.residual,p.standardized,p.alt.prediction,p.alt.residual,p.alt.standardized,147.5,model.omegaM,model.h0,model.w0,model.wa])])}>{pt?'Exportar resíduos (CSV)':'Export residuals (CSV)'}</button></div></div>
      <div><table className="lab-table"><caption>{pt?'Medidas DESI DR2 e resíduos em σᵢ':'DESI DR2 measurements and residuals in σᵢ'}</caption>
        <thead><tr><th>{pt?'Medida / z':'Measure / z'}</th><th>{pt?'Observado':'Observed'} ± σᵢ</th><th>ΛCDM</th><th>CPL</th></tr></thead><tbody>
        {rows.map(p=><tr key={p.z+p.observable}><th scope="row">{p.observable} · {f(p.z,3)}</th><td>{f(p.value)} ± {f(p.sigma)}</td><td>{f(p.standardized)}</td><td>{f(p.alt.standardized)}</td></tr>)}
        </tbody></table>
        <p className="lab-sources"><a href={sources.baoMean.href}>{pt?'Vetor DESI':'DESI vector'}</a> · <a href={sources.baoCovariance.href}>{pt?'Covariância completa':'Full covariance'}</a></p>
      </div></div></div>;
}
