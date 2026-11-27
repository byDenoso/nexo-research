'use client';
import {useCallback, useId, useMemo, useRef, useState} from 'react';
import type {Locale} from '@/lib/i18n';

// Interactive Hubble residual diagram. Every position of the control is a full fit computed offline
// (scripts/emit-hubble-live.py): nothing is fitted or interpolated in the browser. The page ships only
// the published and measured fits; the other positions load from /observatory/hubble-live.json on first use.
export type Frame = {delta: number; dchi2: number; sigma: number; w0: number; wa: number; h_lcdm: number; h_w0wa: number; des: number[][]; other: number[][]; curve: number[]};
export type HubbleMeta = {n_sn: number; n_des: number; zcurve: number[]; measured: {delta: number; err: number; dchi2: number; w0: number; wa: number}; deltas: number[]};
const W = 620, H = 330, L = 52, R = 14, T = 16, B = 40;
const ZMIN = 0.01, ZMAX = 2.3, YMIN = -0.16, YMAX = 0.12;

const dot = (cx: number, cy: number, r: number) => `M${(cx - r).toFixed(1)},${cy.toFixed(1)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
const diamond = (cx: number, cy: number, r: number) => `M${cx.toFixed(1)},${(cy - r).toFixed(1)}l${r},${r}l${-r},${r}l${-r},${-r}z`;

export function HubbleLive({locale, meta, seed}: {locale: Locale; meta: HubbleMeta; seed: Record<number, Frame>}) {
  const pt = locale === 'pt';
  const data = meta;
  const n = meta.deltas.length;
  const zeroIndex = meta.deltas.findIndex(d => Math.abs(d) < 1e-9);
  const measuredIndex = meta.deltas.reduce((best, d, k) => Math.abs(d - meta.measured.delta) < Math.abs(meta.deltas[best]! - meta.measured.delta) ? k : best, 0);
  const [frames, setFrames] = useState<(Frame | undefined)[]>(() => meta.deltas.map((_, k) => seed[k]));
  const [i, setI] = useState(zeroIndex);
  const [shown, setShown] = useState(zeroIndex);
  const loading = useRef<Promise<void> | null>(null);
  const ensure = useCallback(() => {
    loading.current ??= fetch('/observatory/hubble-live.json').then(r => r.json()).then((all: {frames: Frame[]}) => setFrames(all.frames)).catch(() => { loading.current = null; });
    return loading.current;
  }, []);
  const pick = (k: number) => { setI(k); if (frames[k]) setShown(k); else ensure()?.then(() => setShown(k)); };
  const f = frames[shown] ?? frames[zeroIndex]!;
  const pending = i !== shown;
  const id = useId();
  const nf = (v: number, d = 3, sign = false) => new Intl.NumberFormat(pt ? 'pt-BR' : 'en-GB', {minimumFractionDigits: d, maximumFractionDigits: d, signDisplay: sign ? 'exceptZero' : 'auto'}).format(v).replace('-', '−');

  const x = (z: number) => L + (Math.log10(z) - Math.log10(ZMIN)) / (Math.log10(ZMAX) - Math.log10(ZMIN)) * (W - L - R);
  const y = (v: number) => T + (YMAX - Math.max(YMIN, Math.min(YMAX, v))) / (YMAX - YMIN) * (H - T - B);
  const curve = useMemo(() => f.curve.map((v, k) => `${k ? 'L' : 'M'}${x(data.zcurve[k]!).toFixed(1)},${y(v).toFixed(1)}`).join(''), [f]);
  const bars = (rows: number[][]) => rows.map(([z, r, e]) => `M${x(z!).toFixed(1)},${y(r! - e!).toFixed(1)}V${y(r! + e!).toFixed(1)}`).join('');
  const ticksZ = [0.01, 0.03, 0.1, 0.3, 1, 2];
  const ticksY = [-0.15, -0.1, -0.05, 0, 0.05, 0.1];
  const pos = (k: number) => (k / (n - 1)) * 100;

  return (
    <div className="hubble-live">
      <div className="hl-controls">
        <label htmlFor={id} className="hl-label">{pt ? 'Correção do ponto zero do DES' : 'DES zero-point correction'}</label>
        <output className="hl-delta" htmlFor={id}>{nf(meta.deltas[i]!, 3, true)} <small>mag</small></output>
        <div className="hl-range">
          <input id={id} type="range" min={0} max={n - 1} step={1} value={i} onChange={e => pick(Number(e.target.value))} onPointerDown={ensure} onFocus={ensure}
            aria-valuetext={`${nf(meta.deltas[i]!, 3, true)} mag`} />
          <span className="hl-mark" style={{left: `${pos(zeroIndex)}%`}}>{pt ? 'publicado' : 'published'}</span>
          <span className="hl-mark hl-mark-measured" style={{left: `${pos(measuredIndex)}%`}}>{pt ? 'medido' : 'measured'}</span>
        </div>
        <div className="hl-buttons">
          <button type="button" onClick={() => pick(zeroIndex)} aria-pressed={i === zeroIndex}>{pt ? 'Dados publicados' : 'Published data'}</button>
          <button type="button" onClick={() => pick(measuredIndex)} aria-pressed={i === measuredIndex}>{pt ? `Offset medido (${nf(data.measured.delta, 3, true)} ± ${nf(data.measured.err, 3)})` : `Measured offset (${nf(data.measured.delta, 3, true)} ± ${nf(data.measured.err, 3)})`}</button>
        </div>
        <dl className="hl-readout" aria-live="polite" aria-busy={pending} data-pending={pending || undefined}>
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
          {/* One path per series keeps the DOM small: error bars, then markers. */}
          <g className="hl-other"><path className="hl-err" d={bars(f.other)} /><path className="hl-mark-pts" d={f.other.map(([z, r]) => dot(x(z!), y(r!), 3.4)).join('')} /></g>
          <g className="hl-des"><path className="hl-err" d={bars(f.des)} /><path className="hl-mark-pts" d={f.des.map(([z, r]) => diamond(x(z!), y(r!), 4.6)).join('')} /></g>
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
