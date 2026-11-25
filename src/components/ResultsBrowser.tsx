'use client';

import Link from 'next/link';
import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {D, tr} from '@/lib/dict';
import type {Locale} from '@/lib/i18n';
import type {Line, Status} from '@/lib/schemas';
import {PAGE_SIZE as PAGE, matches} from '@/lib/search';
import {href} from '@/lib/seo';
import {EmptyState, StatusBadge} from './ui';

export type FamilyRow = {
  slug: string;
  title: string;
  description: string;
  finding: string;
  entrySlug: string;
  negative: boolean;
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
  const [sort,setSort] = useState('editorial');
  const [query, setQuery] = useState('');
  const [line, setLine] = useState<Line | 'all'>('all');
  const [status, setStatus] = useState<Status | 'all'>('all');
  const [survey, setSurvey] = useState('all');
  const [outcome, setOutcome] = useState('all');
  const [year, setYear] = useState('all');
  const [page, setPage] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const read = () => {
    const params = new URLSearchParams(window.location.search);
    const order=params.get("sort") ?? "";
    setSort(["latest","title","runs"].includes(order) ? order : "editorial");
    setQuery(params.get('q') ?? '');
    setLine(asLine(params.get('line')));
    setStatus(asStatus(params.get('status')));
    setSurvey(params.get('survey') ?? 'all');
    setOutcome(params.get('outcome') === 'negative' ? 'negative' : 'all');
    setYear(params.get('year') ?? 'all');
    setPage(Math.max(1, Math.min(100, Number(params.get('page')) || 1)));
    setHydrated(true);
    }; read(); window.addEventListener("popstate",read); return ()=>window.removeEventListener("popstate",read);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (sort!=='editorial') params.set('sort',sort);
    if (query.trim()) params.set('q', query.trim());
    if (line !== 'all') params.set('line', line);
    if (status !== 'all') params.set('status', status);
    if (survey !== 'all') params.set('survey', survey);
    if (outcome !== 'all') params.set('outcome', outcome);
    if (year !== 'all') params.set('year', year);
    if (page > 1) params.set('page', String(page));
    const search = params.toString();
    const next = window.location.pathname + (search ? '?' + search : '') + window.location.hash;
    if (next !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.replaceState(window.history.state, '', next);
    }
  }, [query, line, status, survey, year, outcome, page, hydrated, sort]);

  const f = D.filters;
  const availableLines = lines; // Keep a zero-count research area selectable when linked from /research.
  const availableStatuses = useMemo(() => statuses.filter(code => rows.some(row => row.statuses.includes(code))), [rows]);
  const availableSurveys = useMemo(() => [...new Set(rows.flatMap(row=>row.surveys))].sort(),[rows]);
  const years = useMemo(() => [...new Set(rows.map(row => row.year))].sort().reverse(), [rows]);
  const filtered = useMemo(() => {
    const result=rows.filter(row =>
      (line === 'all' || row.lines.includes(line)) &&
      (status === 'all' || row.statuses.includes(status)) &&
      (survey === 'all' || row.surveys.includes(survey)) &&
      (year === 'all' || row.year === year) &&
      (outcome === 'all' || row.negative) &&
      (!query.trim() || matches(row.haystack, query))
    );
    if(sort==="latest") result.sort((a,b)=>b.updated.localeCompare(a.updated));
    if(sort==="title") result.sort((a,b)=>a.title.localeCompare(b.title,locale));
    if(sort==="runs") result.sort((a,b)=>b.recordCount-a.recordCount);
    return result;
  }, [sort, locale, rows, query, line, status, survey, year, outcome]);
  const shown = filtered.slice(0, page * PAGE);
  const indexRef = useRef<HTMLUListElement>(null);
  const before = useRef(new Map<string, DOMRect>());
  // Capture before React commits the new order; use layout coordinates independent of page scroll.
  const remember = () => {
    before.current.clear();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    indexRef.current?.querySelectorAll<HTMLElement>('[data-family]').forEach(el =>
      before.current.set(el.dataset.family!, el.getBoundingClientRect()));
  };
  useLayoutEffect(() => {
    const list = indexRef.current;
    if (!list || !before.current.size) return;
    for (const el of list.querySelectorAll<HTMLElement>('[data-family]')) {
      const old = before.current.get(el.dataset.family!);
      if (!old) continue;
      const next = el.getBoundingClientRect(), dy = old.top - next.top;
      if (dy && Math.abs(dy) < innerHeight && next.top < innerHeight && next.bottom > 0)
        el.animate([{transform: `translateY(${dy}px)`}, {transform: 'translateY(0)'}], {duration: 240, easing: 'cubic-bezier(.2,.75,.3,1)'});
    }
    before.current.clear();
  }, [filtered, page]);
  const executionCount = filtered.reduce((total, item) => total + item.recordCount, 0);
  const reset = () => {setSort('editorial');setQuery(''); setLine('all'); setStatus('all'); setSurvey('all'); setYear('all'); setOutcome('all'); setPage(1);};
  const change = <T,>(setter: (value: T) => void) => (value: T) => {setter(value); setPage(1);};

  return (
    <div>
      <form onChangeCapture={remember} onClickCapture={remember} role="search" onSubmit={event => event.preventDefault()} className="results-filters nx-filters">
        <label className="wide-filter">{tr(f.search, locale)}
          <input placeholder={locale === 'pt' ? 'Pergunta, levantamento ou identificador…' : 'Question, survey or identifier…'} type="search" value={query} onChange={event => change(setQuery)(event.target.value)} autoComplete="off" />
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
        {availableStatuses.length > 0 && (
          <label>{tr(f.status, locale)}
            <select value={status} onChange={event => change(setStatus)(event.target.value as Status | 'all')}>
              <option value="all">{tr(f.all, locale)}</option>
              {availableStatuses.map(code => <option key={code} value={code}>{tr(D.status[code].n, locale)} ({rows.filter(row => row.statuses.includes(code)).length})</option>)}
            </select>
          </label>
        )}
        <label>{locale === 'pt' ? 'Desfecho' : 'Outcome'}<select value={outcome} onChange={event => change(setOutcome)(event.target.value)}><option value="all">{locale === 'pt' ? 'Todos os resultados' : 'All results'}</option><option value="negative">{locale === 'pt' ? 'Resultado negativo em destaque' : 'Featured negative result'}</option></select></label>
        {years.length > 1 && (
          <label>{tr(f.year, locale)}
            <select value={year} onChange={event => change(setYear)(event.target.value)}>
              <option value="all">{tr(f.all, locale)}</option>
              {years.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        )}
        <label>{locale==='pt'?'Ordenar por':'Sort by'}<select value={sort} onChange={e=>change(setSort)(e.target.value)}>
          <option value="editorial">{locale==='pt'?'Ordem editorial':'Editorial order'}</option><option value="latest">{locale==='pt'?'Mais recentes':'Most recent'}</option><option value="title">A–Z</option><option value="runs">{locale==='pt'?'Mais execuções':'Most runs'}</option></select></label>
      </form>
      <p className="filter-precision-note">{locale === 'pt'
        ? 'Levantamentos são identificados pelas menções nos resumos.'
        : 'Surveys are identified from mentions in the summaries.'}</p>
      <h2 className="nx-index-title">{locale === 'pt' ? 'Perguntas científicas' : 'Research questions'}</h2>
      <p className="results-count" role="status" aria-live="polite" aria-atomic="true">
        {shown.length} {tr(f.of, locale)} {filtered.length} {locale === 'pt' ? 'questões exibidas' : 'questions shown'} · {executionCount} {locale === 'pt' ? 'registros de testes' : 'test records'}
      </p>
      {filtered.length === 0 ? (
        <EmptyState message={tr(f.none, locale)} action={<button type="button" onClick={reset} className="btn">{tr(f.reset, locale)}</button>} />
      ) : (
        <ul ref={indexRef} className="nx-question-index" role="list">
          {shown.map(row => (
            <li data-family={row.slug} key={row.slug}>
              <article>
                <div>
                  <h3><Link href={href(locale, '/results/families/' + row.slug)}>{row.title}</Link></h3>
                  <p>{row.description}</p>
                </div>
                <div className="nx-question-run">
                  <p>{row.recordCount} {locale === 'pt' ? (row.recordCount === 1 ? 'execução' : 'execuções') : (row.recordCount === 1 ? 'run' : 'runs')}</p>
                  <Link className="text-link arrow-link" href={href(locale, '/results/' + row.entrySlug)}
                    aria-label={(locale === 'pt' ? 'Ler uma execução de ' : 'Read a run for ') + row.title}>
                    {locale === 'pt' ? 'Ler uma execução' : 'Read a run'}
                  </Link>
                  <div className="nx-question-status">
                    {row.statuses.map(status => <StatusBadge key={status} status={status} locale={locale} />)}
                    {row.negative && <span className="outcome-tag">{locale === 'pt' ? 'Resultado negativo' : 'Negative result'}</span>}
                  </div>
                </div>
              </article>
            </li>
          ))}
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
