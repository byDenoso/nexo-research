import {notFound} from 'next/navigation';
import {PageHead} from '@/components/ui';
import {getProjects} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {isLocale, pick} from '@/lib/i18n';
import {pageMeta} from '@/lib/seo';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, '/projects', tr(D.projects.title, locale), tr(D.projects.lead, locale));
}

export default async function ProjectsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  return (
    <>
      <PageHead kicker={tr(D.nav.projects, locale)} title={tr(D.projects.title, locale)} lead={tr(D.projects.lead, locale)} />
      <ul className="wrap projects-index" role="list">
        {getProjects().map(project => (
          <li key={project.id} className="card motion-reveal project-row">
            <p className="font-mono text-xs text-muted">{tr(D.lines.items[project.line].n, locale)} · {tr(D.projects.state[project.state], locale)}</p>
            <h2 className="mt-2 text-xl font-semibold">{pick(project.title, locale)}</h2>
            <p className="mt-2 text-muted">{pick(project.summary, locale)}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
