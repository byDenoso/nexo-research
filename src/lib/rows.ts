import {fmtDate, pick, type Locale} from './i18n.ts';
import type {Result} from './schemas.ts';
import type {Row} from '../components/ResultsBrowser.tsx';
import type {ResultCardData} from '../components/ui.tsx';

export function toResultCard(item: Result, locale: Locale): ResultCardData {
  return {
    slug: item.slug, id: item.id, title: pick(item.title, locale),
    excerpt: pick(item.result, locale), status: item.status, updated: fmtDate(item.updatedAt, locale)
  };
}

export function toRows(results: Result[], locale: Locale): Row[] {
  return results.map(item => ({
    ...toResultCard(item, locale), lines: item.lines, year: item.updatedAt.slice(0, 4),
    haystack: `${item.question['pt-BR']} ${item.question.en} ${item.result['pt-BR']} ${item.result.en} ${item.id}`.toLowerCase()
  }));
}
