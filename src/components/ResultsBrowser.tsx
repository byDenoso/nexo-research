'use client';

import {useEffect, useMemo, useState} from 'react';
import {D, tr} from '@/lib/dict';
import type {Locale} from '@/lib/i18n';
import type {Line, Status} from '@/lib/schemas';
import {PAGE_SIZE as PAGE, matches} from '@/lib/search';
import {href} from '@/lib/seo';
import {EmptyState, FamilyCard} from './ui';

export type FamilyRow = {
  slug: string;
  title: string;
  description: string;
  recordCount: number;
  updated: string;
  year: string;
  lines: Line[];
  statuses: Status[];
  surveys: string[];
  haystack: string;
};
const lines = Object.keys(D.lines.items) as Line[];
const statuses = Object.keys(D.status) as Status[];
const asLine = (value: string | null): Line | 'all' => (lines.some(line => line === value) ? value as Line : 'all');
const asStatus = (value: string | null): Status | 'all' => (statuses.some(status => status === value) ? value as Status : 'all');

export function ResultsBrowser({rows, locale}: {rows: FamilyRow[]; locale: Locale}) {
  const [query, setQuery] = useState('');
  const [line, setLine] = useState<Line | 'all'>('all');
  const [status, setStatus] = useState<Status | 'all'>('all');
  const [survey, setSurvey] = useState('all');
  const [year, setYear] = useState('all');
  const [page, setPage] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') ?? '');
    setLine(asLine(params.get('line')));
    setStatus(asStatus(params.get('status')));
    setSurvey(params.get('survey') ?? 'all');
    setYear(params.get('year') ?? 'all');
    setPage(Math.max(1, Math.min(100, Number(params.get('page')) || 1)));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (line !== 'all') params.set('line', line);
    if (status !== 'all') params.set('status', status);
    if (survey !== 'all') params.set('survey', survey);
    if (year !== 'all') params.set('year', year);
    if (page > 1) params.set('page', String(page));
    const search = params.toString();
    const next = window.location.pathname + (search ? '?' + search : '') + window.location.hash;
    if (next !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.replaceState(window.history.state, '', next);
    }
  }, [query, line, status, survey, year, page, hydrated]);

  const f = D.filters;
  const availableLines = useMemo(() => lines.filter(code => rows.some(row => row.lines.includes(code))), [rows]);
  const availableStatuses = useMemo(() => statuses.filter(code => rows.some(row => row.statuses.includes(code))), [rows]);
  const availableSurveys = useMemo(() => [...new Set(rows.flatMap(row=>row.surveys))].sort(),[rows]);
  const years = useMemo(() => [...new Set(rows.map(row => row.year))].sort().reverse(), [rows]);
  const filtered = useMemo(() => {
    return rows.filter(row =>
      (line === 'all' || row.lines.includes(line)) &&
      (status === 'all' || row.statuses.includes(status)) &&
      (survey === 'all' || row.surveys.includes(survey)) &&
      (year === 'all' || row.year === year) &&
      (!query.trim() || matches(row.haystack, query))
    );
  }, [rows, query, line, status, survey, year]);
  const shown = filtered.slice(0, page * PAGE);
  const executionCount = filtered.reduce((total, item) => total + item.recordCount, 0);
  const reset = () => {setQuery(''); setLine('all'); setStatus('all'); setSurvey('all'); setYear('all'); setPage(1);};
  const change = <T,>(setter: (value: T) => void) => (value: T) => {setter(value); setPage(1);};

  return (
    <div>
      <form role="search" onSubmit={event => event.preventDefault()} className="card results-filters">
        <label className="wide-filter">{tr(f.search, locale)}
          <input type="search" value={query} onChange={event => change(setQuery)(event.target.value)} autoComplete="off" />
        </label>
        {availableLines.length > 1 && (
          <label className="wide-filter">{tr(f.line, locale)}
            <select value={line} onChange={event => change(setLine)(event.target.value as Line | 'all')}>
              <option value="all">{tr(f.all, locale)}</option>
              {availableLines.map(code => (
                <option key={code} value={code}>{tr(D.lines.items[code].n, locale)} ({rows.filter(row => row.lines.includes(code)).length})</option>
              ))}
            </select>
          </label>
        )}
        {availableSurveys.length > 0 && (
          <label>{locale === 'pt' ? 'Levantamento mencionado' : 'Mentioned survey'}
            <select value={survey} onChange={event => change(setSurvey)(event.target.value)}>
              <option value="all">{tr(f.all, locale)}</option>
              {availableSurveys.map(code => <option key={code} value={code}>{code} ({rows.filter(row => row.surveys.includes(code)).length})</option>)}
            </select>
          </label>
        )}
        {availableStatuses.length > 1 && (
          <label>{tr(f.status, locale)}
            <select value={status} onChange={event => change(setStatus)(event.target.value as Status | 'all')}>
              <option value="all">{tr(f.all, locale)}</option>
              {availableStatuses.map(code => <option key={code} value={code}>{tr(D.status[code].n, locale)} ({rows.filter(row => row.statuses.includes(code)).length})</option>)}
            </select>
          </label>
        )}
        {years.length > 1 && (
          <label>{tr(f.year, locale)}
            <select value={year} onChange={event => change(setYear)(event.target.value)}>
              <option value="all">{tr(f.all, locale)}</option>
              {years.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        )}
      </form>
      <p className="filter-precision-note">{locale === 'pt'
        ? 'Levantamentos são identificados por menção textual nos resumos; a opção não comprova uso direto dos dados. O filtro de estágio aparece quando houver mais de um estado autorizado.'
        : 'Surveys are identified by textual mentions in summaries; this does not establish direct dataset usage. The stage filter appears when more than one approved status is available.'}</p>
      <h2 className="sr-only">{tr(f.records, locale)}</h2>
      <p className="results-count" role="status" aria-live="polite" aria-atomic="true">
        {shown.length} {tr(f.of, locale)} {filtered.length} {locale === 'pt' ? 'perguntas/famílias exibidas' : 'questions/families shown'} · {executionCount} {locale === 'pt' ? 'registros de execução' : 'execution records'}
      </p>
      {filtered.length === 0 ? (
        <EmptyState message={tr(f.none, locale)} action={<button type="button" onClick={reset} className="btn">{tr(f.reset, locale)}</button>} />
      ) : (
        <ul className="result-grid" role="list">
          {shown.map(row => <li key={row.slug}><FamilyCard item={row} locale={locale} /></li>)}
        </ul>
      )}
      {shown.length < filtered.length && (
        <div className="results-more">
          {hydrated
            ? <button type="button" className="btn" onClick={() => setPage(value => value + 1)}>{tr(f.more, locale)}</button>
            // Before scripts run the same control is a link to the next server-rendered page.
            : <a className="btn" href={href(locale, '/results/page/2')}>{tr(f.more, locale)}</a>}
        </div>
      )}
    </div>
  );
}
