import {CountUp} from '@/components/Motion';
import {pick, type Locale} from '@/lib/i18n';
import {scientificText} from '@/lib/format';
import type {Result} from '@/lib/schemas';

// Two published values of the same quantity on one axis (a "before and after"). Server-rendered
// HTML, no script: both values are printed, so the positions only add the visual distance.
export function pairOf(item: Result): {labels: [string, string]; values: [number, number]} | undefined {
  const figure = item.figure;
  if (!figure || figure.series.length !== 2) return undefined;
  const [first, second] = figure.series;
  if (first!.points.length !== 1 || second!.points.length !== 1) return undefined;
  const values: [number, number] = [first!.points[0]!.y, second!.points[0]!.y];
  if (!values.every(value => Number.isFinite(value) && value >= 0)) return undefined;
  return {labels: [first!.label.en, second!.label.en], values};
}

const niceMax = (value: number): number => {
  const step = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / step) * step;
};

export function PairChart({item, locale, compact = false}: {item: Result; locale: Locale; compact?: boolean}) {
  const pair = pairOf(item);
  const figure = item.figure;
  if (!pair || !figure) return null;
  const max = niceMax(Math.max(...pair.values));
  if (!(max > 0)) return null;
  const number = new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-GB', {maximumFractionDigits: 3});
  const unit = figure.y.unit;
  const labels = figure.series.map(series => scientificText(pick(series.label, locale), locale));
  const [from, to] = pair.values;
  const low = Math.min(from, to), high = Math.max(from, to);
  const ticks = [0, max / 2, max];
  return (
    <figure className="viz pair" data-inview="" data-compact={compact ? '' : undefined}>
      <figcaption className="viz-head">
        <p className="viz-title">{pick(figure.y.label, locale)}{unit ? ` (${unit})` : ''}</p>
      </figcaption>
      <div className="pair-plot" aria-hidden="true">
        <div className="pair-track">
          <span className="pair-link" data-dir={to < from ? 'down' : 'up'} style={{insetInlineStart: `${100 * low / max}%`, inlineSize: `${100 * (high - low) / max}%`}} />
          <span className="pair-dot" data-step="0" style={{insetInlineStart: `${100 * from / max}%`}} />
          <span className="pair-dot" data-step="1" style={{insetInlineStart: `${100 * to / max}%`, '--from': `${100 * from / max}%`} as React.CSSProperties} />
        </div>
        <div className="sens-ticks">{ticks.map(tick => <span key={tick} style={{insetInlineStart: `${100 * tick / max}%`}}>{number.format(tick)}{unit}</span>)}</div>
      </div>
      <dl className="pair-values">
        {pair.values.map((value, index) => (
          <div key={index}>
            <dt><span className="pair-key" data-step={index} aria-hidden="true" />{labels[index]}</dt>
            <dd><CountUp value={value} locale={locale === 'pt' ? 'pt-BR' : 'en-GB'} digits={(String(value).split('.')[1] ?? '').length} />{unit ? ` ${unit}` : ''}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
