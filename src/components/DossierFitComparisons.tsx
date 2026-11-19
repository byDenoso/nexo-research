import {fmtDate, pick, type Locale} from '@/lib/i18n';
import type {Dossier} from '@/lib/schemas';
import {TracerSelector} from './experiments/TracerSelector';
import diagnostic from '../../public/desi-dr2-tracer-diagnostic.json';
import styles from './FitComparison.module.css';

export const desiTracerId = diagnostic.record;
export const desiTracerAnchor = 'desi-tracer-exclusion';

export function DesiTracerComparison({locale}: {locale: Locale}) {
  const pt = locale === 'pt';
  const numberLocale = pt ? 'pt-BR' : 'en-GB';
  const number = new Intl.NumberFormat(numberLocale, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const signed = new Intl.NumberFormat(numberLocale, {signDisplay: 'exceptZero', minimumFractionDigits: 2, maximumFractionDigits: 2});
  const formatShift = (value: number) => signed.format(value).replace('-', '−');
  const z = new Intl.NumberFormat(numberLocale, {minimumFractionDigits: 3, maximumFractionDigits: 3});
  const rows = diagnostic.parameters.tracer_groups.map(({label, z: [redshift]}, index) => ({
    label, redshift: redshift!,
    fits: diagnostic.compilations.map(({full, holds}) => {
      const gain = holds[index]!.delta_chi2;
      return {gain, shift: gain - full.delta_chi2};
    }),
  }));
  const extent = Math.ceil(Math.max(...rows.flatMap(row => row.fits.map(fit => Math.abs(fit.shift)))));
  const title = pt ? 'Quanto muda o ajuste sem cada traçador do DESI?' : 'How much does the fit change without each DESI tracer?';
  return (
    <section id={desiTracerAnchor} className={`card ${styles.diagnostic}`} aria-labelledby="desi-tracer-title">
      <h2 id="desi-tracer-title">{title}</h2>
      <p>{pt
        ? 'Diagnóstico complementar com dados públicos. Cada retirada refaz ΛCDM plano e CPL com DESI DR2 BAO, uma compilação de supernovas por vez e prior Ωₘ = 0,30 ± 0,01. O bloco LRG3 + ELG1 é retirado em conjunto.'
        : 'Supplementary diagnostic using public data. Each omission refits flat ΛCDM and CPL with DESI DR2 BAO, one supernova compilation at a time, and an Ωₘ = 0.30 ± 0.01 prior. The LRG3 + ELG1 block is removed together.'}</p>
      <p>{pt
        ? 'Δχ² = χ²(ΛCDM) − χ²(CPL). A variação é o Δχ² após a retirada menos o Δχ² da amostra completa. Um valor negativo indica perda de ganho do CPL.'
        : 'Δχ² = χ²(ΛCDM) − χ²(CPL). The change is the Δχ² after omission minus the full-sample Δχ². A negative value indicates a smaller CPL improvement.'}</p>
      <TracerSelector locale={locale} rows={rows}/>
      <figure className={styles.figure} aria-labelledby="desi-shift-title">
        <figcaption className={styles.title} id="desi-shift-title">{pt ? 'Variação no ganho de ajuste do CPL' : 'Change in CPL fit improvement'}</figcaption>
        <div className={`${styles.layout} ${styles.diagnosticLayout}`}>
          <div aria-hidden="true">
            <p className={styles.legend}><span>DES-SN5YR</span><span>Union3</span></p>
            <div className={styles.shiftRows}>
              {rows.map(({label, fits}) => (
                <div className={styles.shiftRow} key={label}>
                  <span>{label}</span>
                  <div className={styles.shiftTrack}>
                    {fits.map(({shift}, index) => <span key={index} style={{
                      insetInlineStart: `${50 + 50 * Math.min(shift, 0) / extent}%`,
                      inlineSize: `${50 * Math.abs(shift) / extent}%`,
                    }} />)}
                  </div>
                </div>
              ))}
              <div className={styles.shiftRow}><span /><div className={styles.ticks}><span>−{extent}</span><span>0</span><span>+{extent}</span></div></div>
            </div>
          </div>
          <div>
            <table className={styles.table}>
              <caption className={styles.caption}>{pt ? 'Δχ² após a retirada e variação' : 'Δχ² after omission and change'}</caption>
              <thead><tr><th scope="col">{pt ? 'Traçador retirado' : 'Omitted tracer'}</th>{diagnostic.compilations.map(({compilation}) => <th scope="col" key={compilation}>{compilation}</th>)}</tr></thead>
              <tbody>
                <tr><th scope="row">{pt ? 'Todos os traçadores' : 'All tracers'}</th>
                  {diagnostic.compilations.map(({compilation, full}) => <td key={compilation}>{number.format(full.delta_chi2)}</td>)}</tr>
                {rows.map(({label, redshift, fits}) => (
                  <tr key={label}><th scope="row">{label}<small>z = {z.format(redshift)}</small></th>
                    {fits.map(({gain, shift}, index) => <td key={index}>{number.format(gain)}<small>{formatShift(shift)}</small></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={styles.sources}>{pt ? 'Fonte' : 'Source'} · <a className="text-link" href="/desi-dr2-tracer-diagnostic.json">{pt ? 'Resultados e hashes (JSON)' : 'Results and hashes (JSON)'}</a> · <a className="text-link" href={diagnostic.recipe}>{pt ? 'Receita de ajuste' : 'Fitting recipe'}</a> · <time dateTime={diagnostic.run_date}>{fmtDate(diagnostic.run_date, locale)}</time></p>
          </div>
        </div>
      </figure>
    </section>
  );
}

export function NonPhantomProfile({profile, locale}: {profile: NonNullable<Dossier['nonPhantomProfile']>; locale: Locale}) {
  const pt = locale === 'pt';
  const number = new Intl.NumberFormat(pt ? 'pt-BR' : 'en-GB', {maximumFractionDigits: 4});
  return (
    <section id="non-phantom-profile" className={`card ${styles.diagnostic}`} aria-labelledby="non-phantom-title">
      <h2 id="non-phantom-title">{pt ? 'Custo de impor w ≥ −1 por Ωₘ fixo' : 'Cost of imposing w ≥ −1 at fixed Ωₘ'}</h2>
      <p>{pt
        ? 'Em cada Ωₘ, Δχ² é o χ² mínimo com a restrição menos o χ² mínimo do ajuste livre.'
        : 'At each Ωₘ, Δχ² is the constrained minimum χ² minus the unconstrained minimum χ².'} {pick(profile.scope, locale)}</p>
      <table className={styles.table}>
        <caption className="sr-only">{pt ? 'Custo da restrição por valor fixo de Ωₘ' : 'Cost of the constraint by fixed Ωₘ'}</caption>
        <thead><tr><th scope="col">{pt ? 'Ωₘ fixo' : 'Fixed Ωₘ'}</th><th scope="col">Δχ²</th></tr></thead>
        <tbody>{profile.rows.map(({omegaM, deltaChi2}) => <tr key={omegaM}><th scope="row">{number.format(omegaM)}</th><td>{number.format(deltaChi2)}</td></tr>)}</tbody>
      </table>
      <p className={styles.sources}>{pt ? 'Fonte' : 'Source'} · <a className="text-link" href={profile.source.url}>{pick(profile.source.label, locale)}</a></p>
    </section>
  );
}
