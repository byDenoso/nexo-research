'use client';

import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {useMemo, useState} from 'react';
import {D, tr} from '@/lib/dict';
import {LINES, STATUSES} from '@/lib/schemas';
import type {Line, Status} from '@/lib/schemas';

// Plain data only: the server passes pre-localised strings, so no manifest-sized object crosses to the client twice.
export type Row = {slug: string; id: string; title: string; excerpt: string; status: Status; lines: Line[]; year: string; updated: string; haystack: string};
const PAGE = 24;

const asLine = (value: string | null): Line | 'all' => ((LINES as readonly string[]).includes(value ?? '') ? (value as Line) : 'all');
const asStatus = (value: string | null): Status | 'all' => ((STATUSES as readonly string[]).includes(value ?? '') ? (value as Status) : 'all');

export function ResultsBrowser({rows, locale}: {rows: Row[]; locale: 'pt' | 'en'}) {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [line, setLine] = useState<Line | 'all'>(asLine(params.get('line')));
  const [status, setStatus] = useState<Status | 'all'>(asStatus(params.get('status')));
  const [year, setYear] = useState('all');
  const [limit, setLimit] = useState(PAGE);
  const f = D.filters;
  const years = useMemo(() => [...new Set(rows.map(row => row.year))].sort().reverse(), [rows]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter(row => (line === 'all' || row.lines.includes(line)) && (status === 'all' || row.status === status) && (year === 'all' || row.year === year) && (!needle || row.haystack.includes(needle)));
  }, [rows, query, line, status, year]);
  const reset = () => { setQuery(''); setLine('all'); setStatus('all'); setYear('all'); setLimit(PAGE); };
  const field = 'mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-ink';
  const change = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); setLimit(PAGE); };

  return (
    <div>
      <form role="search" onSubmit={event => event.preventDefault()} className="card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm text-muted">{tr(f.search, locale)}
          <input type="search" value={query} onChange={event => change(setQuery)(event.target.value)} className={field} autoComplete="off" />
        </label>
        <label className="text-sm text-muted">{tr(f.line, locale)}
          <select value={line} onChange={event => change(setLine)(event.target.value as Line | 'all')} className={field}>
            <option value="all">{tr(f.all, locale)}</option>
            {LINES.map(code => <option key={code} value={code}>{tr(D.lines.items[code].n, locale)}</option>)}
          </select>
        </label>
        <label className="text-sm text-muted">{tr(f.status, locale)}
          <select value={status} onChange={event => change(setStatus)(event.target.value as Status | 'all')} className={field}>
            <option value="all">{tr(f.all, locale)}</option>
            {STATUSES.map(code => <option key={code} value={code}>{tr(D.status[code].n, locale)}</option>)}
          </select>
        </label>
        <label className="text-sm text-muted">{tr(f.year, locale)}
          <select value={year} onChange={event => change(setYear)(event.target.value)} className={field}>
            <option value="all">{tr(f.all, locale)}</option>
            {years.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </form>
      <p className="mt-4 font-mono text-sm text-muted" role="status" aria-live="polite">{Math.min(limit, filtered.length)} {tr(f.of, locale)} {filtered.length} {tr(f.shown, locale)}</p>
      {filtered.length === 0 ? (
        <p className="mt-6">{tr(f.none, locale)} <button type="button" onClick={reset} className="text-accent underline underline-offset-4">{tr(f.reset, locale)}</button></p>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.slice(0, limit).map(row => (
            <li key={row.id}>
              <article className="card flex h-full flex-col p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-xs text-muted">{tr(D.status[row.status].n, locale)}</span>
                  <span className="font-mono text-xs text-muted">{row.id}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold leading-snug"><Link href={`/${locale}/results/${row.slug}`} className="hover:text-accent">{row.title}</Link></h3>
                <p className="mt-3 line-clamp-4 text-sm text-muted">{row.excerpt}</p>
                <p className="mt-auto pt-4 font-mono text-xs text-muted">{row.updated}</p>
              </article>
            </li>
          ))}
        </ul>
      )}
      {limit < filtered.length && <div className="mt-8 text-center"><button type="button" className="btn" onClick={() => setLimit(value => value + PAGE)}>{tr(f.more, locale)}</button></div>}
    </div>
  );
}
