'use client';
import {useId, useMemo, useState} from 'react';
import data from '../../data/curated/hubble-live.json';
import type {Locale} from '@/lib/i18n';

// Interactive Hubble residual diagram. Every position of the control is a full fit computed offline
// (scripts/emit-hubble-live.py): nothing is fitted or interpolated in the browser.
type Frame = (typeof data.frames)[number];
const W = 620, H = 330, L = 52, R = 14, T = 16, B = 40;
const ZMIN = 0.01, ZMAX = 2.3, YMIN = -0.16, YMAX = 0.12;

export function HubbleLive({locale}: {locale: Locale}) {
  const pt = locale === 'pt';
  const frames = data.frames as Frame[];
  const zeroIndex = frames.findIndex(f => Math.abs(f.delta) < 1e-9);
  const measuredIndex = frames.reduce((best, f, i) => Math.abs(f.delta - data.measured.delta) < Math.abs(frames[best]!.delta - data.measured.delta) ? i : best, 0);
  const [i, setI] = useState(zeroIndex);
  const f = frames[i]!;
  const id = useId();
  const nf = (v: number, d = 3, sign = false) => new Intl.NumberFormat(pt ? 'pt-BR' : 'en-GB', {minimumFractionDigits: d, maximumFractionDigits: d, signDisplay: sign ? 'exceptZero' : 'auto'}).format(v).replace('-', '−');

  const x = (z: number) => L + (Math.log10(z) - Math.log10(ZMIN)) / (Math.log10(ZMAX) - Math.log10(ZMIN)) * (W - L - R);
  const y = (v: number) => T + (YMAX - Math.max(YMIN, Math.min(YMAX, v))) / (YMAX - YMIN) * (H - T - B);
  const curve = useMemo(() => f.curve.map((v, k) => `${k ? 'L' : 'M'}${x(data.zcurve[k]!).toFixed(1)},${y(v).toFixed(1)}`).join(''), [f]);
  const ticksZ = [0.01, 0.03, 0.1, 0.3, 1, 2];
  const ticksY = [-0.15, -0.1, -0.05, 0, 0.05, 0.1];
  const pos = (k: number) => (k / (frames.length - 1)) * 100;

  return (
    <div className="hubble-live">
      <div className="hl-controls">
        <label htmlFor={id} className="hl-label">{pt ? 'Correção do ponto zero do DES' : 'DES zero-point correction'}</label>
        <output className="hl-delta" htmlFor={id}>{nf(f.delta, 3, true)} <small>mag</small></output>
        <div className="hl-range">
          <input id={id} type="range" min={0} max={frames.length - 1} step={1} value={i} onChange={e => setI(Number(e.target.value))}
            aria-valuetext={`${nf(f.delta, 3, true)} mag`} />
          <span className="hl-mark" style={{left: `${pos(zeroIndex)}%`}}>{pt ? 'publicado' : 'published'}</span>
          <span className="hl-mark hl-mark-measured" style={{left: `${pos(measuredIndex)}%`}}>{pt ? 'medido' : 'measured'}</span>
        </div>
        <div className="hl-buttons">
          <button type="button" onClick={() => setI(zeroIndex)} aria-pressed={i === zeroIndex}>{pt ? 'Dados publicados' : 'Published data'}</button>
          <button type="button" onClick={() => setI(measuredIndex)} aria-pressed={i === measuredIndex}>{pt ? `Offset medido (${nf(data.measured.delta, 3, true)} ± ${nf(data.measured.err, 3)})` : `Measured offset (${nf(data.measured.delta, 3, true)} ± ${nf(data.measured.err, 3)})`}</button>
        </div>
        <dl className="hl-readout" aria-live="polite">
          <div><dt>Δχ² (ΛCDM − w0wa)</dt><dd className="star-value">{nf(f.dchi2, 1)}</dd></div>
          <div><dt>{pt ? 'Equivale a' : 'Equivalent to'}</dt><dd>{nf(f.sigma, 1)}σ</dd></div>
          <div><dt>w<sub>0</sub></dt><dd>{nf(f.w0, 2)}</dd></div>
          <div><dt>w<sub>a</sub></dt><dd>{nf(f.wa, 2)}</dd></div>
        </dl>
      </div>
      <figure className="hl-figure">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={pt
          ? `Resíduos de Hubble em relação ao ΛCDM. Com correção ${nf(f.delta, 3, true)} mag no DES, w0wa melhora o ajuste em Δχ² = ${nf(f.dchi2, 1)}.`
          : `Hubble residuals relative to ΛCDM. With a ${nf(f.delta, 3, true)} mag DES correction, w0wa improves the fit by Δχ² = ${nf(f.dchi2, 1)}.`}>
          <g className="mini-axes">
            <rect x={L} y={T} width={W - L - R} height={H - T - B} />
            {ticksZ.map(t => <g key={t}><line x1={x(t)} x2={x(t)} y1={H - B} y2={H - B + 4} /><text x={x(t)} y={H - B + 16} textAnchor="middle">{nf(t, t < 0.1 ? 2 : t < 1 ? 1 : 0)}</text></g>)}
            {ticksY.map(t => <g key={t}><line x1={L - 4} x2={L} y1={y(t)} y2={y(t)} /><text x={L - 7} y={y(t) + 4} textAnchor="end">{nf(t, 2)}</text></g>)}
            <text x={(L + W - R) / 2} y={H - 4} textAnchor="middle" className="mini-label">{pt ? 'redshift z' : 'redshift z'}</text>
            <text x={12} y={(T + H - B) / 2} textAnchor="middle" className="mini-label" transform={`rotate(-90 12 ${(T + H - B) / 2})`}>{pt ? 'μ − μ(ΛCDM) (mag)' : 'μ − μ(ΛCDM) (mag)'}</text>
          </g>
          <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} className="hl-zero" />
          <path d={curve} className="hl-curve" />
          {f.other.map(([z, r, e]) => <g key={'o' + z} className="hl-other"><line x1={x(z!)} x2={x(z!)} y1={y(r! - e!)} y2={y(r! + e!)} /><circle cx={x(z!)} cy={y(r!)} r="3.4" /></g>)}
          {f.des.map(([z, r, e]) => <g key={'d' + z} className="hl-des"><line x1={x(z!)} x2={x(z!)} y1={y(r! - e!)} y2={y(r! + e!)} /><rect x={x(z!) - 3.4} y={y(r!) - 3.4} width="6.8" height="6.8" transform={`rotate(45 ${x(z!)} ${y(r!)})`} /></g>)}
        </svg>
        <figcaption>
          <span className="hl-key"><i className="hl-key-other" />{pt ? `outras pesquisas (${data.n_sn - data.n_des})` : `other surveys (${data.n_sn - data.n_des})`}</span>
          <span className="hl-key"><i className="hl-key-des" />DES ({data.n_des})</span>
          <span className="hl-key"><i className="hl-key-curve" />{pt ? 'melhor w0wa' : 'best w0wa'}</span>
        </figcaption>
      </figure>
    </div>
  );
}
