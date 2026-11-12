import Link from 'next/link';
import type {ReactNode} from 'react';
import {D, tr} from '@/lib/dict';
import type {Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';
import type {Status} from '@/lib/schemas';
import {CatalogueTitle, catalogueTitleTransition} from './CatalogueTitle';

export type ResultCardData = {
  slug: string;
  id: string;
  title: string;
  excerpt: string;
  status: Status;
  updated: string;
};

export function StatusBadge({status, locale}: {status: Status; locale: Locale}) {
  return (
    <span className="status-badge" data-status={status} title={tr(D.status[status].d, locale)}>
      {tr(D.status[status].n, locale)}
    </span>
  );
}

export function PageHead({kicker, title, lead}: {kicker?: string; title: string; lead?: string}) {
  return (
    <div className="page-head">
      <div className="wrap page-head-inner">
        {kicker && kicker !== title && <p className="kicker">{kicker}</p>}
        <h1>{title}</h1>
        {lead && <p className="page-lead">{lead}</p>}
      </div>
    </div>
  );
}

export function Section({id, title, lead, children, action}: {id?: string; title: string; lead?: string; children: ReactNode; action?: ReactNode}) {
  return (
    <section id={id} className="wrap page-section" aria-labelledby={id ? `${id}-h` : undefined}>
      <div className="section-heading">
        <div>
          <h2 id={id ? `${id}-h` : undefined}>{title}</h2>
          {lead && <p>{lead}</p>}
        </div>
        {action}
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}

export function EmptyState({message, action}: {message: string; action?: ReactNode}) {
  return (
    <div className="card empty-state">
      <p>{message}</p>
      {action}
    </div>
  );
}

export function ResultCard({item, locale}: {item: ResultCardData; locale: Locale}) {
  return (
    <article className="card result-card">
      <div className="result-card-meta">
        <StatusBadge status={item.status} locale={locale} />
        <span>{item.id}</span>
      </div>
      <h3>
        <Link href={href(locale, `/results/${item.slug}`)} prefetch={false}>{item.title}</Link>
      </h3>
      <p className="result-card-excerpt line-clamp-4">{item.excerpt}</p>
      <p className="result-card-date">{tr(D.results.updated, locale)} {item.updated}</p>
    </article>
  );
}

export function FamilyCard({item, locale}: {item: {slug: string; title: string; description: string; recordCount: number; updated: string}; locale: Locale}) {
  return (
    <article className="card result-card family-card">
      <div className="result-card-meta">
        <span className="family-tag">{item.recordCount > 1 ? (locale === 'pt' ? 'Família de testes' : 'Test family') : (locale === 'pt' ? 'Teste' : 'Test')}</span>
        <span>{item.recordCount} {locale === 'pt' ? (item.recordCount === 1 ? 'registro' : 'registros') : (item.recordCount === 1 ? 'record' : 'records')}</span>
      </div>
      <h3>
        <CatalogueTitle slug={item.slug}>
          <Link href={href(locale, '/results/families/' + item.slug)} prefetch={false} transitionTypes={[catalogueTitleTransition]}>{item.title}</Link>
        </CatalogueTitle>
      </h3>
      <p className="result-card-excerpt line-clamp-4">{item.description}</p>
      <p className="result-card-date">{locale === 'pt' ? 'Último registro' : 'Latest record'}: {item.updated}</p>
    </article>
  );
}
