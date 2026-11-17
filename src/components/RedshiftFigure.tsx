import {pick, type Locale} from '@/lib/i18n';
import {getDossier} from '@/lib/data';
import expected from '../../data/source/redshift-exclusion-expected.json';

export const redshiftId = 'T-05ae703af393';
export const redshiftSlug = redshiftId.toLowerCase();

// expected.json as published by byDenoso/nexo-analyses at 95bd99da855f.
const des = expected.compilations.find(entry => entry.compilation === 'DES-SN5YR')!;
const union = expected.compilations.find(entry => entry.compilation === 'Union3')!;
const firstCut = [des.holds[0]!.fraction_removed!, union.holds[0]!.fraction_removed!] as const;

export const redshiftLimit = {
  'pt-BR': 'A redução é relativa ao ganho de ajuste neste recorte. Ela não mede significância estatística nem a probabilidade de um modelo. A comparação não identifica a causa da diferença.',
  en: 'The reduction is relative to the fit improvement in this configuration. It gives neither statistical significance nor the probability of a model. The comparison does not identify the cause of the difference.',
};

export function RedshiftFigure({locale}: {locale: Locale}) {
  const pt = locale === 'pt';
  const number = new Intl.NumberFormat(pt ? 'pt-BR' : 'en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const redshift = new Intl.NumberFormat(pt ? 'pt-BR' : 'en-GB', {maximumFractionDigits: 2});
  const rows = [
    {label: pt ? 'Amostra completa' : 'Full sample', values: [des.full.delta_chi2, union.full.delta_chi2]},
    ...des.holds.map(cut => ({
      label: 'z = ' + cut.band.map(value => redshift.format(value)).join('–'),
      values: [cut.delta_chi2, union.holds.find(other => other.band[0] === cut.band[0] && other.band[1] === cut.band[1])?.delta_chi2],
    })),
  ];
  const ticks = [0, 2, 4, 6, 8, 10];
  const maximum = Math.max(...ticks);
  const missing = pt ? 'Sem ajuste' : 'No fit';
  const dossier = getDossier(redshiftId);
  const data = dossier?.artefacts?.[0];

  return (
    <figure className="nx-paper-figure" aria-labelledby="redshift-figure-title">
      <figcaption>
        <p className="nx-eyebrow">{pt ? 'Figura · DES-SN5YR × Union3' : 'Figure · DES-SN5YR × Union3'}</p>
        <h2 id="redshift-figure-title">{pt ? 'Ganho de ajuste por corte' : 'Fit improvement by cut'}</h2>
        <p>{pt ? 'Δχ² mede quanto o modelo com energia escura variável melhora o ajuste em relação a ΛCDM plano. Cada faixa é retirada separadamente.' : 'Δχ² measures how much the evolving dark-energy model improves the fit over flat ΛCDM. Each interval is removed separately.'}</p>
      </figcaption>
      <div className="nx-plot" aria-hidden="true">
        <div className="nx-plot-legend">
          <span><i className="nx-swatch nx-solid" />DES-SN5YR</span>
          <span><i className="nx-swatch nx-hatched" />Union3</span>
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
                <div className="nx-plot-track" key={series}>
                  {value === undefined
                    ? <span className="nx-plot-missing">{missing}</span>
                    : <><span className={series === 0 ? 'nx-solid' : 'nx-hatched'} style={{width: `${value / maximum * 100}%`}} /><b>{number.format(value)}</b></>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="nx-figure-note">{pt ? 'Barras mais curtas indicam menor ganho de ajuste. Union3 fica com menos de 10 pontos no último corte.' : 'Shorter bars indicate a smaller improvement. Fewer than 10 Union3 points remain after the final cut.'}</p>
      <div className="nx-figure-links">
        <details className="nx-values">
          <summary>{pt ? 'Ler os valores em tabela' : 'Read values as a table'}</summary>
          <table>
            <caption>{pt ? 'Ganho de ajuste, Δχ²' : 'Fit improvement, Δχ²'}</caption>
            <thead><tr><th scope="col">{pt ? 'Faixa retirada' : 'Excluded range'}</th><th scope="col">DES-SN5YR</th><th scope="col">Union3</th></tr></thead>
            <tbody>
              {rows.map(row => <tr key={row.label}><th scope="row">{row.label}</th>{row.values.map((value, index) => <td key={index}>{value === undefined ? missing : number.format(value)}</td>)}</tr>)}
            </tbody>
          </table>
        </details>
        {data && <a className="text-link" href={data.url}>{pt ? 'Ver dados da figura' : 'View figure data'}</a>}
      </div>
    </figure>
  );
}

export function RedshiftFinding({locale, precise = false}: {locale: Locale; precise?: boolean}) {
  const pt = locale === 'pt';
  const percent = new Intl.NumberFormat(pt ? 'pt-BR' : 'en-GB', {style: 'percent', minimumFractionDigits: precise ? 1 : 0, maximumFractionDigits: precise ? 1 : 0});
  const [value, comparison] = firstCut.map(fraction => percent.format(fraction));
  return pt
    ? <>Retirar <b>z = 0,01–0,15</b> reduziu o ganho de ajuste em <strong>{value}</strong> no DES-SN5YR e em <strong>{comparison}</strong> no Union3. Ambos os ajustes usam BAO do DESI DR2 e prior Ωm = 0,3 ± 0,01.</>
    : <>Removing <b>z = 0.01–0.15</b> reduced the fit improvement by <strong>{value}</strong> in DES-SN5YR and <strong>{comparison}</strong> in Union3. Both fits use DESI DR2 BAO and the prior Ωm = 0.3 ± 0.01.</>;
}

export function RedshiftLimit({locale}: {locale: Locale}) {
  return <div className="nx-limit" id="limits">
    <h2>{locale === 'pt' ? 'Alcance do resultado' : 'Scope of the result'}</h2>
    <p>{pick(redshiftLimit, locale)}</p>
  </div>;
}
