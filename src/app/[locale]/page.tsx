import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ActivityChart} from '@/components/ActivityChart';
import {Pipeline} from '@/components/Pipeline';
import {ResultCard, Section} from '@/components/ui';
import {getProfile, getProjects, getPublications, datasetMentions, getResults} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {fmtDate, isLocale, pick} from '@/lib/i18n';
import {LINES} from '@/lib/schemas';
import {href} from '@/lib/seo';

export default async function Home({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const results = getResults();
  const profile = getProfile();
  const projects = getProjects();
  const publications = getPublications().slice(0, 3);
  const withFigure = results.filter(item => item.figure);
  const selected = [...withFigure, ...results.filter(item => !item.figure)].slice(0, 6);
  const counts = (line: (typeof LINES)[number]) => results.filter(item => item.lines.includes(line)).length;

  return (
    <>
      <div className="hero-glow border-b border-line">
        <div className="wrap grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="kicker">{tr(D.site, locale)}</p>
            <h1 className="mt-3 text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">NEXO Research</h1>
            <p className="mt-4 text-xl text-ink">{tr(D.tagline, locale)}</p>
            <p className="mt-5 max-w-xl text-muted">{tr(D.mission, locale)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={href(locale, '/results')} className="btn btn-primary">{tr(D.cta.results, locale)}</Link>
              <Link href={href(locale, '/publications')} className="btn">{tr(D.cta.publications, locale)}</Link>
              <Link href={href(locale, '/projects')} className="btn">{tr(D.cta.projects, locale)}</Link>
            </div>
          </div>
          <ActivityChart bins={datasetMentions(results)} total={results.length} locale={locale} />
        </div>
      </div>

      <section className="border-b border-line bg-surface" aria-label={tr(D.who.kicker, locale)}>
        <div className="wrap flex flex-wrap items-center gap-x-10 gap-y-3 py-5 text-sm">
          <span className="kicker">{tr(D.who.kicker, locale)}</span>
          <span><strong className="font-semibold">{profile.name}</strong> · {tr(D.who.role, locale)}</span>
          <span className="text-muted">{tr(D.who.affiliation, locale)}</span>
          <span className="font-mono text-muted">{tr(D.who.orcid, locale)}: {profile.orcid ? <a className="text-accent underline underline-offset-4" href={`https://orcid.org/${profile.orcid}`}>{profile.orcid}</a> : tr(D.who.pending, locale)}</span>
          <Link href={href(locale, '/contact')} className="text-accent underline underline-offset-4">{tr(D.who.contact, locale)}</Link>
        </div>
      </section>

      <Section id="how" title={tr(D.how.title, locale)} lead={tr(D.how.lead, locale)}><Pipeline locale={locale} /></Section>

      <Section id="lines" title={tr(D.lines.title, locale)} lead={tr(D.lines.lead, locale)}>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {LINES.map(line => (
            <li key={line} className="card p-5">
              <h3 className="text-lg font-semibold"><Link href={`${href(locale, '/research')}#${line}`} className="hover:text-accent">{tr(D.lines.items[line].n, locale)}</Link></h3>
              <p className="mt-2 text-sm text-muted">{tr(D.lines.items[line].d, locale)}</p>
              <p className="mt-4 font-mono text-xs text-muted">{counts(line)} {tr(D.lines.results, locale)} · {projects.filter(project => project.line === line).length} {tr(D.lines.projects, locale)}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="results" title={tr(D.results.selected, locale)} lead={tr(D.results.lead, locale)}
        action={<Link href={href(locale, '/results')} className="btn">{tr(D.cta.all, locale)}</Link>}>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{selected.map(item => <li key={item.id}><ResultCard item={item} locale={locale} /></li>)}</ul>
      </Section>

      <Section id="publications" title={tr(D.pubs.title, locale)} lead={tr(D.pubs.lead, locale)} action={<Link href={href(locale, '/publications')} className="btn">{tr(D.cta.all, locale)}</Link>}>
        {publications.length === 0 ? <p className="card p-5 text-muted">{tr(D.pubs.empty, locale)}</p> : (
          <ul className="grid gap-4 md:grid-cols-3">{publications.map(pub => (
            <li key={pub.id} className="card p-5"><p className="font-mono text-xs text-muted">{tr(D.pubState[pub.state], locale)} · {pub.date}</p><h3 className="mt-2 font-semibold">{pub.title}</h3></li>
          ))}</ul>
        )}
      </Section>

      <Section id="updates" title={tr(D.updates.title, locale)} lead={tr(D.updates.lead, locale)} action={<Link href={href(locale, '/updates')} className="btn">{tr(D.cta.all, locale)}</Link>}>
        <ul className="card divide-y divide-line">
          {results.slice(0, 5).map(item => (
            <li key={item.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 p-4">
              <time dateTime={item.updatedAt} className="font-mono text-xs text-muted">{fmtDate(item.updatedAt, locale)}</time>
              <Link href={href(locale, `/results/${item.slug}`)} className="hover:text-accent">{pick(item.title, locale)}</Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
