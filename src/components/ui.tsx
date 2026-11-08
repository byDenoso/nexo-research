import Link from 'next/link';
import type {ReactNode} from 'react';
import {D, tr} from '@/lib/dict';
import {fmtDate, pick, type Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';
import type {Result, Status} from '@/lib/schemas';

const TONE: Record<Status, string> = {
  CANDIDATE: 'border-[color:var(--warn)] text-[color:var(--warn)]',
  TESTING: 'border-accent text-accent',
  VALIDATED: 'border-[color:var(--ok)] text-[color:var(--ok)]',
  REFUTED: 'border-[color:var(--bad)] text-[color:var(--bad)]',
  PUBLISHED: 'border-violet text-violet'
};

export function StatusBadge({status, locale}: {status: Status; locale: Locale}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs ${TONE[status]}`} title={tr(D.status[status].d, locale)}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {tr(D.status[status].n, locale)}
    </span>
  );
}

export function PageHead({kicker, title, lead}: {kicker?: string; title: string; lead?: string}) {
  return (
    <div className="hero-glow border-b border-line">
      <div className="wrap py-14 md:py-20">
        {kicker && <p className="kicker">{kicker}</p>}
        <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">{title}</h1>
        {lead && <p className="mt-5 max-w-3xl text-lg text-muted">{lead}</p>}
      </div>
    </div>
  );
}

export function Section({id, title, lead, children, action}: {id?: string; title: string; lead?: string; children: ReactNode; action?: ReactNode}) {
  return (
    <section id={id} className="wrap mt-20 scroll-mt-24" aria-labelledby={id ? `${id}-h` : undefined}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id={id ? `${id}-h` : undefined} className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
          {lead && <p className="mt-2 max-w-3xl text-muted">{lead}</p>}
        </div>
        {action}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function ResultCard({item, locale}: {item: Result; locale: Locale}) {
  return (
    <article className="card flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <StatusBadge status={item.status} locale={locale} />
        <span className="font-mono text-xs text-muted">{item.id}</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-snug">
        <Link href={href(locale, `/results/${item.slug}`)} className="hover:text-accent">{pick(item.title, locale)}</Link>
      </h3>
      <p className="mt-3 line-clamp-4 text-sm text-muted">{pick(item.result, locale)}</p>
      <p className="mt-auto pt-4 font-mono text-xs text-muted">{tr(D.results.updated, locale)} {fmtDate(item.updatedAt, locale)}</p>
    </article>
  );
}
