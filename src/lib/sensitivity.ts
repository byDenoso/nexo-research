import type {Result} from './schemas.ts';

// Public runs whose key figure is "reduction in fit improvement" after removing one redshift
// range from one supernova compilation. Read from the manifest figures only; nothing is fitted,
// averaged or combined here.
export type SensitivityPoint = {
  id: string;
  slug: string;
  compilation: string;
  zLow: number;
  zHigh: number;
  value: number;
};

const LABEL = /^(.+?): remove z = (\d+(?:\.\d+)?)[–-](\d+(?:\.\d+)?)$/;

export function sensitivityPoints(results: Result[]): SensitivityPoint[] {
  return results.flatMap(item => {
    const figure = item.figure;
    if (!figure || figure.y.unit !== '%' || figure.y.label.en !== 'Reduction in fit improvement') return [];
    if (figure.series.length !== 1 || figure.series[0]!.points.length !== 1) return [];
    const match = LABEL.exec(figure.series[0]!.label.en);
    const value = figure.series[0]!.points[0]!.y;
    if (!match || !Number.isFinite(value)) return [];
    return [{id: item.id, slug: item.slug, compilation: match[1]!, zLow: Number(match[2]), zHigh: Number(match[3]), value}];
  });
}

export type SensitivityRow = {key: string; compilation: string; zLow: number; zHigh: number; points: SensitivityPoint[]};

// One row per (compilation, removed range). Compilations keep first-seen order by name so a
// compilation never changes colour when the snapshot grows; ranges sort by their upper edge.
export function sensitivityRows(points: SensitivityPoint[]): SensitivityRow[] {
  const rows = new Map<string, SensitivityRow>();
  for (const point of points) {
    const key = `${point.compilation}|${point.zLow}|${point.zHigh}`;
    let row = rows.get(key);
    if (!row) {
      row = {key, compilation: point.compilation, zLow: point.zLow, zHigh: point.zHigh, points: []};
      rows.set(key, row);
    }
    row.points.push(point);
  }
  for (const row of rows.values()) row.points.sort((a, b) => a.value - b.value || a.id.localeCompare(b.id));
  return [...rows.values()].sort((a, b) =>
    a.compilation.localeCompare(b.compilation) || a.zHigh - b.zHigh || a.zLow - b.zLow);
}

export const compilations = (points: SensitivityPoint[]): string[] => [...new Set(points.map(point => point.compilation))].sort();
