import {D, tr} from '@/lib/dict';
import type {Locale} from '@/lib/i18n';

type Bin = {name: string; count: number};

// Server-rendered SVG, no client JavaScript. A table with the same numbers sits under the figure.
export function ActivityChart({bins, total, locale}: {bins: Bin[]; total: number; locale: Locale}) {
  if (!bins.length) return null;
  const rows = bins.slice(0, 8);
  const width = 640, rowHeight = 30, left = 112, right = 44, top = 8;
  const height = top + rows.length * rowHeight + 24;
  const max = Math.max(...rows.map(row => row.count));
  const x = (value: number) => left + ((width - left - right) * value) / max;
  return (
    <figure className="card p-4 md:p-5">
      <figcaption className="mb-3">
        <p className="kicker">{tr(D.hero.chartTitle, locale)}</p>
        <p className="mt-1 text-sm text-muted">{tr(D.hero.caption, locale)}</p>
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${tr(D.hero.chartTitle, locale)}: ${rows.map(row => `${row.name} ${row.count}`).join(', ')}`} className="h-auto w-full">
        {rows.map((row, index) => {
          const y = top + index * rowHeight;
          return (
            <g key={row.name}>
              <text x={left - 10} y={y + 19} textAnchor="end" fontSize="13" fill="var(--ink)" fontFamily="var(--font-plex-mono)">{row.name}</text>
              <rect x={left} y={y + 5} width={x(row.count) - left} height={LABEL_BAR} rx="3" fill="var(--accent)" opacity="0.9" />
              <text x={x(row.count) + 6} y={y + 19} fontSize="13" fill="var(--muted)" fontFamily="var(--font-plex-mono)">{row.count}</text>
            </g>
          );
        })}
        <line x1={left} x2={left} y1={top} y2={top + rows.length * rowHeight} stroke="var(--line)" />
      </svg>
      <p className="mt-2 font-mono text-xs text-muted">n = {total} {tr(D.hero.unit, locale)}</p>
      <details className="mt-2 text-sm">
        <summary className="text-accent underline underline-offset-4">{locale === 'pt' ? 'Ver dados' : 'View data'}</summary>
        <table className="mt-2 w-full text-left">
          <thead><tr><th className="py-1 font-medium">Dataset</th><th className="py-1 font-medium">{tr(D.hero.unit, locale)}</th></tr></thead>
          <tbody>{bins.map(row => <tr key={row.name} className="border-t border-line"><td className="py-1 font-mono">{row.name}</td><td className="py-1 font-mono">{row.count}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}

const LABEL_BAR = 20;
