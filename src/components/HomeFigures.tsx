import type React from 'react';
import Link from 'next/link';
import data from '../../data/curated/home-figures.json';
import type {Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';

// Three research cards with small figures drawn from real data (scripts/emit-home-figures.py).
const W = 230, H = 150, L = 34, R = 8, T = 8, B = 26;

function axes(xt: {v: number; label: string}[], yt: {v: number; label: string}[], x: (v: number) => number, y: (v: number) => number, xl: React.ReactNode, yl: React.ReactNode) {
  return <g className="mini-axes">
    <rect x={L} y={T} width={W - L - R} height={H - T - B} fill="none" />
    {xt.map(t => <g key={'x' + t.v}><line x1={x(t.v)} x2={x(t.v)} y1={H - B} y2={H - B + 3} /><text x={x(t.v)} y={H - B + 13} textAnchor="middle">{t.label}</text></g>)}
    {yt.map(t => <g key={'y' + t.v}><line x1={L - 3} x2={L} y1={y(t.v)} y2={y(t.v)} /><text x={L - 5} y={y(t.v) + 3} textAnchor="end">{t.label}</text></g>)}
    <text x={(L + W - R) / 2} y={H - 1} textAnchor="middle" className="mini-label">{xl}</text>
    <text x={9} y={(T + H - B) / 2} textAnchor="middle" className="mini-label" transform={`rotate(-90 9 ${(T + H - B) / 2})`}>{yl}</text>
  </g>;
}

function Hubble({pt}: {pt: boolean}) {
  const h = data.hubble;
  const lx = (z: number) => Math.log10(z);
  const x = (z: number) => L + ((lx(z) - lx(0.01)) / (lx(2.3) - lx(0.01))) * (W - L - R);
  const y = (m: number) => T + ((26.5 - m) / (26.5 - 13.5)) * (H - T - B);
  const curve = h.lcdm.map((p, i) => `${i ? 'L' : 'M'}${x(p.z).toFixed(1)},${y(p.m).toFixed(1)}`).join('');
  const f = (v: number) => v.toString().replace('.', pt ? ',' : '.');
  return <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={pt ? `Diagrama de Hubble de ${h.n_sn} supernovas do Pantheon+ com a curva de ΛCDM` : `Hubble diagram of ${h.n_sn} Pantheon+ supernovae with the ΛCDM curve`}>
    {axes([0.01, 0.1, 1].map(v => ({v, label: f(v)})), [14, 18, 22, 26].map(v => ({v, label: String(v)})), x, y, 'z', <>m<tspan baselineShift="sub" fontSize="6">B</tspan> (mag)</>)}
    <path d={curve} className="mini-model" />
    {h.bins.map(b => <g key={b.z} className="mini-point"><line x1={x(b.z)} x2={x(b.z)} y1={y(b.m - b.err * 3)} y2={y(b.m + b.err * 3)} /><circle cx={x(b.z)} cy={y(b.m)} r="2.6" /></g>)}
  </svg>;
}

function Spectrum({pt}: {pt: boolean}) {
  const s = data.spectrum;
  const fmax = 2.2, fmin = -0.3;
  const x = (u: number) => L + ((u - 0.7) / (5.3 - 0.7)) * (W - L - R);
  const y = (f: number) => T + ((fmax - Math.min(Math.max(f, fmin), fmax)) / (fmax - fmin)) * (H - T - B);
  const path = s.points.map((p, i) => `${i ? 'L' : 'M'}${x(p.um).toFixed(1)},${y(p.f).toFixed(1)}`).join('');
  const show = s.lines.filter(l => ['N IV]', '[O III]', 'Hα'].includes(l.name));
  return <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={pt ? `Espectro do ${s.object} em z = ${String(s.z).replace('.', ',')} com N IV], [O III] e Hα` : `Spectrum of ${s.object} at z = ${s.z} with N IV], [O III] and Hα`}>
    {axes([1, 2, 3, 4, 5].map(v => ({v, label: String(v)})), [0, 1, 2].map(v => ({v, label: String(v)})), x, y, pt ? 'λ observado (µm)' : 'observed λ (µm)', <>f<tspan baselineShift="sub" fontSize="6">ν</tspan> (µJy)</>)}
    {show.map(l => <g key={l.name} className="mini-line"><line x1={x(l.um)} x2={x(l.um)} y1={T + 2} y2={H - B} /><text x={x(l.um) + 2} y={T + 9}>{l.name}</text></g>)}
    <path d={path} className="mini-spectrum" />
  </svg>;
}

function Contours({pt}: {pt: boolean}) {
  const c = data.contours;
  const x = (wa: number) => L + ((wa + 2.0) / (0.6 + 2.0)) * (W - L - R);
  const y = (w0: number) => T + ((-0.4 - w0) / (-0.4 + 1.3)) * (H - T - B);
  const outer = c.paths.filter(p => p.level > 3), inner = c.paths.filter(p => p.level < 3);
  const d = (pts: number[][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]!).toFixed(1)},${y(p[1]!).toFixed(1)}`).join('') + 'Z';
  const f = (v: number) => v.toString().replace('.', pt ? ',' : '.').replace('-', '−');
  return <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={pt ? `Contornos de 68% e 95% em w0 e wa; ΛCDM fica a Δχ² = ${String(c.dchi2_lcdm).replace('.', ',')}` : `68% and 95% contours in w0 and wa; ΛCDM sits at Δχ² = ${c.dchi2_lcdm}`}>
    {axes([-2, -1, 0].map(v => ({v, label: f(v)})), [-1.2, -1, -0.8, -0.6].map(v => ({v, label: f(v)})), x, y, <>w<tspan baselineShift="sub" fontSize="6">a</tspan></>, <>w<tspan baselineShift="sub" fontSize="6">0</tspan></>)}
    <line x1={x(0)} x2={x(0)} y1={T} y2={H - B} className="mini-ref" />
    <line x1={L} x2={W - R} y1={y(-1)} y2={y(-1)} className="mini-ref" />
    {outer.map((p, i) => <path key={'o' + i} d={d(p.pts)} className="mini-c95" />)}
    {inner.map((p, i) => <path key={'i' + i} d={d(p.pts)} className="mini-c68" />)}
    <circle cx={x(c.best.wa)} cy={y(c.best.w0)} r="2.4" className="mini-best" />
    <g className="mini-lcdm"><circle cx={x(0)} cy={y(-1)} r="3" /><text x={x(0) + 5} y={y(-1) + 11}>ΛCDM</text></g>
  </svg>;
}

export function HomeFigures({locale}: {locale: Locale}) {
  const pt = locale === 'pt';
  const dchi2 = String(data.contours.dchi2_lcdm).replace('.', pt ? ',' : '.');
  const cards = [
    {key: 'expansion', title: pt ? 'Energia escura' : 'Dark energy', text: pt ? `${data.hubble.n_sn.toLocaleString('pt-BR')} supernovas do Pantheon+ contra a curva de ΛCDM, ao lado do BAO do DESI e da radiação cósmica de fundo.` : `${data.hubble.n_sn.toLocaleString('en-GB')} Pantheon+ supernovae against the ΛCDM curve, alongside DESI BAO and the cosmic microwave background.`, fig: <Hubble pt={pt} />, to: href(locale, '/research') + '#expansion'},
    {key: 'galaxies', title: pt ? 'Galáxias em alto redshift' : 'High-redshift galaxies', text: pt ? 'Espectros do JWST no primeiro bilhão de anos. Na figura, o NEXUS 5819 em z = 5,76, com nitrogênio forte.' : 'JWST spectra from the first billion years. Shown: NEXUS 5819 at z = 5.76, with strong nitrogen.', fig: <Spectrum pt={pt} />, to: href(locale, '/research') + '#galaxies'},
    {key: 'inference', title: pt ? 'Inferência cosmológica' : 'Cosmological inference', text: pt ? `Perfil de verossimilhança da energia escura com BAO, CMB e supernovas. ΛCDM fica a Δχ² = ${dchi2} do melhor ajuste.` : `Profile likelihood of dark energy with BAO, CMB and supernovae. ΛCDM sits at Δχ² = ${dchi2} from the best fit.`, fig: <Contours pt={pt} />, to: href(locale, '/results')},
  ];
  return <section className="wrap home-cards" aria-label={pt ? 'Linhas de pesquisa' : 'Research lines'}>
    {cards.map(c => <article key={c.key} className="home-card">
      <div className="home-card-copy">
        <h2>{c.title}</h2>
        <p>{c.text}</p>
      </div>
      <figure className="home-card-fig">{c.fig}</figure>
      <Link prefetch={false} href={c.to} className="home-card-go"><span className="sr-only">{(pt ? 'Ver: ' : 'Open: ') + c.title}</span><span aria-hidden="true">→</span></Link>
    </article>)}
  </section>;
}
