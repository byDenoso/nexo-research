'use client';

import Image from 'next/image';
import {useState} from 'react';
import type {Locale} from '@/lib/i18n';
import sample from '../../data/source/pantheon-sky-summary.json';

function SampleDistribution({locale}: {locale: Locale}) {
  const pt = locale === 'pt';
  const [bin, setBin] = useState(0);
  const number = new Intl.NumberFormat(pt ? 'pt-BR' : 'en-GB');
  const step = sample.redshiftBinWidth;
  const range = number.format(bin * step) + ' ≤ z < ' + number.format((bin + 1) * step);
  const ticks = [0, 300, 600, 900];
  const binWidth = 46, left = 50, bottom = 200;
  const y = (count: number) => bottom - 0.17 * count;
  const count = sample.redshiftCounts[bin]!;
  const reading = number.format(count) + ' ' + (count === 1 ? 'supernova' : pt ? 'supernovas' : 'supernovae');

  return <div className="plate-distribution">
    <svg viewBox="0 0 534 228" role="img" aria-label={pt ? 'Contagem de supernovas por faixa de redshift do CMB' : 'Supernova count by CMB-frame redshift bin'}>
      {ticks.map(tick => <g key={tick}><line x1={left} x2="510" y1={y(tick)} y2={y(tick)} stroke="#34435a"/><text x={left-8} y={y(tick)+4} textAnchor="end">{tick}</text></g>)}
      {sample.redshiftCounts.map((value, i) => <g key={i} className="plate-bin" onClick={() => setBin(i)} aria-hidden="true">
        <rect x={left+i*binWidth} width={binWidth} y="16" height={bottom-16} fill={bin === i ? '#172c48' : 'transparent'}/>
        <rect x={left+i*binWidth+5} y={y(value)} width={binWidth-10} height={bottom-y(value)} rx="2" fill={bin === i ? '#a6ceff' : '#638df0'}/>
      </g>)}
      {[0,2,4,6,8,10].map(i => <text key={i} x={left+i*binWidth} y="220" textAnchor="middle">{number.format(i*step)}</text>)}
    </svg>
    <label className="plate-range"><span>{pt ? 'Faixa de redshift' : 'Redshift bin'} <b>{range}</b></span>
      <input type="range" min="0" max={sample.redshiftCounts.length-1} step="1" value={bin} aria-label={pt ? 'Faixa de redshift' : 'Redshift bin'} aria-valuetext={range + ', ' + reading} onChange={e => setBin(Number(e.target.value))}/>
      <output aria-live="polite">{reading}</output>
    </label>
  </div>;
}

export function PantheonPlate({locale}: {locale: Locale}) {
  const pt = locale === 'pt';
  const [distribution, setDistribution] = useState(false);
  const number = new Intl.NumberFormat(pt ? 'pt-BR' : 'en-GB');
  return <figure className="volume-plate">
    <figcaption><strong>Pantheon+</strong>
      <span>{number.format(sample.uniqueCID)} {pt ? 'supernovas nesta amostra' : 'supernovae in this sample'}</span>
    </figcaption>
    <div className="plate-modes" role="group" aria-label={pt ? 'Vista da amostra Pantheon+' : 'Pantheon+ sample view'}>
      <button type="button" aria-pressed={!distribution} onClick={() => setDistribution(false)}>Volume</button>
      <button type="button" aria-pressed={distribution} onClick={() => setDistribution(true)}>Redshift</button>
    </div>
    <div className="plate-stage" data-view={distribution ? 'distribution' : 'volume'}>
      {distribution ? <SampleDistribution locale={locale}/> : <Image src="/images/pantheon-volume.jpg" width={2560} height={1440}
        sizes="(min-width: 59rem) 848px, 92vw" loading="lazy"
        alt={pt ? 'Supernovas do Pantheon+ projetadas em três dimensões com quatro superfícies de referência de redshift' : 'Pantheon+ supernovae projected in three dimensions with four reference redshift surfaces'}/>}
    </div>
    <div className="plate-foot">
      <details><summary>{pt ? 'Como interpretar e fonte' : 'Interpretation and source'}</summary>
        <p>{distribution
          ? (pt ? 'Cada objeto entra uma vez, pelo CID. As faixas têm largura de 0,25 em redshift no referencial do CMB e incluem o limite inferior.' : 'Each CID is counted once. CMB-frame redshift bins have width 0.25 and include their lower edge.')
          : (pt ? 'As cascas marcam z = 0,1, 0,5, 1 e 2. As distâncias comóveis usam ΛCDM plano, Ωₘ = 0,3 e H₀ = 70 km/s/Mpc. Cor e brilho são ilustrativos, sem codificar medições. A renderização mostra a geometria do catálogo, não um resultado do NEXO.' : 'Shells mark z = 0.1, 0.5, 1 and 2. Comoving distances assume flat ΛCDM, Ωₘ = 0.3 and H₀ = 70 km/s/Mpc. Colour and brightness are illustrative and encode no measurements. The rendering shows the sample geometry rather than a NEXO result.')}
          {' '}<a href={sample.source}>{pt ? 'Dados Pantheon+' : 'Pantheon+ data'}</a> · <a href="https://arxiv.org/abs/2112.03863">Scolnic et al. (2022)</a>.
        </p>
        {distribution && <table><caption>{pt ? 'Supernovas por faixa de redshift' : 'Supernovae per redshift bin'}</caption>
          <thead><tr><th scope="col">{pt ? 'Faixa' : 'Bin'} z</th><th scope="col">N</th></tr></thead>
          <tbody>{sample.redshiftCounts.map((n,i) => <tr key={i}><th scope="row">{number.format(i*sample.redshiftBinWidth)} ≤ z &lt; {number.format((i+1)*sample.redshiftBinWidth)}</th><td>{number.format(n)}</td></tr>)}</tbody>
        </table>}
      </details>
      <a href={'/'+locale+'/data#atlas'}>{pt ? 'Explorar observáveis' : 'Explore observables'} <span aria-hidden="true">→</span></a>
    </div>
  </figure>;
}
