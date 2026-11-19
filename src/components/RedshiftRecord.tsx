import Link from 'next/link';
import {redshiftQuestion} from '@/lib/editorial';
import {getManifest, lastDossierCorrection} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {fmtDate, pick, type Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';
import type {Dossier, Result} from '@/lib/schemas';
import {NonPhantomProfile} from './DossierFitComparisons';
import {RedshiftFigure, RedshiftFinding, RedshiftLimit} from './RedshiftFigure';
import {StatusBadge} from './ui';

export function RedshiftRecord({item, dossier, locale}: {item: Result; dossier: Dossier; locale: Locale}) {
  const pt = locale === 'pt';
  const familyUrl = href(locale, '/results/families/redshift-exclusion');
  const snapshot = getManifest().generatedFrom;
  const correction = lastDossierCorrection(dossier);

  return (
    <article className="nexo-editorial nx-record">
      <div className="wrap">
        <nav className="nx-crumbs" aria-label={pt ? 'Localização' : 'Breadcrumb'}>
          <Link href={href(locale, '/results')}>{tr(D.results.title, locale)}</Link>
          <Link href={familyUrl}>{pt ? 'Família de exclusão por redshift' : 'Redshift exclusion family'}</Link>
        </nav>
        <header className="nx-record-header" id="question">
          <p className="nx-eyebrow">{pt ? 'Exclusão por redshift / Supernovas Ia' : 'Redshift exclusion / Type Ia supernovae'}</p>
          <h1>{pick(redshiftQuestion, locale)}</h1>
        </header>
        <div className="nx-lead nx-record-lead">
          <div className="nx-lead-copy" id="result">
            <p className="nx-deck"><RedshiftFinding locale={locale} precise /></p>
            <p className="nx-status"><StatusBadge status={item.status} locale={locale} /> {tr(D.status[item.status].d, locale)}</p>
            <RedshiftLimit locale={locale} />
            <nav className="nx-jumps" aria-label={pt ? 'Seções do teste' : 'Sections of the test'}>
              <a className="text-link" href="#method">{pt ? 'Condições e método' : 'Conditions and method'} <span aria-hidden="true">↓</span></a>
              <a className="text-link" href="#record-provenance-title">{pt ? 'Fontes e código' : 'Sources and code'} <span aria-hidden="true">↓</span></a>
            </nav>
          </div>
          <RedshiftFigure locale={locale} />
        </div>

        <div className="nx-record-body">
          <section className="nx-method" id="method">
            <h2>{pt ? 'Condições e método' : 'Conditions and method'}</h2>
            <p>{pick(dossier.method ?? item.method, locale)}</p>
            <p>{pt ? 'A fração removida é 1 − Δχ² após o corte / Δχ² da amostra completa, em cada compilação. Repetições com diferentes recortes e priors não são medições independentes.' : 'The fraction removed is 1 − Δχ² after the cut / full-sample Δχ², for each compilation. Repeating the analysis with different cuts and priors does not yield independent measurements.'}</p>
            {dossier.corrections?.map(entry => (
              <div key={entry.date} className="record-correction nx-correction">
                <h3>{pt ? 'Correção sobre o CMB' : 'CMB correction'} · <time dateTime={entry.date}>{fmtDate(entry.date, locale)}</time></h3>
                <p>{pick(entry.note, locale)}</p>
              </div>
            ))}
            {dossier.rerun && (
              <details id="rerun" className="nx-archive">
                <summary>{pt ? 'Consultar a tabela da reexecução publicada' : 'Read the published rerun table'}</summary>
                <table className="record-rerun">
                  <caption>{pt ? 'Reexecução de' : 'Rerun of'} <time dateTime={dossier.rerun.date}>{fmtDate(dossier.rerun.date, locale)}</time></caption>
                  <thead><tr><th scope="col">{pt ? 'Ajuste' : 'Fit'}</th><th scope="col">{pt ? 'Valor' : 'Value'}</th></tr></thead>
                  <tbody>{dossier.rerun.values.map(entry => <tr key={entry.label.en}><th scope="row">{pick(entry.label, locale)}</th><td>{pick(entry.value, locale)}</td></tr>)}</tbody>
                </table>
                <p className="nx-source-technical">{pt
                  ? 'A tabela histórica registra +15,5% no corte DES-SN5YR de z = 0,5–2,3. O arredondamento direto da fração no expected.json dá +15,4%. A figura usa os valores de Δχ² do JSON.'
                  : 'The archived table reports +15.5% for the DES-SN5YR cut at z = 0.5–2.3. Direct rounding of the fraction in expected.json gives +15.4%. The figure uses the Δχ² values in the JSON.'}</p>
              </details>
            )}
            <details className="nx-archive">
              <summary>{pt ? 'Ler a pergunta e os limites do registro original' : 'Read the original question and limitations'}</summary>
              <p>{pick(item.question, locale)}</p>
              <p>{pick(item.result, locale)}</p>
              {item.figure && <ul>{item.figure.limitations.map(entry => <li key={entry.en}>{pick(entry, locale)}</li>)}</ul>}
              <Link className="text-link" href={href(locale, '/data')}>{pt ? 'Consultar o snapshot público da Tower' : 'View the Tower public snapshot'}</Link>
            </details>
            <p><Link className="text-link arrow-link" href={familyUrl}>{pt ? 'Comparar as demais execuções da família' : 'Compare the other runs in this family'}</Link></p>
          </section>

          <aside className="nx-sources" aria-labelledby="record-provenance-title">
            <h2 id="record-provenance-title">{pt ? 'Fontes e código' : 'Sources and code'}</h2>
            <dl>
              {dossier.datasets.map(entry => (
                <div key={entry.name}>
                  <dt>{entry.name}</dt>
                  <dd>{pick(entry.role, locale)}</dd>
                  {entry.release && <dd className="nx-source-technical">{entry.release}</dd>}
                  {entry.table && <dd className="nx-source-technical">{entry.table}</dd>}
                  {entry.reference && <dd>{entry.reference.url ? <a className="text-link" href={entry.reference.url}>{entry.reference.label}</a> : entry.reference.label}</dd>}
                </div>
              ))}
            </dl>
            <h3>{pt ? 'Análise reproduzível' : 'Reproducible analysis'}</h3>
            <ul role="list">
              {dossier.code?.map(entry => <li key={entry.url}><a className="text-link" href={entry.url}>{pt ? 'Código da análise' : 'Analysis code'}</a></li>)}
              {dossier.artefacts?.map(entry => <li key={entry.url}><a className="text-link" href={entry.url}>{entry.label}</a></li>)}
              <li><a className="text-link" href="/atlas-public.json">{pt ? 'Manifesto público' : 'Public manifest'} · atlas-public.json</a></li>
            </ul>
            <p className="nx-source-technical">{pt ? 'Versão do catálogo' : 'Catalogue version'} · <time dateTime={snapshot.latestUpdate}>{fmtDate(snapshot.latestUpdate, locale)}</time><br />{item.id} · {snapshot.contract} · SHA-256 {snapshot.snapshotSha256.slice(0, 12)}…</p>
            {correction && <p className="nx-source-technical">{pt ? 'Última correção editorial' : 'Last editorial correction'} · <time dateTime={correction}>{fmtDate(correction, locale)}</time></p>}
            <p className="nx-source-technical">{pt ? 'Data da análise' : 'Analysis date'} · {dossier.analysisDate ? <time dateTime={dossier.analysisDate}>{fmtDate(dossier.analysisDate, locale)}</time> : (pt ? 'Não consta no resumo público.' : 'Not stated in the public summary.')}</p>
            {item.publishedAt && <p className="nx-source-technical">{tr(D.results.publicRecordDate, locale)} · <time dateTime={item.publishedAt}>{fmtDate(item.publishedAt, locale)}</time></p>}
            <p className="nx-source-technical">{tr(D.results.updated, locale)} · <time dateTime={item.updatedAt}>{fmtDate(item.updatedAt, locale)}</time></p>
            <Link className="text-link arrow-link" href={href(locale, '/data')}>{tr(D.data.title, locale)}</Link>
          </aside>
        </div>
        {dossier.nonPhantomProfile && <NonPhantomProfile profile={dossier.nonPhantomProfile} locale={locale} />}
      </div>
    </article>
  );
}
