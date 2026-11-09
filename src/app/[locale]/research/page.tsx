import Link from 'next/link';
import {notFound} from 'next/navigation';
import {PageHead} from '@/components/ui';
import {getProjects, getResults} from '@/lib/data';
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
  return (
    <>
      <PageHead kicker={tr(D.nav.research, locale)} title={tr(D.research.title, locale)} lead={tr(D.research.lead, locale)} />
      <div className="wrap mt-12 grid gap-6">
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
              <p className="mt-5"><Link className="text-accent underline underline-offset-4" href={`${href(locale, '/results')}?line=${line}`}>{count} {tr(D.lines.results, locale)} →</Link></p>
            </section>
          );
        })}
      </div>
    </>
  );
}
