import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ActivityChart} from '@/components/ActivityChart';
import {Pipeline} from '@/components/Pipeline';
import {ResultCard, Section} from '@/components/ui';
import {getProfile, getProjects, datasetMentions, getResults} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {fmtDate, isLocale, pick} from '@/lib/i18n';
import {toResultCard} from '@/lib/rows';
import {LINES} from '@/lib/schemas';
import {href} from '@/lib/seo';

const explore = ['research', 'methods', 'data'] as const;

export default async function Home({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const results = getResults();
  const profile = getProfile();
  const projects = getProjects();
  const datasets = datasetMentions(results);
  // Keep the DES-SN5YR interval removal result in the catalog.
  const homeSelection = results.filter(item => item.slug !== 't-05ae703af393');
  const withFigure = homeSelection.filter(item => item.figure);
  const selected = [...withFigure, ...homeSelection.filter(item => !item.figure)].slice(0, 6);
  const counts = (line: (typeof LINES)[number]) => results.filter(item => item.lines.includes(line)).length;

  return (
    <>
      <section className="home-hero" aria-labelledby="mission-title">
        <div className="wrap home-hero-inner">
          <div className="home-intro">
            <p className="kicker">{tr(D.site, locale)} / {tr(D.hero.kicker, locale)}</p>
            <h1 id="mission-title">{tr(D.hero.headline, locale)}</h1>
            <p className="home-tagline">{tr(D.tagline, locale)}</p>
            <p className="home-mission">{tr(D.mission, locale)}</p>
            <div className="home-actions">
              <Link href={href(locale, '/results')} prefetch={false} className="btn btn-primary arrow-link">{tr(D.cta.results, locale)}</Link>
              <Link href={href(locale, '/research')} prefetch={false} className="btn">{tr(D.cta.research, locale)}</Link>
            </div>
          </div>
          <figure className="mission-field">
            <img src="/cosmic-field.svg" width="960" height="620" fetchPriority="high" alt="" />
            <figcaption>{tr(D.hero.illustration, locale)}</figcaption>
          </figure>
        </div>
      </section>

      <section className="mission-stats" aria-label={tr(D.institute.scope, locale)}>
        <dl className="wrap mission-stats-grid">
          {([['results', results.length], ['lines', LINES.length], ['datasets', datasets.length]] as const).map(([key, count]) => (
            <div key={key}><dt>{tr(D.institute[key], locale)}</dt><dd>{count}</dd></div>
          ))}
        </dl>
      </section>

      <Section id="explore" title={tr(D.institute.explore, locale)}>
        <div className="mission-explore">
          <ul className="mission-links" role="list">
            {explore.map((route, index) => (
              <li key={route}>
                <Link href={href(locale, `/${route}`)} prefetch={false} className="mission-link arrow-link">
                  <span className="mission-link-index" aria-hidden="true">0{index + 1}</span>
                  <div><h3>{tr(D.nav[route], locale)}</h3><p>{tr(D.institute[route], locale)}</p></div>
                </Link>
              </li>
            ))}
          </ul>
          <ActivityChart bins={datasets} total={results.length} locale={locale} />
        </div>
      </Section>

      <section className="wrap profile-strip" aria-labelledby="profile-heading">
        <div>
          <h2 id="profile-heading" className="kicker">{tr(D.who.kicker, locale)}</h2>
          <p className="profile-name"><Link href={href(locale, '/about')} prefetch={false}>{profile.name}</Link></p>
          <p className="profile-affiliation">{tr(D.who.role, locale)} · {tr(D.who.affiliation, locale)}</p>
        </div>
        <div className="profile-links">
          <p className="profile-orcid">{tr(D.who.orcid, locale)} {profile.orcid ? <a className="text-link" href={`https://orcid.org/${profile.orcid}`} rel="noopener noreferrer">{profile.orcid}</a> : tr(D.who.pending, locale)}</p>
          {profile.email ? <a className="btn profile-email" href={`mailto:${profile.email}`}>{profile.email}</a> : (
            <Link href={href(locale, '/contact')} prefetch={false} className="btn arrow-link">{tr(D.who.contact, locale)}</Link>
          )}
        </div>
      </section>

      <Section id="how" title={tr(D.how.title, locale)} lead={tr(D.how.lead, locale)}><Pipeline locale={locale} /></Section>

      <Section id="lines" title={tr(D.lines.title, locale)} lead={tr(D.lines.lead, locale)}>
        <ul className="result-grid" role="list">
          {LINES.map(line => (
            <li key={line} className="card research-line-card">
              <h3><Link href={`${href(locale, '/research')}#${line}`} prefetch={false}>{tr(D.lines.items[line].n, locale)}</Link></h3>
              <p>{tr(D.lines.items[line].d, locale)}</p>
              <p className="research-line-count">{counts(line)} {tr(D.lines.results, locale)} · {projects.filter(project => project.line === line).length} {tr(D.lines.projects, locale)}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="results" title={tr(D.results.selected, locale)} lead={tr(D.results.lead, locale)}
        action={<Link href={href(locale, '/results')} prefetch={false} className="btn">{tr(D.cta.all, locale)}</Link>}>
        <ul className="result-grid" role="list">{selected.map(item => <li key={item.id}><ResultCard item={toResultCard(item, locale)} locale={locale} /></li>)}</ul>
      </Section>

      <Section id="updates" title={tr(D.updates.title, locale)} lead={tr(D.updates.lead, locale)} action={<Link href={href(locale, '/updates')} prefetch={false} className="btn">{tr(D.cta.all, locale)}</Link>}>
        <ul className="card divide-y divide-line">
          {results.slice(0, 5).map(item => (
            <li key={item.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 p-4">
              <time dateTime={item.updatedAt} className="font-mono text-xs text-muted">{fmtDate(item.updatedAt, locale)}</time>
              <Link href={href(locale, `/results/${item.slug}`)} prefetch={false} className="hover:text-accent">{pick(item.title, locale)}</Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
