import {D, tr} from '@/lib/dict';
import type {Locale} from '@/lib/i18n';

type Bin = {name: string; count: number};

// Server-rendered SVG, no client JavaScript. A table with the same numbers sits under the figure.
export function ActivityChart({bins, total, locale}: {bins: Bin[]; total: number; locale: Locale}) {
  if (!bins.length) return null;
  const rows = bins.slice(0, 8);
  const max = Math.max(...rows.map(row => row.count));
  if (max <= 0) return null;
  const title = tr(D.hero.chartTitle, locale);
  return (
    <figure className="card activity-chart">
      <figcaption className="activity-caption">
        <p className="activity-title">{title}</p>
        <p>{tr(D.hero.caption, locale)}</p>
      </figcaption>
      <ul className="activity-rows" role="list" aria-label={title}>
        {rows.map(row => (
          <li key={row.name} className="activity-row">
            <span>{row.name}</span>
            <svg viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true" className="activity-track">
              <rect width={row.count / max * 100} height="8" />
            </svg>
            <span className="activity-value">{row.count}</span>
          </li>
        ))}
      </ul>
      <details className="activity-disclosure">
        <summary>
          <span className="activity-sample">n = {total} {tr(D.hero.unit, locale)}</span>
          <span className="disclosure-label">{tr(D.hero.viewData, locale)}</span>
        </summary>
        <table className="activity-table">
          <caption className="sr-only">{title}</caption>
          <thead><tr><th scope="col">{tr(D.results.dataset, locale)}</th><th scope="col">{tr(D.hero.unit, locale)}</th></tr></thead>
          <tbody>{bins.map(row => <tr key={row.name}><th scope="row">{row.name}</th><td>{row.count}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}
