import data from '../../data/curated/des-offset.json';
import type {Locale} from '@/lib/i18n';

// Lead analysis of 26/11/2026: offset of the whole DES sample against the other supernovae.
// Values come from data/curated/des-offset.json; the figure is drawn from them, never by hand.
const W = 460, ROW = 62, TOP = 30, LEFT = 118, RIGHT = 26;
const MIN = -0.08, MAX = 0.02;

export function DesOffsetFigure({locale}: {locale: Locale}) {
  const pt = locale === 'pt';
  const n = new Intl.NumberFormat(pt ? 'pt-BR' : 'en-GB', {minimumFractionDigits: 3, maximumFractionDigits: 3, signDisplay: 'exceptZero'});
  const x = (v: number) => LEFT + ((v - MIN) / (MAX - MIN)) * (W - LEFT - RIGHT);
  const H = TOP + data.offsets.length * ROW + 30;
  const ticks = [-0.08, -0.06, -0.04, -0.02, 0, 0.02];
  return (
    <figure className="nx-paper-figure des-offset-figure" aria-labelledby="des-offset-title">
      <figcaption>
        <p className="nx-eyebrow">{pt ? 'Figura · três compilações' : 'Figure · three compilations'}</p>
        <h2 id="des-offset-title">{pt ? 'Deslocamento do DES, em magnitude' : 'DES offset, in magnitudes'}</h2>
        <p>{pt
          ? 'Cada ponto é o deslocamento médio das supernovas do DES em relação às demais, com erro de 1σ. Valor negativo: DES mais brilhante.'
          : 'Each point is the mean shift of the DES supernovae relative to the others, with a 1σ error. Negative: DES brighter.'}</p>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={pt ? 'Deslocamento do DES nas três compilações' : 'DES offset in the three compilations'} style={{width: '100%', height: 'auto'}}>
        {ticks.map(t => <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={TOP - 10} y2={H - 26} stroke="var(--line)" strokeWidth={t === 0 ? 1.4 : 1} strokeDasharray={t === 0 ? undefined : '2 4'} />
          <text x={x(t)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="var(--nx-data)">{t === 0 ? '0' : n.format(t).replace(/0+$/, '')}</text>
        </g>)}
        {data.offsets.map((row, i) => {
          const y = TOP + i * ROW + ROW / 2;
          return <g key={row.compilation}>
            <text x={0} y={y - 4} fontSize="13" fill="var(--ink)" fontFamily="var(--nx-display)">{row.compilation}</text>
            <text x={0} y={y + 13} className="small" fill="var(--muted)" fontFamily="var(--nx-data)">{row.note[pt ? 'pt-BR' : 'en']}</text>
            <line x1={x(row.value - row.error)} x2={x(row.value + row.error)} y1={y} y2={y} stroke="var(--nx-star)" strokeWidth="1.5" />
            <line x1={x(row.value - row.error)} x2={x(row.value - row.error)} y1={y - 5} y2={y + 5} stroke="var(--nx-star)" strokeWidth="1.5" />
            <line x1={x(row.value + row.error)} x2={x(row.value + row.error)} y1={y - 5} y2={y + 5} stroke="var(--nx-star)" strokeWidth="1.5" />
            <circle cx={x(row.value)} cy={y} r="4.5" fill="var(--nx-star)" />
            <text x={x(row.value)} y={y - 12} textAnchor="middle" className="small" fill="var(--muted)" fontFamily="var(--nx-data)">{n.format(row.value)} ± {row.error.toFixed(3).replace('.', pt ? ',' : '.')}</text>
          </g>;
        })}
      </svg>
      <p className="nx-figure-note">{data.reference[pt ? 'pt-BR' : 'en']}</p>
      <details className="nx-values">
        <summary>{pt ? 'Ler os valores em tabela' : 'Read values as a table'}</summary>
        <table>
          <caption>{pt ? 'Deslocamento do DES e melhora do ajuste' : 'DES offset and fit improvement'}</caption>
          <thead><tr><th scope="col">{pt ? 'Compilação' : 'Compilation'}</th><th scope="col">{pt ? 'Deslocamento (mag)' : 'Offset (mag)'}</th><th scope="col">Δχ²</th></tr></thead>
          <tbody>{data.offsets.map(row => <tr key={row.compilation}><th scope="row">{row.compilation}</th><td>{n.format(row.value)} ± {row.error.toFixed(3)}</td><td>{row.dchi2.toLocaleString(pt ? 'pt-BR' : 'en-GB')}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}

export function DesOffsetLead({locale}: {locale: Locale}) {
  const pt = locale === 'pt';
  return <>
    <p className="nx-eyebrow">{pt ? '01 · Expansão / supernovas Ia' : '01 · Expansion / Type Ia supernovae'}</p>
    <h2 id="cover-title">{pt ? 'As supernovas do DES estão 0,035 mag mais brilhantes que as demais' : 'The DES supernovae are 0.035 mag brighter than the rest'}</h2>
    <p className="nx-status">{pt ? 'Validação independente pendente' : 'Independent validation pending'}</p>
    <p className="star-value">−0,035 ± 0,012 <small>mag · Pantheon+</small></p>
    <p className="nx-deck">{pt
      ? 'O deslocamento aparece igual em Pantheon+, DES-SN5YR e DES-Dovekie. Ele não muda com massa da galáxia hospedeira, cor, forma da curva de luz, poeira, época, campo ou redshift, e uma constante descreve os dados melhor que um gradiente. Esse é o comportamento esperado de um ponto zero fotométrico da amostra inteira.'
      : 'The shift is the same in Pantheon+, DES-SN5YR and DES-Dovekie. It does not change with host mass, colour, light-curve shape, dust, epoch, field or redshift, and a constant describes the data better than a gradient. That is how a photometric zero point of the whole sample behaves.'}</p>
    <p>{pt
      ? 'A leitura mais simples também explica um resultado antigo deste catálogo: retirar as supernovas de z < 0,15 apagava quase todo o ganho do modelo com energia escura variável. Sem a amostra de baixo z, o ponto zero do DES deixa de ter âncora, e o deslocamento passa a ser absorvido pela cosmologia.'
      : 'The simplest reading also accounts for an older result in this catalogue: removing the supernovae at z < 0.15 erased most of the gain of the evolving dark-energy model. Without the low-redshift sample, the DES zero point loses its anchor and the shift is absorbed by the cosmology.'}</p>
    <div className="nx-limit" id="scope">
      <h2>{pt ? 'Alcance' : 'Scope'}</h2>
      <p>{pt
        ? `Significância de 2,7 a 3,3σ conforme a compilação; o teste de dependência enxerga diferenças a partir de cerca de 0,02 mag. O tamanho concorda com ${data.independent.map(i => i.label).join(', ')}, que leem o mesmo efeito como erro do baixo z.`
        : `Significance of 2.7 to 3.3σ depending on the compilation; the dependence test sees differences from about 0.02 mag. The size agrees with ${data.independent.map(i => i.label).join(', ')}, who read the same effect as a low-redshift error.`}</p>
    </div>
  </>;
}
