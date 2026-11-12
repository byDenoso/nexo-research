import Link from 'next/link';
import {notFound} from 'next/navigation';
import {PageHead} from '@/components/ui';
import {getProfile} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {isLocale, pick} from '@/lib/i18n';
import {href, pageMeta} from '@/lib/seo';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, '/code', tr(D.code.title, locale), tr(D.code.lead, locale));
}

export default async function CodePage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const repositories = getProfile().repositories;
  const pt = locale === 'pt';
  return (
    <>
      <PageHead kicker={tr(D.nav.code, locale)} title={tr(D.code.title, locale)} lead={tr(D.code.lead, locale)} />
      <div className="wrap page-body inst-page">
        {repositories.length === 0 ? <p className="card p-6 text-muted">{tr(D.code.none, locale)}</p> : (
          <ul className="inst-repos" role="list">
            {repositories.map(repo => (
              <li key={repo.url}>
                <h2><a href={repo.url} target="_blank" rel="noopener noreferrer">{repo.label}</a></h2>
                {repo.description && <p>{pick(repo.description, locale)}</p>}
                <p className="inst-repo-url">{repo.url.replace('https://', '')}</p>
              </li>
            ))}
          </ul>
        )}
        <section aria-labelledby="code-run">
          <h2 id="code-run">{pt ? 'Como rodar os testes do validador' : 'How to run the validator tests'}</h2>
          <p>{pt
            ? 'O validador usa só a biblioteca padrão do Python; o protocolo de busca precisa do NumPy. Os 43 casos usam dados sintéticos e terminam em poucos segundos.'
            : 'The validator uses only the Python standard library; the search protocol needs NumPy. The 43 cases use synthetic data and finish in a few seconds.'}</p>
          <pre className="inst-pre"><code>{'git clone https://github.com/byDenoso/nexo-research.git\ncd nexo-research/software/nexo-guard\npython test_nexo_v32.py'}</code></pre>
        </section>
        {repositories.length > 0 && <p className="inst-note">{tr(D.code.partial, locale)}</p>}
        <p className="inst-actions"><Link className="text-link" href={href(locale, '/methods')}>{pt ? 'Métodos' : 'Methods'}</Link><Link className="text-link" href={href(locale, '/data')}>{pt ? 'Dados e fontes' : 'Data and sources'}</Link></p>
      </div>
    </>
  );
}
