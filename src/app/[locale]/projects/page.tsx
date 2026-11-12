import Link from 'next/link';
import {notFound} from 'next/navigation';
import {PageHead} from '@/components/ui';
import {getProfile, getProjects, getResults} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {fmtDate, isLocale, pick} from '@/lib/i18n';
import {href, pageMeta} from '@/lib/seo';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, '/projects', tr(D.projects.title, locale), tr(D.projects.lead, locale));
}

export default async function ProjectsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const pt = locale === 'pt';
  const results = getResults();
  const lead = getProfile().name;
  // A project is shown as active only when the catalogue holds records for it.
  const projects = getProjects().map(project => {
    const pattern = project.pattern ? new RegExp(project.pattern, 'i') : null;
    const records = results.filter(item => item.lines.includes(project.line) && (!pattern || pattern.test(item.question.en)));
    const updated = records.reduce((max, item) => (item.updatedAt > max ? item.updatedAt : max), '');
    return {project, count: records.length, updated, state: records.length > 0 ? project.state : 'planned' as const};
  }).sort((a, b) => b.count - a.count);
  return (
    <>
      <PageHead kicker={tr(D.nav.projects, locale)} title={tr(D.projects.title, locale)} lead={tr(D.projects.lead, locale)} />
      <div className="wrap page-body inst-page">
        <ul className="inst-projects" role="list">
          {projects.map(({project, count, updated, state}) => (
            <li key={project.id}>
              <p className="inst-label">{tr(D.lines.items[project.line].n, locale)} · {tr(D.projects.state[state], locale)}</p>
              <h2>{pick(project.title, locale)}</h2>
              <p>{pick(project.summary, locale)}</p>
              <dl>
                <div><dt>{pt ? 'Responsável' : 'Lead'}</dt><dd>{lead}</dd></div>
                <div><dt>{pt ? 'Registros no catálogo' : 'Records in the catalogue'}</dt><dd>{count > 0
                  ? <Link className="text-link" href={href(locale, '/results') + '?line=' + project.line}>{count}</Link>
                  : (pt ? 'Nenhum até agora' : 'None so far')}</dd></div>
                {updated && <div><dt>{pt ? 'Último registro' : 'Latest record'}</dt><dd><time dateTime={updated}>{fmtDate(updated, locale)}</time></dd></div>}
              </dl>
            </li>
          ))}
        </ul>
        <p className="inst-note">{pt
          ? 'A contagem considera os registros da linha de pesquisa cuja pergunta trata do tema do projeto. Um projeto em preparação ainda não tem registro público.'
          : 'Counts include the records of the research line whose question addresses the project topic. A project in preparation has no public record yet.'}</p>
      </div>
    </>
  );
}
