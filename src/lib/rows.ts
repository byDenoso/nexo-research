import {fmtDate, pick, type Locale} from './i18n.ts';
import type {Result} from './schemas.ts';
import type {Row} from '../components/ResultsBrowser.tsx';

export function toRows(results: Result[], locale: Locale): Row[] {
  return results.map(item => ({
    slug: item.slug, id: item.id, title: pick(item.title, locale), excerpt: pick(item.result, locale), status: item.status, lines: item.lines,
    year: item.updatedAt.slice(0, 4), updated: fmtDate(item.updatedAt, locale),
    haystack: `${item.question['pt-BR']} ${item.question.en} ${item.result['pt-BR']} ${item.result.en} ${item.id}`.toLowerCase()
  }));
}
