'use client';

import {useEffect, useMemo, useState} from 'react';
import {D, tr} from '@/lib/dict';
import type {Line, Status} from '@/lib/schemas';
import {EmptyState, ResultCard, type ResultCardData} from './ui';

// Plain data only: the server passes pre-localised strings, so no manifest-sized object crosses to the client twice.
export type Row = ResultCardData & {lines: Line[]; year: string; haystack: string};
const PAGE = 24;
const lines = Object.keys(D.lines.items) as Line[];
const statuses = Object.keys(D.status) as Status[];

const asLine = (value: string | null): Line | 'all' => ((lines as readonly string[]).includes(value ?? '') ? (value as Line) : 'all');
const asStatus = (value: string | null): Status | 'all' => ((statuses as readonly string[]).includes(value ?? '') ? (value as Status) : 'all');

export function ResultsBrowser({rows, locale}: {rows: Row[]; locale: 'pt' | 'en'}) {
  const [query, setQuery] = useState('');
  const [line, setLine] = useState<Line | 'all'>('all');
  const [status, setStatus] = useState<Status | 'all'>('all');
  const [year, setYear] = useState('all');
  const [limit, setLimit] = useState(PAGE);
  // Keep the initial catalog in the static HTML and apply URL filters after hydration.
  useEffect(() => {
    if (!window.location.search) return;
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') ?? '');
    setLine(asLine(params.get('line')));
    setStatus(asStatus(params.get('status')));
  }, []);
  const f = D.filters;
  const years = useMemo(() => [...new Set(rows.map(row => row.year))].sort().reverse(), [rows]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle && line === 'all' && status === 'all' && year === 'all') return rows;
    return rows.filter(row => (line === 'all' || row.lines.includes(line)) && (status === 'all' || row.status === status) && (year === 'all' || row.year === year) && (!needle || row.haystack.includes(needle)));
  }, [rows, query, line, status, year]);
  const reset = () => { setQuery(''); setLine('all'); setStatus('all'); setYear('all'); setLimit(PAGE); };
  const change = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); setLimit(PAGE); };

  return (
    <div>
      <form role="search" onSubmit={event => event.preventDefault()} className="card results-filters">
        <label className="wide-filter">{tr(f.search, locale)}
          <input type="search" value={query} onChange={event => change(setQuery)(event.target.value)} autoComplete="off" />
        </label>
        <label className="wide-filter">{tr(f.line, locale)}
          <select value={line} onChange={event => change(setLine)(event.target.value as Line | 'all')}>
            <option value="all">{tr(f.all, locale)}</option>
            {lines.map(code => <option key={code} value={code}>{tr(D.lines.items[code].n, locale)}</option>)}
          </select>
        </label>
        <label>{tr(f.status, locale)}
          <select value={status} onChange={event => change(setStatus)(event.target.value as Status | 'all')}>
            <option value="all">{tr(f.all, locale)}</option>
            {statuses.map(code => <option key={code} value={code}>{tr(D.status[code].n, locale)}</option>)}
          </select>
        </label>
        <label>{tr(f.year, locale)}
          <select value={year} onChange={event => change(setYear)(event.target.value)}>
            <option value="all">{tr(f.all, locale)}</option>
            {years.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </form>
      <h2 className="sr-only">{tr(f.records, locale)}</h2>
      <p className="results-count" role="status" aria-live="polite">{Math.min(limit, filtered.length)} {tr(f.of, locale)} {filtered.length} {tr(f.shown, locale)}</p>
      {filtered.length === 0 ? (
        <EmptyState message={tr(f.none, locale)} action={<button type="button" onClick={reset} className="btn">{tr(f.reset, locale)}</button>} />
      ) : (
        <ul className="result-grid" role="list">
          {filtered.slice(0, limit).map(row => <li key={row.id}><ResultCard item={row} locale={locale} /></li>)}
        </ul>
      )}
      {limit < filtered.length && <div className="results-more"><button type="button" className="btn" onClick={() => setLimit(value => value + PAGE)}>{tr(f.more, locale)}</button></div>}
    </div>
  );
}
