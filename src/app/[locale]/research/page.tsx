import Link from 'next/link';
import {notFound} from 'next/navigation';
import {PageHead} from '@/components/ui';
import {getProjects, getResults, getPublications} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {isLocale, pick} from '@/lib/i18n';
import {LINES} from '@/lib/schemas';
import {href, pageMeta} from '@/lib/seo';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, '/research', tr(D.research.title, locale), tr(D.research.lead, locale));
}

export default async function ResearchPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const results = getResults();
  const projects = getProjects();
  const publications = getPublications();
  return (
    <>
      <PageHead kicker={tr(D.nav.research, locale)} title={tr(D.research.title, locale)} lead={tr(D.research.lead, locale)} />
      <div className="wrap mt-12 grid gap-6">
        <p className="line-overlap-note">{locale === 'pt' ? 'As linhas abaixo se sobrepõem. Cada registro pode aparecer em mais de uma frente, portanto as contagens não devem ser somadas.' : 'These research lines overlap. Each record can belong to more than one area, so the counts must not be summed.'}</p>
        {LINES.map(line => {
          const count = results.filter(item => item.lines.includes(line)).length;
          return (
            <section key={line} id={line} className="card research-panel scroll-mt-24 p-6" aria-labelledby={`${line}-h`}>
              <h2 id={`${line}-h`} className="text-2xl font-semibold">{tr(D.lines.items[line].n, locale)}</h2>
              <p className="mt-2 max-w-3xl text-muted">{tr(D.lines.items[line].d, locale)}</p>
              <ul className="mt-5 grid gap-3 md:grid-cols-2">
                {projects.filter(project => project.line === line).map(project => (
                  <li key={project.id} className="rounded-lg border border-line p-4">
                    <h3 className="font-semibold">{pick(project.title, locale)}</h3>
                    <p className="mt-1 text-sm text-muted">{pick(project.summary, locale)}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-5"><Link className="text-accent underline underline-offset-4" href={`${href(locale, '/results')}?line=${line}`}>{count > 0 ? count + ' ' + tr(D.lines.results, locale) : (locale === 'pt' ? 'Nenhum resultado público associado' : 'No public results associated')} →</Link></p>
            </section>
          );
        })}
        <section id="scientific-output" className="card research-panel scroll-mt-24 p-6" aria-labelledby="scientific-output-h">
          <h2 id="scientific-output-h" className="text-2xl font-semibold">{locale === 'pt' ? 'Produção científica pública' : 'Public scientific output'}</h2>
          <p className="mt-2 max-w-3xl text-muted">{publications.length ? (locale === 'pt' ? 'Trabalhos com divulgação autorizada, com estado editorial identificado.' : 'Works cleared for public release, with their editorial state indicated.') : (locale === 'pt' ? 'Ainda não há manuscritos autorizados neste catálogo. Trabalhos em avaliação e documentos internos não são divulgados automaticamente.' : 'No manuscripts have been cleared for this catalogue. Under-review and internal documents are not automatically disclosed.')}</p>
          {publications.length > 0 && <ul className="mt-4 grid gap-3">{publications.map(pub => <li key={pub.id}><Link className="text-link" href={href(locale, '/publications') + '#' + pub.id}>{pub.title}</Link></li>)}</ul>}
        </section>
      </div>
    </>
  );
}
